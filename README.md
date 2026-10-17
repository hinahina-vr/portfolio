# hinahina:// — v2.7.4

hinahinaのWebサイト、映像、文章、シェーダー作品を展示するポートフォリオです。本人のGLSL Effects Showcaseの描画コードを使い、流体シミュレーションとシェーダーによる背景を全画面に表示します。

PCでは左に16:9の作品画像、右に作品名と日本語の展示解説を配置。英語UIにはHelvetica由来のTeX Gyre Heros、日本語の解説には明朝体を使います。950px以下では画像・説明を縦に並べ、作品一覧と背景操作を画面下部に固定します。説明と外部リンクまでスクロールして読める構成です。最初の作品は「惑星の放課後」です。

作品画像の不透明度は80%です。画像面の下地は透明にして、背景WebGLが20%透けるようにしています。通常の切替は背景のフェードアウト・シーン変更・フェードインに続いて、1枚の画像を約3.2秒かけて絞り、白化しながら次の画像へ移行します。タイトル・解説・リンクは位置を動かさず、背景切替開始からゆっくりフェードアウト。画像が開ききる直前から次の文字がフェードインします。液体は画像の画素色、three-fluid-fxの速度場、重力加速、曲面の光沢を使って描画します。

このREADMEは現行の仕様と実行方法です。v2.7.0の検証した成果物、実測値、公開状態、未確認範囲は [BRUSHUP-2026-10-15.md](BRUSHUP-2026-10-15.md) を参照してください。

## 作業場所・起動

作業リポジトリは `E:/workspace/selected-works`。成果物、依存関係、試験画像、一時ファイルをEドライブに置きます。PowerShellでは起動前に保存先を明示します。

```powershell
Set-Location -LiteralPath 'E:/workspace/selected-works'
$env:TEMP = 'E:/CodexData/temp'
$env:TMP = $env:TEMP
$env:TMPDIR = $env:TEMP
$env:npm_config_cache = 'E:/CodexData/npm-cache'
New-Item -ItemType Directory -Force -Path $env:TEMP, $env:npm_config_cache | Out-Null
npm ci
npm run dev
```

Node.js 22を使用。開発サーバーは `http://127.0.0.1:4174/` です。

```powershell
npm run build
npm run preview
```

公開用出力は `dist/`、ビルドのプレビューは `http://127.0.0.1:4173/`。同じプレビューが既に起動している場合は再読み込みしてください。HTMLのダブルクリックではなくHTTPサーバー経由で利用します。Windowsのブラウザ試験はインストール済みのChromeを読み取り利用し、試験の出力はリポジトリ内の `qa/`、一般の一時領域は上記Eの設定を使います。

## 掲載作品

5カテゴリ・14作品を掲載しています。

- **Web（5）**: 惑星の放課後、GLSL Effects Showcase、一帯一旅 ～中国の街をめぐる旅の地図～、ZEN大学履修プランナー、Quiz Pal。
- **Visual（3）**: 二次元瞳拝、Lilian Kaleido Loom、Botanical Tide。二次元瞳拝は専用ページで体験できます。後者2件はGLSL Effects Showcaseに収録したスタディです。
- **Words（4）**: ワディーゲストハウス、note、X、GitHub。
- **Video（1）**: モルトバトルちゃんねる。
- **Experiments（1）**: 神話製作機械。コンセプトページの `#depth` に直接リンクします。

メニュー、見出し、説明、リンク先は `content.js` で管理します。`navTitle` を指定すると下部一覧だけ短い表示名にでき、作品の正式タイトルとアクセシブルな名称は維持されます。画像は3840×2160、一覧のサムネイルは320×180です。PNG原本を `public/assets/` に残し、画面表示には可逆圧縮のWebPを使います。Xは撮影時の接続制限により、実画面の代わりにアカウントカードであることを明示しています。

## 操作と切替

- 上部のWeb / Visual / Words / Video / Experimentsでカテゴリを選択し、下部のサムネイルで作品を選びます。狭い画面の一覧は横にスワイプできます。選択済みの作品を再び押しても演出や履歴を再作成しません。
- 自動送りの待機時間は通常8秒。ポインター、キー、スクロールなどの操作を始めると16秒になり、20秒操作がなければ通常の8秒へ戻ります。背景設定、没入表示、非表示タブ、オープニングや背景切替中は送りを待機します。
- 下部の停止アイコンは背景・液体・自動送りをまとめて停止します。切替中の停止は選択先を確定し、停止中の手動選択は静止切替になります。停止状態はブラウザに保存され、次の起動時にも適用されます。OSの動きを減らす設定でも静止表示・自動送り停止になります。
- 作品画像と「Visit website」などのリンクから、掲載先を新しいタブで開きます。
- 背景上のマウス・タッチ操作で流体や光が反応します。設定アイコンから背景3種、光量、動く速度を調整できます。開いた直後のフォーカスはArtworkに移ります。
- 没入表示で操作画面を隠せます。Escapeで設定を閉じる、または没入表示から戻り、元の操作ボタンへフォーカスを返します。
- カテゴリタブは左右矢印・Home・Endでも選択できます。「Skip to work」は作品を変えずに本文へ移動します。
- WebGLが利用できない場合は静止背景を表示します。JavaScript無効時は重複する収録作品を除いた12件のリンクを表示します。

## GitHub Pagesへの公開

公開先: [hinahina://](https://hinahina-vr.github.io/portfolio/)
リポジトリ: [hinahina-vr/portfolio](https://github.com/hinahina-vr/portfolio)

`main`へのプッシュで `.github/workflows/pages.yml` が動きます。通常のCIは依存関係のインストール、ビルド、`tests/smoke.mjs` による軽量なChromium確認を行い、成功した `dist/` をGitHub Pagesへ配置します。Markdownだけの変更では再公開しません。

全件のブラウザ試験と動作中のGPU画像回帰は、Actionsの手動実行で `full_tests` を有効にしたときだけ追加されます。日常の公開に重い全件試験を必須化しません。相対アセットパスと `#works/カテゴリ/作品ID` を使うため、ローカルと `/portfolio/` で同じビルドを使用できます。公開時に生成する `build.json` に版とコミットを記録します。

## 手動検証

Eの環境変数を設定した同じシェルで実行します。ここに挙げるコマンドは検証手段であり、最新成果物がすべて合格したという意味ではありません。実施結果は [今回の検証記録](BRUSHUP-2026-10-15.md) に集約します。

```powershell
npm run build
node tests/smoke.mjs
npm test
node tests/interaction.mjs
node scripts/check-solid-photo.mjs --quick
```

- `tests/smoke.mjs`: 5カテゴリ、画像の読み込み、80%の表示、スマホ幅の一覧操作、選択URLの再読み込み。結果は `qa/smoke/`。
- `npm test`: ビルドした `dist/` を対象に全13作品、掲載先の新規タブ、画像、キーボード操作、画面幅、モバイル固定メニュー上でのリンク到達性、静止表示などを確認します。掲載先を開くためネット接続が必要です。結果は `qa/v2.7.0/`。
- `tests/interaction.mjs`: 一時停止、同じ作品の再選択、設定フォーカス、連打、履歴、自動送りの16秒・20秒条件を実時間で確認する手動試験。通常は専用のローカルサーバーで `dist/` を読み、結果を `qa/interaction-2026-10-15/` に保存します。既存プレビューを使う場合は `INTERACTION_URL`、結果先は `INTERACTION_OUT` を指定できます。CIには追加していません。
- `scripts/check-solid-photo.mjs --quick`: 動作中のWebGLから実際の画素を読み、作品画像の単色化や不正な数値を確認します。
- `scripts/check-opening-behavior.mjs`: 4173のプレビューで初回登場、画像の遅延、操作・動きを減らす設定・保存した停止状態、途中の画面リサイズを確認します。結果は `qa/v2.7.0/opening-behavior/`。

静止画と数値を記録し、動画は録画しません。実Chromeによる確認と物理スマホ・Safariなどの未確認範囲を区別して記録します。第三者ライブラリのライセンスは `public/licenses/`、元描画ソースの由来は `src/reference/PROVENANCE.md` にあります。

## 主な編集箇所

- `content.js`: 作品名、短い一覧名、副題、展示解説、画像、リンク、背景の対応。
- `app.js`: 作品選択、カテゴリ、URL履歴、停止と自動送り、設定、フォーカス。
- `styles.css`: 画像と文字の配置、書体、透過、固定モバイルメニュー。
- `src/Background.jsx`、`src/reference/`: 元サイトのWebGL背景と接続処理。
- `src/PanelTransition.js`、`src/WringShape.js`: 絞りの演出と形状。布の自己衝突を解く物理ソルバーではなく、握りのずれ・くびれ・しわ・たわみを使う演出モデルです。
- `src/LiquidSurface.js`、`src/Drainage.js`、`src/PigmentFlow.js`: 画像の表面、排水位置、画素色の液体。
- `src/CaptionFade.js`、`src/Entrance.js`: 位置を動かさない文字のフェードと初回登場。

## 旧バージョンの記録

以下は当時の実装・検証記録です。現在の機能、出力パス、必須試験を定義するものではありません。

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

## Text / Video（v2.6.1）

Text: ワディーゲストハウス、note、X、GitHub。Video: モルトバトルちゃんねる。ヘッダーにX・note・GitHub。新規3画像も1920×1080 / DPR2の実ブラウザーから3840×2160 PNGで撮影。`scripts/capture-text-video.mjs`で再取得し、`scripts/check-text-video.mjs [URL]`でカテゴリ、リンク、新規タブ、リロード、320〜1440pxの表示を検証できます。X本体は検証環境で接続不可になるため、外部表示不能とリンク動作を区別して記録します。

絞りの形状は `src/WringShape.js`。左右の握り高さ・位相差、偏ったくびれ、しわと厚み、重みによるたわみを使う演出モデルで、布の自己衝突を解く物理ソルバーではありません。`scripts/check-wring-shape.mjs` はWebGL2 transform feedbackでGPU頂点を読み戻し、CPUの排水面と一致すること・出口流量保存を検証します。Xは撮影時のHTTP接続制限により、実画面を偽装せず `hinahina-x.svg` から生成したアカウントカードを使用します。

「二次元瞳拝」は `public/works/eye-and-light/` に独立サイトの公開ファイルを同梱しています。元のGitとは分けており、更新時は取り込み元の版とファイルハッシュを記録して差し替えます。最新の取り込みは作品1.32.1。記録は `NIJIGEN-DOHAI-1.32.1-2026-10-18.md`。
