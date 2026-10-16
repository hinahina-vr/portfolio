# 「眼と光」掲載 — v2.7.1 / 2026-10-16

## 追加内容

Visualの先頭へ「眼と光 — EYE & LIGHT」を追加。4K・16:9の実WebGLスクリーンショット、日本語の展示解説、Enter artworkを掲載した。全体は5カテゴリ14作品。写真は既存と同じ不透明度80%、透明な下地。JavaScript無効時のリンクも追加し、12件になった。

掲載URL: https://hinahina-vr.github.io/portfolio/#works/visual/eye-and-light

体験URL: https://hinahina-vr.github.io/portfolio/works/eye-and-light/

作品本体は `public/works/eye-and-light/` に独立した静的ページとして配置。ポートフォリオの背景描画へ追加のレンダラーは組み込んでいない。既存の映像、3D操作、全画面表示、メニュー、Three.jsライセンスを含む。

## 取り込み元

依頼された `5fb4d5aebc98a4d0719c47633aa11f196faecd16` は `E:/workspace/eye-and-light-web` の全面表示版。その後の公開用整理を含む `f65d0844a0919791f527b1f47e8f6ee0af13364a` / 1.1.1を採用した。元Gitへの変更は行っていない。

同リポジトリの新規展開・ブラウザ検証済みパッケージ `eye-and-light-web-1.1.1-static.zip` の28ファイルを取り込み、取り込み元public・掲載側public・掲載側distのSHA-256を全件照合した。すべて一致。依存ライブラリのNOTICEを追加した。

元パッケージSHA-256: `76c2ed041eb17fb678915899e2f6e14d7d106345077a1f8d51ffb6c9c2037dd5`

スクショはWindows Chromeで実際に作品を表示し、CSSビューポート1920×1080、DPR2、WebGL描画も3840×2160にして撮影。PNG原本は `qa/eye-and-light-20261016/source-4k.png` に保存。公開用の可逆WebPは7,220,586 bytesで、PNGからの復号画素差0。サムネイルは320×180。動画は新しく録画していない。

## 検証

最終ビルド: v2.7.1 / `index-Dmhvcb60.js` / `index-DKXK5iY5.css`。

最終ビルドの `node tests/eye-and-light.mjs` は下記9項目を実Chrome 155で検証し、9/9 PASS、エラー0。結果は `qa/eye-and-light-20261016/local/results.json`、各画面の静止画も同フォルダー。

- 1440×900、768×1024、390×844、320×740で、Visualの3作品、新作品名、解説、Enter artwork、3840×2160画像、16:9、不透明度80%、横はみ出しなし、リンクを実際に押せる位置を確認。
- 通常モーションで、Webから新作品へ背景・絞り・文字フェードが連携し、正しい写真と説明が表示されることを確認。
- 掲載側distの専用ページで、実3D描画、全面表示、再生・停止、視点切替、リセット、ドラッグ、自動カメラ解除、Escapeを確認。
- 同ページの既存MP4で再生、停止、5.2秒へのシーク、3D復帰、1920×1080・60秒を確認。
- 390×844の体験画面とメニューの寸法、再読込、同梱ライセンスへの到達性を確認。
- HTTP RangeでMP4の先頭1024 bytesを206として返すことを確認。

初回のローカル映像試験ではシークが失敗した。既存プレビューサーバーがMP4のMIMEとHTTP Rangeに未対応だったため、`scripts/serve.mjs` を修正。同じ5.2秒へのシークで修正を確認した。映像ファイルや作品の実装は変えていない。

最終ビルドの `node tests/smoke.mjs` は全5カテゴリ、モバイルの最終作品選択、URL再読込を検証し、19.024秒でPASS、実行時・アセットエラー0。通常CIは従来どおり軽量smokeのみ。新作品の詳細試験は手動用として残した。

スマホはWindows Chromeの画面幅による試験であり、iOS / Android実機ではない。既存MP4を操作して確認したもので、再エンコードや新規録画はしていない。v2.7.0の全体フル試験を再実行したとの意味ではない。

## 公開記録

公開コミット: `22fc8c7c877baaccc8c70aeb3d3d515e2b98fb74` / v2.7.1。

GitHub Actions [38877264338](https://github.com/hinahina-vr/portfolio/actions/runs/38877264338) 成功。build 53秒、deploy 17秒。通常CIのフル試験・GPU試験は従来どおり手動指定時のみ。

公開URLを対象に `node tests/eye-and-light.mjs https://hinahina-vr.github.io/portfolio/` を実行し、9/9 PASS、エラー0。今回はEnter artworkを実際にクリックして新しいタブの専用ページを開き、実3Dと映像の途中再生まで確認した。4画面幅、通常の絞りトランジション、映像の206部分配信、メニュー・再生・停止・視点・ドラッグ・リセット・シーク・3D復帰・再読込・ライセンス到達性を確認。

公開 `build.json` の版・コミットが一致。掲載側のJS/CSS、4K WebP、作品のHTML/CSSと実装4ファイル、計9ファイルのSHA-256が検証済みのローカルdistと完全一致。取り込んだ作品ファイルにはGitの改行変換を適用せず、検証した原本のバイトを保っている。

公開後記録: `qa/eye-and-light-20261016/public/{results,build-verification}.json`。静止画は同フォルダーの `portfolio-rendered.png`、`portfolio-{1440,768,390,320}.png`、`artwork.png`、`artwork-mobile.png`。公開後の画面も目視した。