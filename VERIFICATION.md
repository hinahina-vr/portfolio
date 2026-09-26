# v2.6.0 — 2026-09-27

Text（ワディーゲストハウス・note）、Video（モルトバトルちゃんねる）を追加。活動先X/note/GitHubはヘッダーに配置。UIは英語、展示説明は日本語。ワディーの説明は作者指定の「絶望の世界」「大奥AI」「神話製作機械のインスタンス」を反映。3作品とも実サイトを3840×2160 PNGで撮影（動画録画なし）。

最終dist index-DK2tdEFQ.js / index-BxX7qq5E.css: npm test 17項目PASS（全10作品を1920/1440/768/390/320pxで検証）。check-text-video PASS: 新規3作品の4K読み込み・実サイトへ新規タブ遷移・リロード維持・Text→Videoのキー操作、5タブの1440/1024/768/390/320px表示。各画面をqa/v2.6.0に保存し目視。note/GitHubは実遷移確認。Xはhrefと新規タブ生成確認のみ、検証Chromeでは接続エラーのため外部ページ表示は未確認。モバイル実機未確認。ビルド更新中に一度favicon 404が記録されたため、ビルド完了後に全試験を再実行してエラーなしを確認。

公開検証は配信後に追記。

---

# v2.5.16 — 2026-09-27

全7作品を実サイトで1920×1080 / DPR2から3840×2160 PNGへ再撮影。画像枠・サムネイル・両シェーダーのクロップを16:9へ変更。LiquidSurfaceのDPR上限を1.25から2に変更。元の1440×900/848px素材を大きく表示していた条件を解消。

ローカルdist (index-DQoBOgS6.js): npm test 17項目PASS。check-sharpnessで全7画像3840×2160、表示比率16:9、実WebGLキャンバス3840×2160、390px幅の比率と横溢れなしを確認。実画面を静止画で目視（動画なし）。check-handoff往復PASS、画面切替時alpha255。スマートフォン実機は未確認。qa/v2.5.16/sharpness-results.jsonと各画面に記録。公開確認は配信後に追記。

v2.5.15配信ジョブは本変更をまとめるためキャンセル。中国サイト本体は撮影時点では旧名表示のため、撮影画像を改ざんせずそのまま採用。ポートフォリオの作品名は「一帯一旅 ～中国の街をめぐる旅の地図～」。

公開済み: commit 5e0abefe0e4fcf55470a37ef913a5a8e22837738、Actions 36251660757 build/deploy成功。公開URLでcheck-deployment全5項目PASS（build.json 2.5.16/commit一致）、check-sharpnessも全7画像3840×2160・16:9・DPR2描画・390px幅PASS。通常WebGL表示の中国地図も目視確認。16:9化後のcheck-wring PASS（3倍ねじり、連続白化、落下継続）。qa/deployment/public-results.jsonとqa/v2.5.16に保存。

---

# v2.5.15 — 2026-09-27

v2.5.14の改名を含む。白化を終盤限定から連続進行へ変更。2200msまでにsmoothstepで92%、残りを2390msまでに白化し、2400msから解除。

ビルド成功（index-Cyn48t5q.js）。check-wring PASS: 500ms白化>10%、1100ms>45%、1800ms>80%、絞り中に単調増加、解除前に白化完了。3倍ねじり・粒子の落下継続・文字独立も回帰確認。検査中の次スライド混入をGPU状態の同時取得で防止。check-handoffも往復PASS（除去時alpha255）。静止画目視済み。作品名の1440/390px確認は同一タイトル実装のv2.5.14で実施。公開確認は配信後に追記。旧v2.5.14の配信ジョブは最新版へまとめるためキャンセル。

---

# v2.5.14 — 2026-09-27

中国地図作品を「一帯一旅 ～中国の街をめぐる旅の地図～」へ改名。大見出しは一帯一旅、副題は日本語の小見出しとして配置。作品一覧・代替テキスト・リンクのアクセシブル名・meta description・noscriptも新名称。URLと説明は維持。

ビルド成功。Chromeで作品選択・見出し・副題・日本語lang・一覧・1440/390pxの実表示と横溢れなしを確認。qa/v2.5.14/title-*.png。公開確認は配信後に追記。

---

# v2.5.13 — published and verified 2026-09-27 JST

公開コミット a4699310de3579aaf146e79c1a74a88fd915a193。GitHub Actions 36250135694 build/deploy 成功。公開URL https://hinahina-vr.github.io/portfolio/ 。

公開後check-deployment 5項目PASS: 実自動切替・全7作品・実外部リンク・履歴・390px表示・資産取得・build.jsonのversion/commit一致。public-handoffも往復2回PASS: canvas除去瞬間の通常画像alpha=255、surfaceWet=1。英字フォントregular/boldの読込、Index不在を確認。public-desktop.pngと公開復帰後の静止画を目視。記録はqa/deployment/public-results.json と qa/v2.5.13/public-handoff-results.json。

ローカル確認。JS index-DRP6HpmE.js / CSS index-D_Vj_F6G.css。

変更: ひねり10.2→30.6rad、断面80%圧縮をGPU面と集水計算の双方に適用。生存粒子を再利用しない。色と半径を発生時のGPU状態として保持。切替終了時は通常面を同期描画してから転換用canvasを削除。Index削除、3か所のUIの変位・粘性風登場、TeX Gyre Heros regular/boldを公式CTAN配布から同梱。

- 最終ビルド成功、既存のチャンク容量警告のみ。
- npm test 17 PASS: フォント読込、全作品・実外部リンク、カテゴリ・履歴、Index削除、背景操作、5幅、フォールバック。最終CSSのreduced motion画像表示も確認。
- check-entrance 5 PASS: UI登場中の3グループに実アニメーション、静止画目視、初回完了・即時キャンセル・モバイル・reduced motion。最終版。
- check-handoff PASS: 修正前はcanvas除去時にsurfaceWet=0かつ読取画素alpha=0で再現。修正後は往復2切替ともsurfaceWet=1かつalpha=255。JS同一の直前CSS版で確認。
- check-wring PASS: GPU最大ひねり>30.5、白化の遅延、独立文字、全生存粒子の位置を各描画で追跡し画面内で上流への再生成・消失なし。JS同一の直前CSS版。
- check-liquid PASS: 実GPUソルバー、通常滴下、加速、停止再開、390px、reduced motion、シェーダーエラーなし。JS同一の直前CSS版。
- check-drainage PASS: 集水量保存、下端・折り目出口。

UI登場・紐状の絞り・復帰後の静止画を目視確認。qa/v2.5.13/に結果。UI変位はSVG/CSS、液体と面変形はGLSL。流体・布の実測物理シミュレーションと同一とは主張しない。実スマホ・Safari/Firefoxは未確認。公開実配信の検証は上記。動画撮影なし。

---

以前の記録:

# v2.5.12 local prototype — 2026-09-26

未公開。JS index-CI6qxZj3.js / CSS index-YELwbKbU.css。公開版未変更。

白化を2200–2390msに限定し、2400msの解除直前まで元画像の色を残す。粒子数768、圧力連動で供給と断面を増加。PanelTransitionと同じ変形面を49×25点で評価し、重力方向の最急下降へ集水量を配分、折り目・縁の流出口と元UVを取得する。流出口の元画素を色に使う。通常時はスクショ本体をWebGLで描画し、液体の実密度に応じて下端を伸ばす。表面にも下向きの濡れた屈折を追加。

これは画面投影面での集水近似と演出用粒子であり、三次元流体・布の水分保持や実測物性の完全なシミュレーションではない。

最終版検証:
- npm run build成功（既存のチャンク容量警告あり）。
- check-drainage PASS: 平面の下端出口、集水総量保存、絞った面の内部折り目出口、高さの変化。
- check-liquid PASS: 実GPU描画、通常時の有色滴下、速度readbackによる加速、初回登場、停止再開、390px、reduced motion、JS/GLSLエラーなし。
- check-wring PASS: 2150msまでは白化なし、解除前に白化完了、一枚の面、3.2秒、文字独立、逆方向選択。
- npm test 17項目PASS: 作品・実外部リンク・履歴・分類・設定・5画面幅・フォールバック。
- qa/v2.5.12/idle-drips-b.png と wring-peak.pngを目視。絞り中の色保持、面の下側から繋がる複数の流れ、通常時の表面屈折・滴下を確認。

動画は撮影なし。実スマホ、Safari/Firefox、公開先は未確認。ZIP配布なし。検証データはqa/v2.5.12/。

---

以前の記録:

# v2.5.11 local prototype — 2026-09-26

未公開。公開版v2.5.0は変更なし。最終JS: index-C1NXldb0.js / CSS: index-YELwbKbU.css。SHA256はqa/v2.5.11/artifact-sha256.json。

旧来の画像引き延ばしとグリッター格子を撤去。three-fluid-fxの速度場を受けるGPU位置・速度テクスチャ、重力・抵抗、粒子を重ねた色の場、圧力連動の供給頻度・大きさ、曲面の光沢へ変更。公式デモをChromeで操作して静止画とソースを調査。詳細はresearch/motion-study/NOTES.md。動画撮影なし。

最終版でnpm run build成功（既存のチャンク容量警告あり）。check-liquid PASS: 実GPU描画、初回浮上、通常時の色、位置・速度readbackによる加速、停止再開、390px、reduced motion、描画エラーなし。新規シェーダーの予約語と裏面カリング問題を実画面で再現・修正し、同じ検査で合格。

check-wring PASS: 3.2秒ease-out、圧力、白化と次画面、逆選択、独立文字。npm test 17項目PASS: 全作品・実外部リンク・履歴・分類・Index・設定・5画面幅・フォールバック。結果はqa/v2.5.11/。通常時と絞りピークの静止画も目視確認。

未確認: 実スマホ、Safari/Firefox、公開先。狭い画面はChromeビューポート試験。SPH・実測アクリル物性・物理布シミュレーションではない。美的完成度の承認を意味しない。ZIP配布なし。

---

以前の記録:

# 検証記録 — v2.5.10 ローカル試作 / 2026-09-26

未公開。公開版v2.5.0は変更なし。

## 最終版

JS index-CrVfjgpY.js / CSS index-YELwbKbU.css。SHA256: qa/v2.5.10/artifact-sha256.json。

最新指示に合わせ、絞り全体を3.2秒に変更。1.9秒のquartic ease-out、0.5秒のタメ、0.8秒の解除。初速を強くして急速に減速する。初回GPU準備時間は動作時間から除外。

従来の板状のねじれを、縦方向の折り目を持つ束へ畳んで両端を逆にねじる形に変更。面の法線から陰影を作り、白くなっても折り目を残す。これはキネマティックな変形でありXPBD・自己衝突ソルバーの実装ではない。

液体は短い注入パルスと明確な注入停止で分離。停止時に古い色が残り長い帯になる原因を修正。速度はv²=v0²+2g*distance、g=980画面px/s²の自由落下則。画面上の演出スケールであり実世界のメートル換算やアクリルの物性測定ではない。元画像由来の色差を残し、最新指示のキラキラした細かな反射を液体の内側だけに追加。three-fluid-fxの速度・密度およびGPU色フィードバックを使用。

## 検証

- 最終ビルド成功。
- 最終版check-liquid.mjs PASS。実GPUソルバー・色フィードバック、初回浮上、通常時の有色出力と動き、停止再開、390px、reduced motion、JS/GLSLエラーなし。
- 最終版check-wring.mjs PASS。白化、逆方向選択、圧力uniform、一枚の面、全値有限、独立文字、3.2秒の動作時間を検証。
- 最終版check-panel-transition.mjs 8 PASS。文字の重なり・黒枠なし・連続選択・キャンセル・モバイル・Index・描画エラーなし。
- 直前版index-e9bUt4-d.jsでnpm test 17 PASS。全作品・外部リンク・履歴・分類・設定・5画面幅・フォールバック。その後の変更はグリッター強度と移動、絞りのイージング・所要時間のみ。最終版で関連する3つの試験を再実行。
- 最終wring-peak.pngを目視。束ねた白い布の陰影と、分離した液体内の光点を確認。動画wring-demo.webm / liquid-demo.webm。

## リサーチ

Matthias MüllerのCloth only bends資料、XPBD原論文、three-fluid-fx公式Effects Guideを読んで参考にした。伸ばしすぎの抑制と折り目の形状を適用したが、物理布シミュレーションを導入したとは主張しない。実写動画は検索したが取得できず観察していない。詳細・リンクはresearch/motion-study/NOTES.md。

物理スマホ、Safari/Firefox、公開先は未検証。スマホはChromeビューポート変更。ZIP配布なし。

追加回帰: 実GPUの650ms時点curl >8、1300ms時点curl >10を確認。強いイーズアウトを数値検証しPASS。


2026-09-26: ユーザー指示により、この作業の録画ファイルを削除。検証スクリプトの録画設定・動画保存処理も削除。上記の動画への言及は過去の検証時点の記録で、動画は現在存在しない。今後は録画しない。
