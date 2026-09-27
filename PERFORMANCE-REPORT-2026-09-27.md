# hinahina:// 絞り開始時の処理落ち — パフォーマンス測定レポート

測定日：2026-09-27

対象：[公開サイト](https://hinahina-vr.github.io/portfolio/)

検証したコミット：`0f637e0a02d8dbddf5b4f4907d17af08205e776b`（build.json照合、package version 2.6.2）

**処理落ちは再現した。主因は、絞り開始時に毎回実行している4K画像の同期テクスチャ転送。イージングの変更では解消しない。**

通常のPC表示で開始付近に333〜484msのフレーム間隔が発生した。60Hz換算で約20〜29フレーム分の更新が空く。平均fpsだけではこの停止が隠れる。先の修正で処理性能まで改善したと判断したのは誤りだった。

## 測定条件と範囲

- Windows上の専用headless Chrome 153.0.8010.53、NVIDIA RTX A4000、WebGL/GPU compositing有効。24論理プロセッサをブラウザが報告。
- 本番URLを開き、オープニング完了後に通常表示を計測。その後「惑星の放課後 → GLSL Effects Showcase → 惑星の放課後 → GLSL Effects Showcase」を実際にクリックした。
- PC 1920×1080・DPR 1を2セット、高DPI PC・DPR 2を1セット、390×844・DPR 3を1セット。別途、詳細プロファイルと画像サイズ比較を各1セット。計18回の切り替え。
- 各セットは新しい専用Chromeで実施。初回とは「そのページで最初の切り替え」であり、OS/ドライバーのシェーダーキャッシュまで空にした状態ではない。
- 主計測はrequestAnimationFrameの間隔とPerformanceObserver。CPU/ネットワークの速度制限なし。詳細計測ではCPUサンプリング、DevTools ProtocolのPerformance trace、WebGL APIの呼び出し時間も記録した。
- DevTools MCPは既存ブラウザのプロファイル競合で接続できず、独立したPlaywright ChromeにCDP接続した。計測ブラウザの同時実行はしていない。
- 動画・連続スクリーンショットは撮っていない。アプリのソース、公開画像、公開サイトは変更していない。
- スマホ欄は**PC上の画面/DPR再現**。Android/iPhone実機やSafariの性能は未測定。GPU単独の実行時間、実VRAM使用量、実ユーザーのINPも未測定。

## 実測結果

開始停止は、絞り開始をDOMで観測した最初の500msにかかる最大rAF間隔。同期準備で詰まった時間も含む。fpsはrAFの実効更新頻度で、画面に実際に提示されたフレームの計数ではない。

| 条件 | 通常表示の実効fps | 初回の開始停止 | 2回目 | 3回目 |
|---|---:|---:|---:|---:|
| PC 1920×1080 / DPR 1 | 53.4 | 433ms | 417ms | 367ms |
| 同条件を再測定 | 56.7 | 484ms | 400ms | 333ms |
| PC 1920×1080 / DPR 2 | 51.1 | 433ms | 400ms | 333ms |
| スマホ相当 390×844 / DPR 3 | 60.0 | 450ms | 383ms | 333ms |

通常PCの絞り区間全体の平均は45.8〜52.6fpsだが、開始時に約0.4秒止まる。したがって今回の評価指標は平均fpsより、**開始前後の最大フレーム間隔と50ms超の停止回数**が適している。

初回の背景切り替えにも別の長いフレームがある。背景フェード → 絞りの順序自体は実装されているが、その境目に重い準備を実行しているため、順序を守るだけでは滑らかにならない。

## 原因1：4K画像を毎回3回転送している【最優先・確認済み】

詳細計測の `texSubImage2D` 同期呼び出し時間：

| 切り替え | 絞り用・旧画像 | 絞り用・新画像 | 液体用・新画像 | 合計 |
|---|---:|---:|---:|---:|
| 初回 | 156.7ms | 104.4ms | 101.5ms | 362.6ms |
| 2回目 | 108.7ms | 148.3ms | 142.8ms | 399.8ms |
| 3回目 | 153.4ms | 121.3ms | 102.5ms | 377.2ms |

すべて3840×2160のHTMLImageElementを渡していた。これはWebGL呼び出しでCPU側が戻ってこなかった時間であり、純粋なGPUコピー時間だけを測ったものではない。ブラウザ内部の変換や同期待ちも含み得る。

原因となる実装：

- [PanelTransition.js](C:/Users/wdddi/workspace/selected-works/src/PanelTransition.js:122) で切り替えごとに旧・新のTextureを生成する。
- [同ファイル](C:/Users/wdddi/workspace/selected-works/src/PanelTransition.js:135) で、絞り直前にcompileと2枚のinitTextureを同期実行する。
- [同ファイル](C:/Users/wdddi/workspace/selected-works/src/PanelTransition.js:90) で終了時にTexture・Material・Geometryを破棄し、再訪でも作り直す。
- [LiquidSurface.js](C:/Users/wdddi/workspace/selected-works/src/LiquidSurface.js:114) でも新しい画像Textureを作る。絞りと液体は別WebGLコンテキストなので、画像のGPU実体をそのまま共有できない。

RGBA8換算では1枚約31.6MiB、3枚約94.9MiB。これは画素量の計算で、VRAMの実測ではない。ファイルがHTTPキャッシュにあってもGPU転送は再発する。PNGをWebPへ変えるだけでは、同解像度の展開後画素量は減らない。

### 切り分け実験

本番ファイルを変えず、計測ブラウザ内だけ2作品のPNGを1920×1080の診断用画像へ置き換えた。それ以外のアプリコード・演出は同じ。

| 条件 | 初回 | 2回目 | 3回目 |
|---|---:|---:|---:|
| 元の4K画像 | 433ms | 417ms | 367ms |
| 診断用1920px画像 | 250ms | 133ms | 117ms |

2回目・3回目は約68%短縮した。別セッションなので厳密な一変数の因果推定ではないが、API別の実測と一致し、画像転送が主要因だという強い裏付けになる。1920px版でも100ms超の停止が残る。**全画像を小さくすることを完成案にはしない。画質を維持した再利用・事前準備を先に行う。**

## 原因2：初回の背景シェーダーが初描画で待たされる【確認済み】

CPUプロファイルに、背景FluidFxCanvasの初描画経路で `getProgramInfoLog` に約322msのサンプル時間が集中していた。初回背景切り替え時の長いアニメーションフレームも約422ms。GPU準備完了の同期待ちが疑われ、4K転送とは別の初回停止を作っている。

[FluidFxCanvas.tsx](C:/Users/wdddi/workspace/selected-works/src/reference/FluidFxCanvas.tsx:2875) は背景の生成時にRenderer・FluidSimulation・Materialを作り、[初描画](C:/Users/wdddi/workspace/selected-works/src/reference/FluidFxCanvas.tsx:3407) に進む。ShaderCanvasとの切り替えではReactコンポーネントの種類も変わる。

シェーダー・描画リソースを早めに準備し、可能なら `compileAsync()` と初回描画のウォームアップを使う。Three.jsはKHR_parallel_shader_compileを利用する非同期compileを提供している。ただし**非同期compileは画像アップロードの停止を解決しない**。[Three.js公式ドキュメント](https://threejs.org/docs/pages/WebGLRenderer.html)

## 通常時の負荷と、後回しにすべき箇所

- GLSL作品の絞り中は、液体側約29回＋背景約13回＋絞り1回＝約43回/フレームのdraw呼び出しを観測した。小さな流体計算ターゲットも含むため、43回すべてが全画面描画ではない。
- 液体側は毎フレーム背景Canvasを別コンテキストのTextureへ更新し、mipmap生成も行っている。DPR 2では液体・絞りの画面バッファが3840×2160になる。背景にはピクセル上限があるが、こちらはDPR上限だけ。
- 排水位置の計算は毎フレーム1225点を変形・ソートしている。今回のCPUサンプルでは排水/変形計算の自己時間が計約254ms、約527絞り描画に対して単純平均約0.48ms相当。これは厳密な関数実時間ではなくサンプリングの目安。0.4秒の開始停止を優先し、この計算の書き換えを第一手にはしない。
- 絞りのメッシュは25,600三角形、1 draw/フレーム。ポリゴンを減らすだけで今回の同期転送停止が解消するという証拠はない。
- 通常時の描画負荷にも改善余地はあるが、GPU単独の時間を測っていないので、各流体パスの削減効果は未確定。

## 改善案と実施順

| 優先度 | 具体策 | 狙う実測コスト | 注意点 |
|---|---|---|---|
| P0 | Renderer単位で画像Textureをキャッシュ。絞りのMaterial・Geometryも再利用 | 毎回363〜400msかかる同期転送と再生成 | 原画の4Kを維持。全作品常駐にせず、現在・次・直前など少数をLRU管理 |
| P0 | 次の作品のdecode・GPU準備を絞り開始前に完了させる。自動送りなら表示中から先読み | 初見画像の開始時転送 | `decode()`だけではGPU準備にならない。`requestIdleCallback`内に巨大な同期転送を移すだけでも停止は起きるため、キャッシュと分割・事前準備の設計が必要 |
| P1 | 初回シェーダーのcompileAsync＋事前ウォームアップ | 初回背景側の約322ms待ち | 背景2つを常時動かす設計にはしない。対応拡張・初期化順を確認 |
| P1 | 絞りと液体を同じRendererで描き、Textureを共用 | 同じ新画像の二重転送、複数コンテキスト | 効果が見込めるが改修範囲大。色・透明度・描画順・黒画面の回帰確認が必要 |
| P2 | 表示寸法×DPRに合う画像を選択し、4K原本は保持。カード用サムネイルは別画像 | 転送画素量、初期通信量 | 機械的に1920pxへ固定しない。拡大時・高DPIの鮮明さを確認 |
| P2 | 動的背景コピーのmipmapを見直し、液体計算の更新頻度・解像度を独立制御 | 通常時の描画余力 | 液体の画質を維持して比較。利益はまだ定量化していない |
| P3 | 排水計算の配列再利用、必要なら計算頻度と補間を調整 | CPU負荷・GCの小さな積み重ね | 滴る位置と勢いが変わらないことを検証 |

表の時間は「削減対象の現在コスト」であり、そのまま削減できるという保証ではない。まずP0をローカルで試し、同条件の測定と見た目を比較するのが妥当。

改善の合格目安案：同じPC条件で絞り開始前後の50ms超停止をなくすことを第一目標とし、その後通常時・絞り中ともフレーム間隔p95を20ms前後へ。初回/再訪/連続操作を分けて最大値も保存する。画質、白化の時刻、滴り、文字のフェードを維持する。これは目標値であり、達成済みではない。

## 初期表示・通信の参考値

これは切り替え停止と別の診断。主測定の初回読み込みから取得した。

| 指標 | 実測/状態 | 解釈 |
|---|---|---|
| FCP | 0.54秒 | 初期描画自体は速い |
| LCP | 4.54秒 | 一般的な2.5秒目安を超える。意図したオープニング待ちも含むので、今回の開始停止とは分ける |
| CLS | 約0.00001 | この測定ではレイアウトずれは小さい |
| 操作イベント時間 | 64〜80ms | 3回のクリックのEvent Timing。サイト全体のINPではない |
| INP / Lighthouse TBT / Speed Index | 未測定 | フィールド評価やLighthouseスコアを推定しない |
| 最初のWeb作品4枚 | 約16.7MiB | カードも本体と同じ4K PNGを読み込む |
| JS本体 | 転送約249KB | 約898KBのソースが圧縮配信される。切り替え時の再ダウンロードが主因ではない |

LCP・CLSの一般的な目安は[web.devの定義](https://web.dev/articles/vitals)を参照。ラボの1ページ訪問の結果を、実ユーザー75パーセンタイルの合否とは扱わない。長いフレームの観測方法は[ChromeのLong Animation Frames API](https://developer.chrome.com/docs/web-platform/long-animation-frames)に基づく。

## 記録と再現

- [条件別の集計](C:/Users/wdddi/workspace/selected-works/qa/performance-20260927/summary.json)
- [4K転送の実測ログ](C:/Users/wdddi/workspace/selected-works/qa/performance-20260927/upload-evidence.json)
- [CPUプロファイル](C:/Users/wdddi/workspace/selected-works/qa/performance-20260927/detail.cpuprofile)
- [Performance trace・約100MB](C:/Users/wdddi/workspace/selected-works/qa/performance-20260927/detail.trace.json) — Chrome DevTools Performanceへ読み込める性能記録。動画ではない。
- [計測スクリプト](C:/Users/wdddi/workspace/selected-works/qa/performance-20260927/measure.mjs)

再実行例：`node qa/performance-20260927/measure.mjs desktop`。`retina`、`mobile`、`desktop2`、`detail`で条件を変更できる。`half`は診断用1920px画像をfixtures.mjsで作成してから実行する。measureは公開URLを対象にするため、後日再実行した場合は必ず保存されたrevisionを確認する。

詳細プロファイルには計測自体のオーバーヘッドがある。改善幅の比較には軽い通常測定を使い、詳細ログは原因の帰属に使った。今回の比較実験だけでは実機スマホ・低性能GPU・通信制限下での改善量までは保証できない。
