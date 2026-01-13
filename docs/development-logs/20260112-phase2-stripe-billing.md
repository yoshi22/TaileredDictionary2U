# Phase 2 Stripe Billing 実装ログ

**日付:** 2026-01-12
**実施者:** Claude Code
**対象:** TaileredDictionary2U (TD2U) Web Application

---

## 概要

Phase 2としてStripeベースの課金システムを実装。Plus Planサブスクリプション、Credit Pack購入、Customer Portal、Webhookによる自動プラン管理を含む完全な課金フローを構築した。

---

## 実装内容

### Step 1: Stripe基盤セットアップ

**作成ファイル:**
```
apps/web/lib/billing/stripe.ts              # Stripeクライアント初期化
supabase/migrations/20250112000001_create_webhook_events.sql  # 冪等性テーブル
```

**stripe.ts の主要エクスポート:**
- `stripe` - Stripeクライアントインスタンス
- `STRIPE_PRICES` - 環境変数からのPrice ID定数
- `CREDIT_AMOUNTS` - Price ID → クレジット数マッピング
- `getCreditAmountFromPriceId()` - Price IDからクレジット数取得
- `isCreditPackPriceId()` - クレジットパック判定
- `isPlusPlanPriceId()` - Plusプラン判定

**webhook_eventsテーブル:**
```sql
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,  -- 冪等性キー
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**entitlements.ts 追加関数:**
- `getEntitlement(userId)` - エンタイトルメント取得
- `activatePlusPlan(userId, customerId, subscriptionId)` - Plus有効化
- `deactivatePlusPlan(userId)` - Freeへダウングレード
- `addCredits(userId, amount, type, description)` - クレジット付与
- `updateStripeCustomerId(userId, customerId)` - 顧客ID更新

---

### Step 2: Checkout API

**作成ファイル:**
```
apps/web/app/api/billing/checkout/route.ts        # POST: チェックアウトセッション作成
apps/web/app/api/billing/credits/purchase/route.ts # POST: クレジット購入
apps/web/app/checkout/success/page.tsx            # 決済成功ページ
apps/web/app/checkout/cancel/page.tsx             # 決済キャンセルページ
```

**checkout/route.ts:**
- `price_id` パラメータを受け取り、Stripe Checkout Sessionを作成
- Plus Plan → `mode: 'subscription'`
- Credit Pack → `mode: 'payment'`
- Stripe顧客が存在しない場合は自動作成

**credits/purchase/route.ts:**
- Plus Plan専用API（Freeユーザーは403）
- `credits: '50' | '100' | '250'` を受け取り対応Price IDでセッション作成

**success/page.tsx:**
- カウントダウン付き自動リダイレクト（5秒後にダッシュボードへ）
- `type=credits` クエリパラメータでクレジット購入とサブスクリプションを区別

---

### Step 3: Webhook処理

**作成ファイル:**
```
apps/web/app/api/webhooks/stripe/route.ts    # Stripe Webhookエンドポイント
```

**処理するイベント:**

| イベント | 処理内容 |
|---------|---------|
| `checkout.session.completed` | サブスクリプション→Plus有効化 / 一回払い→クレジット付与 |
| `customer.subscription.updated` | status=active→Plus有効化 / status=canceled→Free |
| `customer.subscription.deleted` | Freeへダウングレード |
| `invoice.paid` | ログ記録（監査用） |
| `invoice.payment_failed` | エラーログ記録 |

**セキュリティ:**
- `stripe.webhooks.constructEvent()` で署名検証
- `webhook_events` テーブルで冪等性を保証（重複処理防止）

---

### Step 4: Customer Portal

**作成ファイル:**
```
apps/web/app/api/billing/portal/route.ts    # POST: Portalセッション作成
```

**更新ファイル:**
```
apps/web/components/settings/PlanSection.tsx  # Portal連携ボタン追加
```

**PlanSection.tsx 変更点:**
- 「Manage Subscription」ボタンがPortal APIを呼び出すように変更
- プラン説明を「200 AI generations per month」に修正
- 「Upgrade Now」ボタンが `/pricing` へ遷移するように変更

---

### Step 5: Pricing UI

**作成ファイル:**
```
apps/web/app/(public)/pricing/page.tsx           # 料金ページ（Server Component）
apps/web/components/billing/
├── CheckoutButton.tsx    # Checkout呼び出しボタン
├── PlanComparison.tsx    # Free vs Plus 比較カード
├── CreditPackages.tsx    # クレジットパック一覧
├── PricingFAQ.tsx        # FAQ アコーディオン
└── index.ts              # エクスポート
```

**pricing/page.tsx:**
- Server Componentとして実装（認証状態をサーバーで取得）
- 現在のプランに応じてボタン状態を変更
- Heroセクション + プラン比較 + クレジットパック + FAQ + CTA

**PlanComparison.tsx:**
- Free Plan: 20 generations/月、基本機能
- Plus Plan: 200 generations/月、クレジット購入可、Priority Support

**CreditPackages.tsx:**
- 50クレジット: ¥500
- 100クレジット: ¥980 (Save 2%)
- 250クレジット: ¥2,200 (Save 12%)
- Plus Plan専用（Freeユーザーは購入不可）

---

### Step 6: Monthly Reset Cron

**作成ファイル:**
```
supabase/migrations/20250112000002_create_monthly_reset_cron.sql
```

**pg_cron設定:**
```sql
-- 毎月1日 00:00 UTC に実行
SELECT cron.schedule(
  'monthly-generation-reset',
  '0 0 1 * *',
  'SELECT reset_monthly_generations()'
);
```

**reset_monthly_generations()関数:**
- `monthly_generation_used` を0にリセット
- `current_period_start/end` を新しい期間に更新
- `usage_logs` に監査ログを記録

**注意:** pg_cronはSupabase Dashboardで有効化が必要

---

### Step 7: テスト

**作成ファイル:**
```
apps/web/__tests__/__mocks__/stripe.ts                              # Stripeモック
apps/web/app/api/billing/checkout/__tests__/route.test.ts           # 7テスト
apps/web/app/api/billing/portal/__tests__/route.test.ts             # 5テスト
apps/web/app/api/webhooks/stripe/__tests__/route.test.ts            # 12テスト
```

**テストカバレッジ:**
- Checkout API: セッション作成、顧客作成、バリデーション
- Portal API: セッション作成、顧客なしエラー
- Webhook: 全イベントタイプ、冪等性、署名検証

**テスト結果:**
```
Test Files  12 passed (12)
Tests       121 passed (121)
```

---

## 修正・調整

### errors.ts 拡張
```typescript
// forbidden() に message パラメータを追加
forbidden: (message?: string) => new ApiError('FORBIDDEN', message || 'Access denied', 403),
```

### CheckoutButton variant 修正
```typescript
// 'outline' → 有効な variant のみに制限
variant?: 'primary' | 'secondary' | 'ghost'
```

### Stripe API Version
```typescript
// apiVersion を削除（SDKデフォルトを使用）
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  typescript: true,
})
```

---

## ファイル構成

```
apps/web/
├── lib/billing/
│   ├── stripe.ts                    # 新規: Stripeクライアント
│   └── entitlements.ts              # 更新: Plus/Credit関数追加
├── app/
│   ├── api/billing/
│   │   ├── checkout/route.ts        # 新規: Checkout API
│   │   ├── credits/purchase/route.ts # 新規: Credit購入
│   │   └── portal/route.ts          # 新規: Portal API
│   ├── api/webhooks/
│   │   └── stripe/route.ts          # 新規: Webhook処理
│   ├── checkout/
│   │   ├── success/page.tsx         # 新規: 成功ページ
│   │   └── cancel/page.tsx          # 新規: キャンセルページ
│   └── (public)/pricing/
│       └── page.tsx                 # 新規: 料金ページ
├── components/
│   ├── billing/
│   │   ├── CheckoutButton.tsx       # 新規
│   │   ├── PlanComparison.tsx       # 新規
│   │   ├── CreditPackages.tsx       # 新規
│   │   ├── PricingFAQ.tsx           # 新規
│   │   └── index.ts                 # 新規
│   └── settings/
│       └── PlanSection.tsx          # 更新: Portal連携
└── __tests__/__mocks__/
    └── stripe.ts                    # 新規: Stripeモック

supabase/migrations/
├── 20250112000001_create_webhook_events.sql    # 新規
└── 20250112000002_create_monthly_reset_cron.sql # 新規
```

---

## 環境変数

`.env.example` に追加:
```
# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_CREDIT_50_PRICE_ID=price_...
STRIPE_CREDIT_100_PRICE_ID=price_...
STRIPE_CREDIT_250_PRICE_ID=price_...
```

---

## 次のステップ（本番運用前）

1. **Stripeアカウント作成**
   - https://dashboard.stripe.com/register
   - テストモードで開発

2. **商品・価格作成（Stripe Dashboard）**
   - Plus Plan: Recurring, ¥980/月
   - Credit 50: One-time, ¥500
   - Credit 100: One-time, ¥980
   - Credit 250: One-time, ¥2,200

3. **環境変数設定**
   - 各Price IDを取得して `.env.local` に設定

4. **Webhook設定**
   - Endpoint URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.*`, `invoice.*`

5. **pg_cron有効化**
   - Supabase Dashboard → Settings → Database → Extensions → pg_cron

6. **Customer Portal設定**
   - Stripe Dashboard → Settings → Customer portal
   - 許可する機能を設定（プラン変更、キャンセルなど）

---

## 参考ドキュメント

- `docs/08_billing_entitlements.md` - 課金設計
- Stripe Docs: https://stripe.com/docs
