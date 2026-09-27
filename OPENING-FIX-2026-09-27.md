# オープニングの処理落ち・一瞬暗くなる症状の修正

検証対象：package 2.6.2、JS `index-BsjQqI-d.js`、CSS `index-C7FGZ0W2.css`。
修正前：公開コード `9f1a78b`（JS `index-W6wASONH.js`）。

## 原因と修正

- 固定時間で登場演出を始めており、画像・GPU・フォントの準備完了と同期していなかった。準備中は登場アニメーションを待機させ、背景の実描画と画像転送が完了してから開始する。
- UIのSVG変位・ぼかし・角丸の毎フレーム更新をやめ、伸縮・傾き・浮上・フェードは維持した。完全に不透明なUI背景の裏で実行されていたbackdrop blurも外した。半透明になる未選択カードのホバーではblurを維持する。
- 作品ボタンに320×180のWebPを使用する。全12枚で110,364 bytes。大きな作品画像は元の3840×2160をそのまま使う。再生成は `node scripts/build-thumbnails.mjs`。
- 浮上終了時、`opening=0`になっても`surfaceWet=0`のままになる隙間があり、スクショの代わりに透明なピクセルが出ていた。通常表示を同じ描画内で有効にし、UIの登場完了待ちで再度非表示にしない。
- 保存済みの一時停止状態で読み込み中にスキップした場合も、画像の準備完了後に必ず一度描画する。
- 読み込みが長引いた場合、自動送りはオープニング終了まで待機し、終了後に再開する。

## 再測定

Windows / Chrome 153.0.8010.53 / NVIDIA RTX A4000。ブラウザを順番に実行し、CPU・通信速度の制限なし。
浮上進行が8%を超えてから完了直前までのrAF間隔を計測。タイミング測定ではGPUの同期読み戻しを使わず、実際のuniform更新を記録した。ピクセル検査は別実行。

| 条件 | 最大フレーム間隔 | 50ms超 | 実効fps |
|---|---:|---:|---:|
| 修正前・1920×1080 / DPR 1 | 66.6ms | 2 | 47.6 |
| 修正後・1920×1080 / DPR 1 | 33.4ms | 0 | 59.6 |
| 修正後・390×844 / DPR 3 | 16.9ms | 0 | 60.0 |

修正後は両条件とも浮上中の4K転送0回。終了付近にスクショが透明になるフレームは0回だった。修正前では終了時の透明な描画を実GPUピクセルで再現した。
これは検証PCの測定値であり、物理スマホ・Safari・低性能GPUは未検証。最初の準備処理自体が消えたわけではなく、表示する演出の開始前に完了させている。

## 回帰確認

最終ビルドで以下に合格した。

- `check-opening.mjs`：PCとスマホ相当表示の軽量な性能測定、別実行でのGPUピクセル検査。
- `check-opening-behavior.mjs`：UIの伸縮が残ること、4Kメイン画像と320pxのボタン画像、次の作品への絞りと文字フェード、6秒遅延時の待機と自動送り再開、入力スキップ、動き軽減への切り替え、保存済み一時停止でのスキップ、途中リサイズ。
- `npm test`：既存17項目。全12作品・5画面寸法・外部リンク・履歴・再読込・背景操作・一時停止の保存・WebGL不可・JavaScript無効時の導線。実行時エラーなし。
- 浮上途中・完了後・途中リサイズ後の静止画を目視確認。録画は行っていない。

記録：`qa/opening-before-nonblocking/`、`qa/opening-release-desktop/`、`qa/opening-release-mobile/`、`qa/opening-behavior/`、`qa/v2.5.13/test-results.json`。

```powershell
$env:OPENING_ASSERT='1'
$env:OPENING_BUDGET='55'
$env:OPENING_OUT='qa/opening-release-desktop'
node scripts/check-opening.mjs timing
node scripts/check-opening.mjs pixels
$env:OPENING_MOBILE='1'
$env:OPENING_OUT='qa/opening-release-mobile'
node scripts/check-opening.mjs timing
node scripts/check-opening.mjs pixels
```

`OPENING_URL`で測定先を指定できる。未指定は `http://127.0.0.1:4173/`。公開後の確認結果は追記する。
