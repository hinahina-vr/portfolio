# 背景切り替えと作品キャプションのフェード同期

対象：package 2.6.2、JS `index-k-Am9cHM.js`、CSS `index-C7FGZ0W2.css`。

- 背景WebGLのフェードアウト開始と同時に、タイトル・説明・リンクボタンを1400msでフェードアウトする。
- 元のキャプション全体と作品固有のCSSコンテキストを保ったまま不透明度だけを変更する。タイトルの位置・サイズ・改行を変えない。
- 新しいタイトル・説明はスクショの絞り開始から3000msで1600msのフェードインを開始する。画像が表示されきる直前からの既存タイミングを維持。
- 公開旧版で、背景フェードアウト中に文字の不透明度が下がらない症状を再現。`check-caption-background.mjs`の同じ条件が修正版で合格。
- Chrome 153 / Windows、1200×850と390×844で実ブラウザ検証。タイトルの座標・寸法・フォントサイズ維持、背景フェード中の減光、遅延フェードイン、連続クリック・動き軽減の復帰を確認。スマホはエミュレーション。
- `check-slow-text-wring.mjs`で初回登場と作品切り替えの文字がopacityだけで動くこと、画像の初期配置・ひねり量・文字の遅いフェードを確認。
- 静止画確認のみ。録画なし。詳細記録は `qa/caption-background/`、`qa/caption-background-mobile/`、`qa/slow-text-wring/`。

公開後の検証は追記する。
- 最終ビルドで `npm test` の既存17項目も合格。

## 公開確認

- 公開コード：`774904125dd8788efb62698e3ea876af10957adc`。
- [GitHub Actions](https://github.com/hinahina-vr/portfolio/actions/runs/36324914747) のビルド・ブラウザテスト・Pagesデプロイ成功。
- 公開JS/CSSのSHA-256が検証済みローカル成果物と一致。公開 `build.json` のコミットも一致。
- 本番URLで `check-caption-background.mjs` をPC・スマホ相当の2条件で実行し合格。背景のfade-out中のキャプション減光、タイトル位置・サイズ・フォントの維持、画像が開く直前からのフェードイン、連続操作と動き軽減への復帰を確認。実行時エラーなし。
- `check-deployment.mjs` の本番スモークテスト5項目合格（実WebGL、自動送り、全12作品の4K画像・説明・リンク、再読込、カテゴリとモバイル表示、リビジョン、エラー確認）。
- 記録：`qa/caption-public-desktop/`、`qa/caption-public-mobile/`、`qa/deployment/public-results.json`。
