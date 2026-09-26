# hinahina — Web & interactive works — v2.5.15

ユーザー自身の GLSL Effects Showcase の描画コードを直接使った、全画面WebGLのポートフォリオです。背景は画像・iframeではなく、元サイトと同じ流体シミュレーションとシェーダーで動きます。

作者名hinahinaとWeb & interactive worksをヘッダーに置き、左に大きな作品画像、右に作品名・展示解説・リンクをまとめた構成です。ヘッダー、作品、下の一覧の左右を共通の幅に揃え、画像と説明の間隔も制限しています。スマホでは画像の下に説明が続きます。メニュー・操作ラベルは英語、展示解説は日本語です。操作部分は枠・面・ホバー反応のあるボタンを維持。最初の作品は「惑星の放課後」で、実画面の画像を不透明に表示し、黒い縁と影は付けません。作品切替では画像を3.2秒で絞って白化し、次の画像へ戻します。文字は独立したイーズアウトで右側から入ります。液体はthree-fluid-fxの速度場を受けるGPU粒子を重ねた色の場で描画し、重力加速と曲面の光沢を付けています。動きを減らす設定では即時に切り替えます。

## 起動・ビルド

Node.js 22で検証しています。

```powershell
npm ci
npm run dev
```

開発サーバー: `http://127.0.0.1:4174/`

```powershell
npm run build
npm run preview
```

公開用出力は `dist/`、そのプレビューは `http://127.0.0.1:4173/`。既存のプレビューが起動している場合は再度起動せず、その画面を再読み込みしてください。静的ホスティングには `dist/` 全体を配置します。HTMLのダブルクリックではなくHTTPサーバー経由で利用してください。

## GitHub Pages

公開先: https://hinahina-vr.github.io/portfolio/

リポジトリ: https://github.com/hinahina-vr/portfolio

`main`へのプッシュで `.github/workflows/pages.yml` が依存関係のクリーンインストール、ビルド、Chromiumによる実画面試験を実行し、合格した`dist/`をGitHub Pagesへ配置します。Markdownだけの変更では再公開しません。手動実行も可能です。

相対アセットパスとハッシュによる作品URLを使うため、ローカルのルートパスと公開先の`/portfolio/`で同じビルドを利用できます。公開成果物の版とコミットは `build.json` に記録されます。

公開後の確認: `node scripts/check-deployment.mjs https://hinahina-vr.github.io/portfolio/`。結果とPC・スマホ幅の画面を `qa/deployment/` に保存します。詳細は `DEPLOYMENT.md`。

## 掲載したWebサイト

- 惑星の放課後 — https://gaia-senseware.pages.dev/
- GLSL Effects Showcase — https://glsl-effects-showcase.pages.dev/
- 一帯一旅 ～中国の街をめぐる旅の地図～ — https://chinameng.pages.dev/
- Quiz Pal — https://hinahina-vr.github.io/quiz-pal/

VisualはGLSL Effects Showcase内のスタディです。Experimentsには「神話製作機械」を掲載し、コンセプトページの該当箇所（https://gaia-senseware.pages.dev/concept/#depth）へ直接リンクしています。

## 編集

- `research/portfolio-wording/NOTES.md`: 調査した6つの実サイト、観察内容、採用した構成とコピーの根拠。
- `content.js`: 作品名、任意の副題、作品の形式（medium）、展示解説、画像、外部URL、カテゴリ、背景作品の対応。
- `public/assets/`: 公開サイトから撮影した掲載画像。
- `app.js`: 作品の選択、カテゴリ、履歴、メニュー、背景の操作。
- `styles.css`: 透明なUI、全画面背景、レスポンシブ表示。
- `src/Background.jsx`: 元サイトの描画コンポーネントを接続する部分。
- `src/reference/`: ユーザーの既存サイトからコピーした描画ソース。元ソースの保管場所は `PROVENANCE.md`。

作品追加時は `content.js` の該当 `projects` に項目を追加します。Webの作品はIndexメニューにも自動反映されます。

## 操作

- 上部のWeb / Visual / Experiments、またはIndexからカテゴリを切り替え。
- 選択中のカテゴリ内で8秒ごとに作品が横へスライドして切り替わります。手動選択後は8秒数え直します。
- 下部のサムネイルから作品を選択。スマホでは横にスワイプできます。
- 一覧横のPause slideshow / Play slideshowで自動切替を停止・再開。停止状態は再読込後も保持します。
- Index・背景設定・没入表示・非表示タブでは切替を待機。動きを減らす設定では自動切替を停止した状態で開始します。
- 「Visit website」または「Open showcase」または大きなスクリーンショットをクリックすると、実サイトを新しいタブに表示。
- 背景上のマウス・タッチ操作で、元サイトと同じ光の反応。
- 右下で背景設定・停止・操作画面を隠すモードを切り替え。
- 背景設定では3つの作品、光の強さ、動く速度を変更可能。
- Escapeでメニューや設定を閉じ、没入表示から戻れます。
- 停止状態はブラウザーに保存。OSの動きを減らす設定を尊重します。
- WebGL利用不可時は静止画像。JavaScript無効時も4サイトへのリンクを表示します。

## 検証・保管

```powershell
npm run build
npm test
```

Windowsの実Chromeを使い、ビルドした `dist/` を検証します。掲載サイトを開く試験にはネット接続が必要です。結果は `qa/v2.5.0/test-results.json`、画像は `qa/v2.5.0/`。確認範囲は `VERIFICATION.md` に記録。

4173のプレビュー起動中に `node scripts/check-composition.mjs` で画面の配置、`node scripts/check-clean-ui.mjs` で英語UI・見出し位置と装飾の除去、`node scripts/check-buttons.mjs` でボタンの表示を再確認できます。

4173のプレビュー起動中に `node scripts/verify-paused-controls.mjs` で停止中の設定変更・リサイズを追加検証できます。`node scripts/final-captures.mjs` は現在のプレビューから各画面幅のスクリーンショットを保存します。

v1の主要ソースと画面は `qa/v1-before-immersive/` に保存済み。第三者ライブラリのライセンスは `public/licenses/` に同梱しています。

v2.2.0では実サイト6件の観察をもとに作者名・作品説明・表示階層を見直しました。v2.2.1では、作品の形式と短い英文解説を展示キャプションとして組み直しました。`node scripts/check-portfolio-identity.mjs` で作者名、日本語の解説、英語の操作ラベル、リンク先に合うボタン表記を回帰確認できます。

v2.2.2では全7作品の解説と収録先の補足を日本語にしました。本文は日本語の明朝体・行間・禁則処理で表示し、作品の形式、カテゴリ、ボタンの英語表記と展示キャプションの構成を維持しています。

v2.3.0では解説の固定幅を外し、画像の手前24pxまで広げました。タブレット・スマホでは解説欄の右端まで使います。`node scripts/check-slideshow.mjs` は実時間の待機で自動切替を確認します。

v2.3.1では説明欄を最大440pxに絞りました。幅に余裕のある画面では7作品の解説が3行になり、狭い画面では本文を省略せず折り返します。`node scripts/check-caption-lines.mjs` で1920px・768px幅の実際の行数を確認できます。

v2.3.2ではExperimentsの掲載作品を「神話製作機械」に差し替えました。実画面の画像、日本語の展示解説、該当箇所へ直接移動するOpen conceptボタンを掲載しています。

v2.3.3では一覧横のPause slideshow / Play slideshowボタンを削除しました。8秒ごとの自動切替は継続し、以前保存された手動停止状態は読み込みません。動きを減らす設定、Index・背景設定・没入表示中の待機は引き続き有効です。

v2.4.0では作品画像を左、展示説明を右に配置し、最大1680pxの共通幅にヘッダー・作品・一覧を揃えました。背景操作は作品一覧と同じ行に配置。スマホでは画像と見出しを重ねず、画像から説明へ順に読めます。`node scripts/check-exhibition-layout.mjs` で幅320〜2560pxの9条件・全7作品を検証できます。



v2.5.13: 一枚の画像を3.2秒で強く絞り、最大ひねり30.6rad・断面80%圧縮で紐状にします。白化は絞っている間に連続して進み、解除直前に完了します。three-fluid-fx速度場とGPU粒子を接続し、面の集水位置から元画素色を流出。粒子は画面外まで保持し、発生時の色・半径も保持します。

カテゴリ・一覧・背景操作は初回に変位フィルターと弾性変形で現れます。Indexは削除。英字はHelvetica由来のTeX Gyre Herosを自己配信し、日本語の解説は明朝を維持。

切替終了では通常画面を先に描画し、ブラックアウトを防止。検証: npm test、node scripts/check-wring.mjs、node scripts/check-liquid.mjs、node scripts/check-handoff.mjs、node scripts/check-entrance.mjs、node scripts/check-drainage.mjs。録画は行いません。調査記録: research/motion-study/NOTES.md。
