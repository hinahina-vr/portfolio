# 作品スクショが単色になる不具合

対象：package 2.6.2、JS `index-DAXLB--5.js`、CSS `index-C7FGZ0W2.css`。

## 再現と原因

旧公開版 `7749041` / `index-k-Am9cHM.js` で、GaiaからGLSL作品への通常切り替え後にスクショが黒一色になることを実Chromeで再現。Quiz Palなどにも共通する描画経路の不具合。

GPU画像キャッシュが即座に解決する一方、新しく配置したHTML画像の `naturalWidth` / `naturalHeight` はまだ0のことがある。この値で切り抜き比率を計算して `NaN` をシェーダーに送信していた。後から画像要素が3840pxになっても比率は再計算されず、単色表示が続く。

修正：比率計算には、準備済みGPUテクスチャの画像寸法を使う。DOM画像の読み込みタイミングに依存しない。

## 検証

- `scripts/check-solid-photo.mjs`：通常アニメーションを有効にし、実GPUの25地点を読み戻して、元スクショの色と照合。無効なuniform・透明化・単色化を検出する。水滴の屈折とGPUの縮小フィルター差があるため、画素完全一致の試験ではない。
- 旧公開版に同じ回帰テストを実行すると、GLSL作品の `NaN` で失敗。記録：`qa/photo-solid-baseline/`。初回再現の静止画・値は `qa/photo-solid-before/`。
- 修正版の全12作品＋Web作品への再訪4回、計16回の描画確認に合格。無効uniformと実行時エラー0件。記録：`qa/photo-solid-fixed/`。GLSL・Quiz Palの正常表示は静止画でも確認。
- 従来の既存機能テストには動き軽減モードでDOM画像を確認する部分があり、この通常アニメーション経路を拾えていなかった。公開前CIに通常描画の回帰テスト（Web全4作品）を追加。
- Windows / Chrome 153 / NVIDIA RTX A4000 / 1440×900。録画なし。物理スマホ・Safariは未検証。

公開後の検証を追記する。
- 修正版で `check-caption-background.mjs` も合格。背景と文字のフェード同期、固定タイトル、連続操作の復帰を確認。
