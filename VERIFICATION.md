# 検証記録 — v2.5.0 / 2026-09-26

## 対象と変更

アプリコミット：a9dc1119ca9676ebb31e2636e274bc579b02caf9。

作品名の文字ごとに遅れをつけた全画面モーションタイポグラフィを追加。作品画像は枠外のビューポート全体で筒状に曲がって入れ替わり、ヘッダー・一覧・説明・背景も連動する。静止画像は不透明にし、暗色の縁で背景から分離。タブの選択面、ボタン、Index、背景設定を弾性のある同じテーマに統一した。自動切替・既存操作・日本語展示解説は維持する。

## ローカル最終ビルド

- npm run build：成功。ハッシュは qa/v2.5.0/artifact-sha256.json。
- npm test：Windows実Chromeで17 PASS。全作品の画像・実外部リンク、履歴、カテゴリ・キーボード・Index・背景操作、5画面サイズ、動きを減らす設定、模擬WebGL不可・保存拒否、JavaScript無効、実行時エラーを確認。qa/v2.5.0/test-results.json。
- node scripts/check-panel-transition.mjs：6 PASS。実GPUで枠を超える全画面描画、文字演出、終了時のオーバーレイ除去、連続選択、動きを減らす設定による中断・迂回、390px表示、IndexとEscape、シェーダーエラーなしを確認。qa/v2.5.0/transition-results.json。
- キャプチャを目視：画面を横断する文字と枠外の曲面画像、静止時の画像と縁、モバイルIndex。動画も保存：qa/v2.5.0/video/。

## 条件・未確認範囲

通常レイアウト試験は動きを減らす設定で停止。専用演出試験は通常モーションで実行。スマホはChromeのビューポート変更で、実機試験ではない。Safari・Firefox・低性能実機の滑らかさは未確認。WebGL不可と保存拒否は人工条件。外部作品内の全機能は対象外。ZIP配布物なし。前版記録は qa/v2.4.0/VERIFICATION.md と qa/v2.4.0/deployment/ に保管。

## 自動再生と実配信

実時間の8秒自動切替で文字演出が開始・終了し、手動の日本語タイトル切替とIndexの開閉も成功。qa/v2.5.0/autoplay-motion.json、motion-demo.webm。

[GitHub Actions](https://github.com/hinahina-vr/portfolio/actions/runs/36241638014)でクリーンインストール・最終ビルド・17項目の実Chromium検証・Pages公開が成功。ログは qa/v2.5.0/github-actions-passed.log。

公開URL https://hinahina-vr.github.io/portfolio/ の配信確認5項目と専用演出確認6項目がすべてPASS。配信バージョン2.5.0・アプリコミット一致、実時間の自動切替、全画像と説明、外部概念ページの該当箇所への実遷移、履歴、Index、モバイル幅、全画面キャンバス・文字演出・中断処理を確認。公開された静止PC画面と演出途中のキャプチャを目視した。公開結果は qa/deployment/public-results.json と qa/v2.5.0/transition-results.json。ローカル専用演出結果は qa/v2.5.0/local-transition/ に保存。検証後の変更は記録文書のみ。
