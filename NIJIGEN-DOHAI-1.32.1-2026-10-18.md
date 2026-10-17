# 二次元瞳拝 1.32.1 掲載更新 — 2026-10-18 / ポートフォリオ2.7.4

## 取り込み元

`E:/workspace/eye-and-light-web` の検証済み `artifacts/eye-and-light-web-1.32.1-static.zip`。GitのHEADは8b8b919のまま、1.32.1は未コミットの作業ファイルと配布物に存在した。「新コミット」とは扱わず、元Gitの作業ファイルは編集・コミットしなかった。

ZIP SHA-256: `d27f57225bbb2023392b319c4a0a31e643e3241477a78f6bd3057b2dc64f362a`。Eの `qa/nijigen-dohai-1-32-1-20261018/fresh-package` へ新規展開し、ZIP CRC、配布物マニフェスト、元public、掲載public、最終distの82ランタイムファイル・101,699,410 bytesがすべて一致した。DEPLOY.htmlとAVATARS.htmlの配布案内を除き、同梱ライセンスとアバター出典を保持。NOTICEのパスは掲載場所へ合わせた。

## 更新

操作処理をavatar-picker.js、menu-dialog.js、input-controls.js、avatar-replacement.jsへ分割した最新版を同梱。アバター切替後のGPU準備に失敗した場合、以前のモデル・カメラ・描画先・GPUリソースへ復帰し、再試行できる処理を反映した。app.jsとrenderer.jsも最新版へ揃えた。

名前・紹介文・掲載URLは維持。画像・モデル・描画表現に変更がないため、現行の4K・16:9スクショと320×180サムネイルを維持した。スクショ不透明度80%、5カテゴリとポートフォリオの背景演出は維持。新しい動画撮影は行っていない。

- 掲載: https://hinahina-vr.github.io/portfolio/#works/visual/eye-and-light
- 作品: https://hinahina-vr.github.io/portfolio/works/eye-and-light/

## 検証と公開

最終distに対してアバター回帰、既存統合、全カテゴリsmokeを実行。通常CIは軽量smokeのまま、詳細試験は手動用。

Windows Chrome155でアバター回帰7項目PASS・エラー0。実通信失敗と再試行、GPU準備後に例外を注入した際の元モデル・カメラ・描画先・リソース復帰、両モデルのWASD/ジャンプ/瞳への進入と帰還/F没入、切替中の位置・停止維持、内部でのモデル切替、反復切替のGPUリソース安定、キーボード操作と再読込、4つの画面条件と実タッチ入力を確認。

既存統合10項目PASS・エラー0。掲載の4画面幅・4K画像・16:9・不透明度80%、通常背景→絞り→キャプションと画像表示、歩行/ジャンプ/瞳への進入と帰還、7絵柄の異なる描画、既存動画の再生/停止/シーク/3D帰還、同時タッチ入力・メニュー・再読込を確認。全5カテゴリsmokeは27.082秒PASS・エラー0。PC初期画面とスマホ選択後の画面を目視した。

最終ビルドは2.7.4 / index-WahzbJgt.js / index-DKXK5iY5.css。サイト全体のFPSや物理GPU故障の評価ではない。

公開後の確認は完了時に追記する。証跡は `qa/nijigen-dohai-1-32-1-20261018/`。モバイルはWindows Chromeの画面・タッチ入力エミュレーションで検証し、物理iOS/Android端末は対象外。
