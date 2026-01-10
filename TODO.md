# TODO - TD2U 実装タスク

## Phase 0: 環境構築・基盤（Week 1） ✅ 完了

### 0.1 リポジトリ・プロジェクト初期化
- [x] GitHub リポジトリ作成 (https://github.com/yoshi22/TaileredDictionary2U)
- [x] Turborepo モノレポ初期化
- [x] pnpm-workspace.yaml 設定
- [x] turbo.json 設定
- [x] .gitignore 作成
- [x] .env.example 作成

### 0.2 Next.js セットアップ
- [x] apps/web/ に Next.js 14 (App Router) 初期化
- [x] TypeScript 設定 (strict mode)
- [x] Tailwind CSS 設定
- [x] ESLint + Prettier 設定
- [x] パスエイリアス設定 (@/)

### 0.3 共有パッケージ作成
- [x] packages/shared-types/ 初期化
- [x] packages/shared-utils/ 初期化
- [x] packages/shared-srs/ 初期化 (SM-2アルゴリズム実装、13テストパス)
- [x] packages/shared-validations/ 初期化
- [x] パッケージ間の依存設定

### 0.4 Supabase セットアップ
- [x] Supabase CLI インストール (v2.67.1)
- [x] ローカル開発環境セットアップ (`supabase start`)
- [x] ローカル環境変数設定 (`apps/web/.env.local`)
- [x] マイグレーション適用済み (`supabase db reset`)
- [ ] Supabase プロジェクト作成 (※本番用、Supabaseダッシュボードで作成後にリンク)
- [x] supabase/ ディレクトリ作成
- [x] 初期マイグレーション作成
  - [x] profiles テーブル
  - [x] entitlements テーブル
  - [x] decks テーブル
  - [x] entries テーブル
  - [x] srs_data テーブル
  - [x] usage_logs テーブル
  - [x] credit_transactions テーブル
- [x] RLS ポリシー設定
- [x] トリガー設定（ユーザー作成時のprofiles/entitlements/deck作成）

### 0.5 認証設定
- [ ] Supabase Auth 設定 (※Supabaseプロジェクト作成後)
- [ ] Email/Password 認証有効化 (※Supabaseプロジェクト作成後)
- [ ] Google OAuth 設定 (※Supabaseプロジェクト作成後)
- [x] 認証ヘルパー関数作成 (lib/supabase/)

### 0.6 デプロイ設定
- [x] vercel.json 作成
- [ ] Vercel プロジェクト作成 (※Vercelダッシュボードで連携)
- [ ] 環境変数設定 (※Vercelダッシュボードで設定)
- [ ] 自動デプロイ確認 (※Vercel連携後)

---

## Phase 1: Web MVP（Week 2-4） ✅ 完了

### 1.1 基本レイアウト・ナビゲーション
- [x] app/layout.tsx（ルートレイアウト）
- [x] 共通 Header コンポーネント
- [x] 共通 Footer コンポーネント
- [x] 認証チェック Layout (authenticated)
- [x] middleware.ts（認証リダイレクト）

### 1.2 認証画面
- [x] /login ページ
- [x] /signup ページ
- [x] ログインフォームコンポーネント
- [x] サインアップフォームコンポーネント
- [x] OAuth ボタン（Google）
- [x] 認証エラーハンドリング

### 1.3 ランディングページ
- [x] / ページ（未認証時）
- [x] Hero セクション
- [x] Features セクション
- [x] Pricing プレビューセクション
- [x] CTA ボタン

### 1.4 ダッシュボード
- [x] /dashboard ページ
- [x] StatsCards コンポーネント（総Entry数、Due数等）
- [x] QuickActions コンポーネント
- [x] RecentEntries コンポーネント
- [x] UsageCard コンポーネント

### 1.5 Entry CRUD
- [x] /entry/new ページ
- [x] /entry/[id] ページ
- [x] /entry/[id]/edit ページ
- [x] EntryForm コンポーネント
- [x] EditEntryForm コンポーネント
- [x] EntryCard コンポーネント
- [x] EntryActions コンポーネント
- [x] EnrichmentPreview コンポーネント
- [x] SrsStatus コンポーネント
- [x] DeckSelect コンポーネント
- [x] API: GET /api/entries
- [x] API: GET /api/entries/[id]
- [x] API: POST /api/entries
- [x] API: PATCH /api/entries/[id]
- [x] API: DELETE /api/entries/[id]
- [x] Zod スキーマ (CreateEntrySchema, UpdateEntrySchema) - packages/shared-validations/

### 1.6 AI Enrichment 生成
- [x] prompts/enrichment.txt 作成
- [x] prompts/system.txt 作成
- [x] lib/llm/types.ts（プロバイダ抽象化）
- [x] lib/llm/openai.ts（OpenAI実装）
- [x] lib/llm/utils.ts（プロンプト読み込み）
- [x] lib/llm/retry.ts（リトライロジック）
- [x] API: POST /api/enrichment
- [x] 使用量チェックロジック
- [x] AI生成中のローディングUI
- [x] 生成失敗時のエラーハンドリング

### 1.7 SRS 復習
- [x] packages/shared-srs/calculator.ts（SM-2実装）
- [x] calculator.test.ts（単体テスト）13テストパス
- [x] /review ページ
- [x] ReviewCard コンポーネント（表/裏）
- [x] DifficultyButtons コンポーネント
- [x] SessionProgress コンポーネント
- [x] SessionSummary コンポーネント
- [x] API: GET /api/review/due
- [x] API: POST /api/review/[id]
- [x] セッション内 "Again" 再表示ロジック

### 1.8 Deck 管理
- [x] /decks ページ
- [x] /deck/[id] ページ
- [x] DeckCard コンポーネント
- [x] DeckList コンポーネント
- [x] DeckForm コンポーネント
- [x] CreateDeckModal コンポーネント
- [x] API: GET /api/decks
- [x] API: POST /api/decks
- [x] API: PATCH /api/decks/[id]
- [x] API: DELETE /api/decks/[id]

### 1.9 設定画面
- [x] /settings ページ
- [x] ProfileSection コンポーネント
- [x] UsageSection コンポーネント
- [x] PlanSection コンポーネント
- [x] DangerZone コンポーネント
- [x] ログアウト機能
- [x] アカウント削除（確認ダイアログ）

### 1.10 使用量制限（Free）
- [x] lib/billing/entitlements.ts
- [x] checkGenerationEntitlement 関数
- [x] consumeGeneration 関数
- [x] 上限到達時のUI（アップグレード促進）

### 1.11 エラーハンドリング・ローディング
- [x] グローバルエラーバウンダリ (app/error.tsx)
- [x] API エラーレスポンス統一 (lib/api/errors.ts)
- [x] ローディングスケルトン (components/ui/Skeleton.tsx)
- [x] ローディング状態 (app/loading.tsx)
- [x] 404ページ (app/not-found.tsx)

### 1.12 レスポンシブ対応
- [x] Mobile ブレークポイント対応 (Tailwind CSS)
- [x] ハンバーガーメニュー (Header内)
- [x] モバイルフレンドリーなカードレイアウト

---

## Phase 2: 課金・グロース（Week 5-6）

### 2.1 Stripe 商品設定
- [ ] Stripe Dashboard でPlusプラン作成
- [ ] Stripe Dashboard でクレジットパック作成
- [ ] Price ID を環境変数に設定

### 2.2 Checkout 実装
- [ ] lib/billing/stripe.ts（Stripeクライアント）
- [ ] API: POST /api/billing/checkout
- [ ] /checkout/success ページ
- [ ] /checkout/cancel ページ
- [ ] Checkout Session作成ロジック

### 2.3 Webhook 処理
- [ ] API: POST /api/webhooks/stripe
- [ ] Webhook 署名検証
- [ ] checkout.session.completed ハンドラ
- [ ] customer.subscription.created ハンドラ
- [ ] customer.subscription.updated ハンドラ
- [ ] customer.subscription.deleted ハンドラ
- [ ] invoice.paid ハンドラ
- [ ] invoice.payment_failed ハンドラ
- [ ] 冪等性確保（webhook_events テーブル）

### 2.4 Entitlements 連携
- [ ] Plus プラン反映ロジック
- [ ] 解約時のFree戻しロジック
- [ ] 月次リセット Cron設定

### 2.5 クレジット購入・消費
- [ ] API: POST /api/billing/credits/purchase
- [ ] クレジット追加ロジック
- [ ] credit_transactions 記録
- [ ] 上限超過時のクレジット消費ロジック
- [ ] consume_credit_atomic RPC関数

### 2.6 Customer Portal
- [ ] API: POST /api/billing/portal
- [ ] 設定画面からのポータルリンク

### 2.7 料金ページ
- [ ] /pricing ページ
- [ ] PlanComparison コンポーネント
- [ ] CreditPackages コンポーネント
- [ ] FAQ セクション

### 2.8 アナリティクス導入
- [ ] lib/analytics/events.ts
- [ ] PostHog or Vercel Analytics 設定
- [ ] 主要イベント計測
  - [ ] user_signed_up
  - [ ] entry_created
  - [ ] enrichment_generated
  - [ ] review_session_completed
  - [ ] checkout_completed
- [ ] サーバーサイドイベント追跡

### 2.9 SEO 基盤
- [ ] メタタグ設定
- [ ] Open Graph 設定
- [ ] sitemap.xml 生成
- [ ] robots.txt

---

## Phase 3: 安定化・改善（Week 7-8）

### 3.1 テスト整備
- [ ] Vitest 設定
- [ ] SRS Calculator 単体テスト
- [ ] バリデーション 単体テスト
- [ ] API Route 統合テスト
- [ ] Playwright 設定
- [ ] 認証フロー E2Eテスト
- [ ] Entry作成フロー E2Eテスト
- [ ] 復習フロー E2Eテスト

### 3.2 監視・ログ
- [ ] Sentry 設定
- [ ] 構造化ログ設定
- [ ] パフォーマンス監視
- [ ] アラート設定

### 3.3 パフォーマンス改善
- [ ] LCP < 3秒 達成
- [ ] 画像最適化
- [ ] コード分割
- [ ] キャッシュ戦略

### 3.4 機能改善
- [ ] Entry 検索機能
- [ ] Enrichment 再生成
- [ ] インポート/エクスポート (CSV)
- [ ] Apple OAuth 設定

### 3.5 セキュリティ
- [ ] レート制限実装
- [ ] 入力サニタイズ
- [ ] 不正利用検知

---

## Phase 3.5: モバイル準備（Week 9-10）

### 3.5.1 Expo セットアップ
- [ ] apps/mobile/ に Expo 初期化
- [ ] Expo Router 設定
- [ ] TypeScript 設定
- [ ] 環境変数設定

### 3.5.2 共通パッケージ連携
- [ ] shared-types 参照
- [ ] shared-utils 参照
- [ ] shared-srs 参照
- [ ] shared-validations 参照

### 3.5.3 認証
- [ ] Supabase クライアント設定
- [ ] AsyncStorage 設定
- [ ] Google OAuth (Expo Auth Session)
- [ ] Apple OAuth

### 3.5.4 基本画面
- [ ] ログイン画面
- [ ] サインアップ画面
- [ ] ダッシュボード画面
- [ ] タブナビゲーション

### 3.5.5 課金準備
- [ ] RevenueCat 設定
- [ ] App Store Connect 商品登録
- [ ] Play Console 商品登録
- [ ] RevenueCat Webhook 設定

### 3.5.6 ビルド・配布
- [ ] EAS Build 設定
- [ ] TestFlight ビルド
- [ ] 内部テスト配布

---

## 継続的タスク

### ドキュメント
- [ ] API ドキュメント更新
- [ ] 設計ドキュメント更新
- [ ] README 更新

### 品質
- [ ] コードレビュー
- [ ] リファクタリング
- [ ] 技術的負債解消

### ユーザーフィードバック
- [ ] バグ報告対応
- [ ] 機能要望検討
- [ ] UX 改善

---

## 備考

### 優先度の考え方
- **P0**: MVP必須、ブロッカー
- **P1**: MVP推奨、ユーザー体験に直結
- **P2**: Nice to have、将来改善

### 見積もりの前提
- 個人開発（1人）
- 1日4-6時間稼働
- 予備日込み

### リスク対応
- 技術的課題は早期に検証
- 外部依存（Stripe, OpenAI）は代替案を検討
- MVP機能に集中、スコープクリープ防止
