# hinahina:// 処理落ち改善と再評価

測定日：2026-09-27。対象：package 2.6.2、ローカル production build `assets/index-W6wASONH.js`。
改善前：公開コミット `0f637e0a02d8dbddf5b4f4907d17af08205e776b`。
元の調査は [PERFORMANCE-REPORT-2026-09-27.md](PERFORMANCE-REPORT-2026-09-27.md)。

## 結果

**絞り開始時の約333〜484msの停止を、最終ローカル版では約17〜67msまで短縮した。**
4K画像、絞りの形・強さ・長さ、液体、文字のゆっくりしたフェードは維持した。
背景切り替え中の初回準備など、すべての停止を解消したわけではない。

| 測定条件 | 改善前・開始時最大間隔（3回） | 改善後・開始時最大間隔（3回） | 改善後・絞り中の実効fps |
|---|---|---|---|
| 1920×1080 / DPR 1 | 433 / 417 / 367ms | 50 / 50 / 17ms | 58.8 / 59.1 / 59.7 |
| 1920×1080 / DPR 2 | 433 / 400 / 333ms | 50 / 67 / 17ms | 59.4 / 59.1 / 60.0 |
| 390×844 / DPR 3 | 450 / 383 / 333ms | 33 / 17 / 17ms | 59.7 / 60.0 / 60.0 |
| 未準備の作品を直接選択 / DPR 1 | 同条件の改善前測定なし | 50 / 33 / 17ms | 59.1 / 57.2 / 60.0 |

- 通常比較は「惑星の放課後 → GLSL → 惑星の放課後 → GLSL」。未準備比較は「惑星の放課後 → Quiz Pal → 一帯一旅 → 惑星の放課後」。
- 「開始時最大間隔」は絞り開始をDOMで観測した最初の500msにかかる最大requestAnimationFrame間隔。fpsもrAFの実効頻度で、GPU単独の処理時間や実表示フレーム数ではない。
- Windows、Chrome 153.0.8010.53、NVIDIA RTX A4000、GPU有効、CPU/通信制限なし。計測ブラウザは順番に実行した。
- 改善前は本番URL、改善後の上表はローカル配信のビルド。同じChrome/GPU・画面条件だが、初回ロード時間の比較には用いない。
- スマホ欄はPC上の画面サイズ/DPR再現。Android・iPhone実機、Safari、低性能GPUは未測定。
- 中間版では17〜33msだったが、最終版の表にはその数値を流用していない。実行時のばらつきも含め最終成果物を記録した。

## 実装した改善

1. **4K画像のデコードを共有し、GPUテクスチャを再利用。** `PhotoTextures.js`でImageBitmapを共有し、絞り・液体それぞれのWebGLコンテキストに準備完了後最大3枚のキャッシュを持つ。表示中の画像を保護し、古い画像は破棄する。全作品をGPUに常駐させない。
2. **転送を絞り開始の外へ移動。** 初期の準備は登場演出中、次作品の準備は切り替え後に行う。未準備の作品を選んでも、背景フェードと準備が終わってから絞る。2つのコンテキストへの写真転送も同一フレームに集中させない。
3. **絞りのGeometry・Material・Sceneを使い回す。** 毎回の生成・破棄と同期compileをやめ、準備時にcompileAsyncする。
4. **流体背景の主シェーダーを初回描画前に非同期compile。** 解放済みコンポーネントで描画ループを再開しないガードも追加した。

ImageBitmap非対応時はHTMLImageElementへフォールバックする。その経路の性能は今回のChromeと同じとは限らない。

## 詳細計測と残った課題

- 改善前の切り替えでは、3枚の4K転送の同期WebGL呼び出しに合計363〜400msかかっていた。
- 最終版の詳細計測では、初回・3回目の比較区間に4K転送は0回。2回目には次作品の先読みが境界にかかり、液体用37.0ms・絞り用35.4msの転送を記録した。これらは絞り開始前であり、回帰テストでも**絞り中の4K転送0回**を確認した。
- 写真はすべて3840×2160のまま。GPU出力と、同じ表示寸法に描画した元画像のピクセルを比較し、上下方向・色・再訪時の画像を確認した。水滴による局所的な屈折を考慮し複数点で比較している。
- 未準備作品の背景切り替え区間には最大150〜167ms、通常比較でも先読みと重なる区間に約133msのフレーム間隔が残った。背景生成や未準備画像の転送まで無停止とはしていない。
- 初回ロードの長いタスクも残る。元画像をサムネイルにも使う通信量、初期コードの分割、背景レンダラーの再生成、先読みのキャンセル・優先順位付けは次の改善候補。今回の絞り開始問題と分けて扱う。
- VRAM使用量そのものは未測定。画像キャッシュの上限とWebGLテクスチャ生成・破棄を検査したが、実デバイス全体のメモリ量を保証する測定ではない。

## 再現方法

動画は使用していない。静止画とJSON/CPU/Performanceトレースのみ保存した。

```powershell
npm run build
# 別プロセスで npm run preview
$env:PERF_URL='http://127.0.0.1:4173/'
$env:PERF_OUT='qa/performance-final'
node scripts/measure-performance.mjs desktop
node scripts/measure-performance.mjs retina
node scripts/measure-performance.mjs mobile
node scripts/measure-performance.mjs uncached
node scripts/measure-performance.mjs detail
node scripts/summarize-performance.mjs
node scripts/check-photo-cache.mjs
node scripts/check-slow-text-wring.mjs
node scripts/check-handoff.mjs
node scripts/check-navigation-ui.mjs
npm test
```

`measure-performance.mjs`はURL未指定なら本番を測定する。`CHROME_PATH`でChrome実行ファイルを変更できる。
計測データ：`qa/performance-final/`。回帰試験の出力：`qa/photo-cache/`、`qa/slow-text-wring/`、`qa/navigation-ui/`、`qa/v2.5.13/`。

## ローカル回帰テスト

上記 `index-W6wASONH.js` の実Chromeで以下に合格した。

- `npm test`：17項目。全12作品、5画面寸法、外部サイトの実リンク、履歴・再読込、背景操作、静止設定、WebGL不可時のフォールバック、実行時エラーなし。
- `check-photo-cache`：未準備作品、4作品を巡回してのキャッシュ入替・再訪、4Kの色・上下方向、絞り中の画像転送0回、リサイズ中断とスマホ幅での次の切り替え。
- `check-slow-text-wring`：初期フレームの位置、絞りの強さ、文字のopacityのみの演出、旧文字のゆっくりした退場、絞り終了付近からの登場、途中中断と動き軽減。
- `check-handoff`：絞りcanvasを外す前に次の画像が不透明で描画されていることをGPUピクセルで確認。ブラックアウト再発なし。
- `check-navigation-ui`：背景フェードが絞りに先行、連打は最後の選択を採用。実入力後は16秒間隔、実時間20,093msの放置で8秒へ復帰。320×568・390×664・667×375・820×620で末尾カードと設定を操作でき、横方向のページはみ出しなし。
- デスクトップ・スマホ幅の静止画を目視確認。録画なし。

## 公開後の再評価

公開先：[hinahina://](https://hinahina-vr.github.io/portfolio/)

- デプロイしたコード：`9f1a78b425ada38f28908d3df7b300a783d77a8b`、package 2.6.2。
- [GitHub Actions](https://github.com/hinahina-vr/portfolio/actions/runs/36306773948)でビルド・17項目のブラウザテスト・Pages公開がすべて成功。
- 公開 `build.json` のコミットを照合。公開JSとローカル検証済みJSのSHA-256も一致：`301a23489dec081361c0fea5ef3a075a174a17e142e4a252c8a2728421ea6070`。
- 本番URLを実Chromeで開き、WebGL描画、最初が惑星の放課後であること、実時間での自動送り、全12作品の4K画像・説明・リンク、外部の神話製作機械の実セクション、再読込、モバイル幅を検証。実行時エラー・本番アセット取得失敗なし。
- 公開版のデスクトップ・スマホ幅の静止画も目視確認した。

同じ検証PCで、本番URLを開き直して比較と同じ3回の切り替えを再測定した。

| 公開版の条件 | 絞り開始時の最大間隔（3回） | 絞り中の実効fps（3回） |
|---|---|---|
| 1920×1080 / DPR 1 | 66 / 67 / 34ms | 52.7 / 54.4 / 53.5 |
| 390×844 / DPR 3（PC上の再現） | 33 / 17 / 17ms | 59.7 / 60.0 / 60.0 |

公開版でも約0.4秒の絞り開始停止は大幅に短くなった。一方、PCの絞り中fpsはローカル測定より低く、常時60fps達成とは判定していない。先読みと重なる背景切り替え区間には両条件とも最大約133msが残る。実機スマホ・Safariは未検証。

公開後の記録：`qa/performance-public/`、`qa/deployment/public-results.json`、`qa/deployment/bundle-verification.json`。ローカルの検証記録とビルドの対応は `qa/performance-final/validation-manifest.json` に保存した。
