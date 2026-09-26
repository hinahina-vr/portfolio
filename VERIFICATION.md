# 検証記録 — v2.3.2 / 2026-09-26

対象は `npm run build` で生成した最終dist。Windowsの実Google ChromeをPlaywrightから起動して確認した。ブラウザーの版・試験日時は各JSON、成果物のSHA256は `qa/v2.3.2/artifact-sha256.json` に保存。

## 変更内容

ExperimentsのGesture Cut Fieldを「神話製作機械」に差し替えた。ユーザー指定の https://gaia-senseware.pages.dev/concept/#depth を実Chromeで開き、該当節の内容に基づく日本語の展示解説と英語の形式ラベルを掲載。公開ページの実画面を1440×900で撮影し、既存と同じ不透明度80%で表示する。

画像とOpen conceptボタンの両方が指定の#depthへ直接リンクする。旧作品はExperimentsの作品欄・一覧から除外。背景操作の選択肢は別機能として維持している。Webの4作品、Visualの2作品、最大440pxの説明幅、自動切替の処理は変更していない。

出典・撮影結果：`qa/v2.3.2/myth-source-content.txt`、`myth-source.png`。掲載画像：`public/assets/myth-making-machine.jpg`。

## 合格した検証

| 実行 | 結果 | 記録 |
| --- | --- | --- |
| npm run build | 成功 | dist |
| npm test | 17項目PASS | qa/v2.3.2/test-results.json |
| node scripts/check-caption-lines.mjs | 14項目PASS | qa/v2.3.2/after-caption-lines.json |

実ChromeでExperimentsを選び、作品名、実画像の読込、説明、Open conceptボタン、旧作品の除外を確認した。画像とボタンをそれぞれクリックし、実公開ページが新しいタブで開いて、URLが#depthを含み「神話製作機械」の見出しが実際に画面内へ表示されることを確認。再読込後も選択作品が維持された。作品が1件のため自動切替ボタンは非表示。

既存4サイトを実際に開く操作、Web初期作品、カテゴリ、Index、履歴、再読込、キーボード操作、背景描画・停止・保存・再開・設定・没入表示を確認。1920×1080、1440×700、768×1024、390×844、320×740で全7作品の日本語本文・画像・ボタン配置・横はみ出しを検査した。初期画面と新作品は1440×900でも確認。

常用プレビュー4173でも全7作品を選択し、1920px・768px幅で説明が幅440px・3行であり、本文が一致することを実測。狭い画面では自然に折り返し、本文は省略しない。

JavaScript無効・動きを減らす設定も確認。WebGL不可とストレージ拒否は人工的な条件で試験した。実行時・シェーダー・ローカルアセット取得エラーなし。

初回検査ではページ全体に旧作品名が存在しないと判定して失敗した。背景設定の選択肢に同名があるため、掲載を削除する対象の作品欄と一覧に検査範囲を修正して再実行した。初回結果は `qa/v2.3.2/initial-test-results.json` に保存。これは新作品の表示不具合ではない。

## 目視・成果物・範囲

`experiment-desktop.png`、`experiment-1920.png`、`experiment-390.png` を目視し、実画像、作品名、日本語説明、操作ボタンの位置と表示を確認。画像は `qa/v2.3.2/` 内。

同じdistを4187の試験サーバーと4173の常用プレビューでHTTP配信。検証後にアプリのHTML・JS・CSS・画像は変更していない。依存関係の変更・ZIP配布物はない。元の作品サイトのコードは編集していない。

上記ローカル検証時点では新規インターネットデプロイは未実施だった。スマホ・タブレット幅は実Chromeのビューポート変更であり、実機・Safari・Firefoxは未確認。外部作品の内部機能全体は検証対象外。上記ローカル検証時点では自動切替の実時間試験は再実行していない。

前版の検証記録：`qa/v2.3.1/VERIFICATION.md`。

## GitHub Pages公開後の追加検証 — 2026-09-26

公開URLは https://hinahina-vr.github.io/portfolio/ 。GitHub Actionsのクリーンインストール・ビルド・実Chromiumでの17項目検証が合格し、コミット `82282d67261ab917fc327b1d7c6372906e55a631` を公開した。

公開先をWindowsの実Chromeで開き、5項目の実配信検証に合格。初期作品、8秒の実時間経過による自動切替、全7作品の画像と日本語説明、カテゴリとIndex、再読込、「神話製作機械」の実リンク、公開版メタデータを確認した。公開PC画面とスマホ幅のExperiments画面を目視し、実行時・画像取得エラーはなかった。

詳しい実行記録、初回インストール不整合の修正と中断した試験の区別、未確認範囲は `DEPLOYMENT.md` に記載。実配信結果は `qa/deployment/public-results.json` に保存。
