# TODO - TD2U 実装タスク

> **最終更新:** 2026-01-13
>
> ## 進捗サマリー
>
> | Phase | 状況 | 備考 |
> |-------|------|------|
> | Phase 0: 環境構築 | ✅ 95% | 手動設定のみ残り（Supabase本番、Vercel） |
> | Phase 1: Web MVP | ✅ 100% | 全機能実装完了 |
> | Phase 2: 課金・グロース | ✅ 95% | Stripe商品登録のみ手動 |
> | Phase 3: 安定化・改善 | ✅ 95% | Apple OAuth、アラート設定のみ残り |
> | Phase 3.5: モバイル準備 | 🔄 80% | コード完了、手動設定残り |
> | Phase 4: モバイル MVP | ✅ 80% | コード完了、課金/ストア提出は手動 |
>
> **手動対応が必要なタスク一覧:**
> - Supabase 本番プロジェクト作成・認証設定
> - Vercel プロジェクト作成・環境変数設定
> - Stripe 商品登録（Plus プラン、クレジットパック）
> - Sentry アラート設定
> - EAS プロジェクト初期化 (`eas init`)
> - App Store Connect / Play Console 商品登録
> - RevenueCat Webhook 設定

---

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

## Phase 2: 課金・グロース（Week 5-6） ✅ コード完了（商品登録は手動）

### 2.1 Stripe 商品設定 ⏳ 手動設定要
- [ ] Stripe Dashboard でPlusプラン作成
- [ ] Stripe Dashboard でクレジットパック作成
- [ ] Price ID を環境変数に設定

### 2.2 Checkout 実装 ✅ 完了
- [x] lib/billing/stripe.ts（Stripeクライアント）
- [x] API: POST /api/billing/checkout
- [x] /checkout/success ページ
- [x] /checkout/cancel ページ
- [x] Checkout Session作成ロジック

### 2.3 Webhook 処理 ✅ 完了
- [x] API: POST /api/webhooks/stripe
- [x] Webhook 署名検証
- [x] checkout.session.completed ハンドラ
- [x] customer.subscription.created ハンドラ
- [x] customer.subscription.updated ハンドラ
- [x] customer.subscription.deleted ハンドラ
- [x] invoice.paid ハンドラ
- [x] invoice.payment_failed ハンドラ
- [x] 冪等性確保（webhook_events テーブル）

### 2.4 Entitlements 連携 ✅ 完了
- [x] Plus プラン反映ロジック
- [x] 解約時のFree戻しロジック
- [x] 月次リセット Cron設定

### 2.5 クレジット購入・消費 ✅ 完了
- [x] API: POST /api/billing/credits/purchase
- [x] クレジット追加ロジック
- [x] credit_transactions 記録
- [x] 上限超過時のクレジット消費ロジック
- [x] consume_credit_atomic RPC関数 - 2026-01-12完了
  - PostgreSQL関数でアトミックなクレジット消費
  - FOR UPDATE行ロックで競合防止

### 2.6 Customer Portal ✅ 完了
- [x] API: POST /api/billing/portal
- [x] 設定画面からのポータルリンク

### 2.7 料金ページ ✅ 完了
- [x] /pricing ページ
- [x] PlanComparison コンポーネント
- [x] CreditPackages コンポーネント
- [x] FAQ セクション

### 2.8 アナリティクス導入 ✅ 完了
- [x] lib/analytics/events.ts
- [x] Vercel Analytics + SpeedInsights 設定
- [x] 主要イベント計測
  - [x] user_signed_up
  - [x] entry_created
  - [x] enrichment_generated
  - [x] review_session_completed
  - [x] checkout_completed
- [x] クライアントサイドイベント追跡（checkout, success page）

### 2.9 SEO 基盤 ✅ 完了
- [x] メタタグ設定（layout.tsx 強化）
- [x] Open Graph 設定
- [x] sitemap.ts 作成
- [x] robots.ts 作成
- [x] Viewport 設定
- [x] 主要ページにメタデータ追加（homepage, pricing）

---

## Phase 3: 安定化・改善（Week 7-8） ✅ コード完了

### 3.1 テスト整備 ✅ 完了
- [x] Vitest 設定
- [x] SRS Calculator 単体テスト
- [x] バリデーション 単体テスト
- [x] API Route 統合テスト（169テストパス） - 2026-01-13更新
  - decks, decks/[id], stats, profile, entries/export, entries/import, billing/credits/purchase テスト追加
- [x] Playwright 設定
- [x] 認証フロー E2Eテスト
- [x] Entry作成フロー E2Eテスト
- [x] 復習フロー E2Eテスト

### 3.2 監視・ログ ✅ 完了
- [x] Sentry SDK 設定（@sentry/nextjs）
- [x] sentry.client.config.ts / sentry.server.config.ts / sentry.edge.config.ts
- [x] instrumentation.ts（サーバーサイドエラー捕捉）
- [x] next.config.js Sentry wrapper
- [x] エラーハンドラー統合（lib/api/errors.ts）
- [x] Error Boundary統合（app/error.tsx）
- [x] パフォーマンス監視（トレースサンプリング10%）
- [ ] アラート設定（Sentryダッシュボードで設定）

### 3.3 パフォーマンス改善 ✅ 完了
- [x] 画像最適化（next.config.js - avif/webp対応）
- [x] フォント最適化（display: swap, preload）
- [x] SWR最適化（revalidateOnFocus: false, dedupingInterval）
- [ ] LCP計測・改善（Lighthouse実測後）

### 3.4 機能改善 ✅ 主要完了
- [x] Entry 検索機能（term, context, enrichment横断検索）
- [x] Entries一覧ページ（/entries - 検索、デッキフィルター、ソート、ページネーション）
- [x] Enrichment 再生成（force_regenerate オプション）
- [x] ConfirmDialog コンポーネント
- [x] インポート/エクスポート (CSV) - 2026-01-12完了
  - GET /api/entries/export (CSVエクスポート、デッキフィルター対応)
  - POST /api/entries/import (CSVインポート、重複スキップオプション)
  - ExportButton, ImportModal コンポーネント
  - Rate Limiting: csvExport 10/時間, csvImport 3/時間
- [ ] Apple OAuth 設定

### 3.5 セキュリティ ✅ 主要完了
- [x] レート制限実装（Upstash Ratelimit）
  - entries POST: 50/時間
  - enrichment POST: 10/分
  - decks POST: 20/時間
  - checkout POST: 5/時間
- [x] 入力サニタイズ（追加対策） - 2026-01-12完了
  - 制御文字除去、Unicode正規化 (sanitize.ts)
  - Entry/Deck Zodスキーマにサニタイズtransform追加
  - EnrichmentPreviewのURL安全性検証 (javascript:等を拒否)
- [x] 不正利用検知 - 2026-01-12完了
  - Entry作成スパイク検知 (30件/10分)
  - Enrichment連続呼び出し検知 (20回/5分)
  - 長文字列繰り返し検知 (5回/時間)
  - CSVインポートスパイク検知 (5回/時間)
  - Upstash Redis カウンター管理
  - Sentry アラート連携

---

## Phase 3.5: モバイル準備（Week 9-10） 🔄 コード完了（手動設定残り）

### 3.5.1 Expo セットアップ ✅ 完了
- [x] apps/mobile/ に Expo 初期化
- [x] Expo Router 設定
- [x] TypeScript 設定
- [x] 環境変数設定 (.env.example)

### 3.5.2 共通パッケージ連携 ✅ 完了
- [x] shared-types 参照
- [x] shared-utils 参照
- [x] shared-srs 参照
- [x] shared-validations 参照

### 3.5.3 認証 ✅ 完了
- [x] Supabase クライアント設定
- [x] AsyncStorage 設定
- [x] Google OAuth (Expo Auth Session) - コード実装済み
- [x] Apple OAuth - コード実装済み

### 3.5.4 基本画面 ✅ 完了
- [x] ログイン画面
- [x] サインアップ画面
- [x] ダッシュボード画面
- [x] 復習画面
- [x] 設定画面
- [x] タブナビゲーション

### 3.5.5 課金準備 🔄 一部完了（手動設定要）
- [x] RevenueCat 設定コード
- [ ] App Store Connect 商品登録（手動）
- [ ] Play Console 商品登録（手動）
- [ ] RevenueCat Webhook 設定（手動）

### 3.5.6 ビルド・配布 🔄 一部完了（手動設定要）
- [x] EAS Build 設定 (eas.json)
- [ ] EASプロジェクト初期化（`eas init` - 手動）
- [ ] TestFlight ビルド（手動）
- [ ] 内部テスト配布（手動）

### 実装ファイル一覧 (2026-01-13)
- `apps/mobile/package.json` - 依存関係
- `apps/mobile/app.config.ts` - Expo設定
- `apps/mobile/eas.json` - EAS Build設定
- `apps/mobile/tsconfig.json` - TypeScript設定
- `apps/mobile/babel.config.js` - Babel設定
- `apps/mobile/metro.config.js` - Metro設定
- `apps/mobile/.env.example` - 環境変数テンプレート
- `apps/mobile/src/lib/supabase.ts` - Supabaseクライアント
- `apps/mobile/src/lib/auth.ts` - OAuth認証
- `apps/mobile/src/lib/purchases.ts` - RevenueCat
- `apps/mobile/src/hooks/useAuth.ts` - 認証フック
- `apps/mobile/src/hooks/useStats.ts` - 統計フック
- `apps/mobile/src/components/ui/` - 共通UIコンポーネント
- `apps/mobile/src/theme/colors.ts` - カラーテーマ
- `apps/mobile/app/` - Expo Router画面

---

## Phase 4: モバイル MVP（Week 11-13） ✅ コード完了（手動設定残り）

### 4.1 Entry 機能 ✅ 完了 (2026-01-13)
- [x] Entry 一覧画面 (`entries.tsx`)
- [x] Entry 作成画面 (`entry/new.tsx`)
- [x] Entry 詳細画面 (`entry/[id].tsx`)
- [x] Entry 編集画面 (`entry/[id]/edit.tsx`)
- [x] EntryCard コンポーネント
- [x] EntryForm コンポーネント
- [x] useEntries フック
- [x] useEntry フック
- [x] AI Enrichment 生成連携（Web API経由）

### 4.2 復習機能拡張 ✅ 完了 (2026-01-13)
- [x] セッションサマリー表示
- [x] セッション統計（正答率、所要時間）
- [x] 復習履歴画面 (`review/history.tsx`)
- [x] 復習リマインダー設定UI

### 4.3 Deck 管理 ✅ 完了 (2026-01-13)
- [x] Deck 一覧画面 (`decks.tsx`)
- [x] Deck 詳細画面 (`deck/[id].tsx`)
- [x] Deck 作成画面 (`deck/new.tsx`)
- [x] Deck 編集画面 (`deck/[id]/edit.tsx`)
- [x] useDecks フック
- [x] useDeck フック

### 4.4 プッシュ通知 ✅ 完了 (2026-01-13)
- [x] Expo Notifications 設定 (`lib/notifications.ts`)
- [x] 復習リマインダースケジュール（毎日指定時刻）
- [x] 通知許可フロー
- [x] useNotifications フック
- [x] 設定画面に通知設定UI追加

### 4.5 タブナビゲーション ✅ 完了 (2026-01-13)
- [x] Entries タブ追加
- [x] Decks タブ追加
- [x] 5タブ構成（Home, Entries, Review, Decks, Settings）

### 4.6 課金フロー ⏳ 手動設定要
- [ ] RevenueCat 購入フロー実装
- [ ] サブスクリプション管理
- [ ] 購入復元

### 4.7 ストア提出 ⏳ 手動対応要
- [ ] App Store Connect 提出
- [ ] Google Play Console 提出
- [ ] 審査対応

### 実装ファイル一覧 (2026-01-13)
```
apps/mobile/
├── app/(auth)/
│   ├── entry/
│   │   ├── new.tsx           # Entry作成
│   │   ├── [id].tsx          # Entry詳細
│   │   └── [id]/edit.tsx     # Entry編集
│   ├── deck/
│   │   ├── new.tsx           # Deck作成
│   │   ├── [id].tsx          # Deck詳細
│   │   └── [id]/edit.tsx     # Deck編集
│   ├── review/
│   │   └── history.tsx       # 復習履歴
│   └── (tabs)/
│       ├── entries.tsx       # Entry一覧タブ
│       └── decks.tsx         # Deck一覧タブ
└── src/
    ├── hooks/
    │   ├── useEntries.ts     # Entry一覧フック
    │   ├── useEntry.ts       # Entry詳細フック
    │   ├── useDecks.ts       # Deck一覧フック
    │   ├── useDeck.ts        # Deck詳細フック
    │   └── useNotifications.ts # 通知フック
    ├── lib/
    │   └── notifications.ts  # 通知ユーティリティ
    └── components/
        └── entry/
            ├── EntryCard.tsx
            ├── EntryForm.tsx
            └── index.ts
```

---

## 継続的タスク

### ドキュメント
- [x] API ドキュメント更新 - 2026-01-12完了
  - docs/api-reference.md 作成（全エンドポイント、レート制限、エラーコード）
- [x] 設計ドキュメント更新 - 2026-01-13完了
  - docs/13_testing_ops.md - E2E/API統合テスト実装状況を反映
  - docs/05_api_design.md - レート制限詳細セクション追加
- [x] README 更新 - 2026-01-12完了
  - ローカル開発環境セットアップ手順追加
  - 環境変数一覧更新（Upstash, Sentry追加）
- [x] モバイル開発ログ作成 - 2026-01-13完了
  - docs/development-logs/20260113-phase3.5-mobile-app-setup.md
- [x] Phase 4 モバイル MVP 開発ログ作成 - 2026-01-13完了
  - docs/development-logs/20260113-phase4-mobile-mvp.md

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
