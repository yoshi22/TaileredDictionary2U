# Phase 2.8, 2.9, 3.2 実装ログ

**日付:** 2026-01-12
**実施者:** Claude Code
**対象:** TaileredDictionary2U (TD2U) Web Application

---

## 概要

Phase 2の残りタスク（Analytics、SEO）とPhase 3.2（Sentry監視）を実装。手動設定不要のタスクを中心に、コードベースの品質向上と運用基盤を整備した。

---

## 実装内容

### Step 1: SEO 基盤（Phase 2.9）

#### 1.1 ルートレイアウト メタデータ強化
**更新**: `apps/web/app/layout.tsx`

- `metadataBase` 設定（OGP画像のURL解決用）
- `title` テンプレート（`%s | TD2U`）
- 詳細な `description`（日本語）
- `keywords` 追加（vocabulary, AI, SRS等）
- `openGraph` 設定（type, locale, siteName, title, description）
- `twitter` カード設定（summary_large_image）
- `robots` 設定（index, follow）
- `viewport` 設定（device-width, initialScale, maximumScale）

#### 1.2 sitemap.ts 作成
**新規**: `apps/web/app/sitemap.ts`

```typescript
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, priority: 1, changeFrequency: 'weekly' },
    { url: `${baseUrl}/pricing`, priority: 0.8, changeFrequency: 'monthly' },
    { url: `${baseUrl}/login`, priority: 0.5, changeFrequency: 'yearly' },
    { url: `${baseUrl}/signup`, priority: 0.5, changeFrequency: 'yearly' },
  ]
}
```

#### 1.3 robots.ts 作成
**新規**: `apps/web/app/robots.ts`

- 公開ページ（/）を許可
- 認証必要ページを除外（/dashboard, /entry/, /review, /decks, /deck/, /settings, /checkout/, /api/）
- sitemap.xml へのリンク

#### 1.4 主要ページ メタデータ追加
**更新**:
- `apps/web/app/(public)/page.tsx` - ホームページ用メタデータ
- `apps/web/app/(public)/pricing/page.tsx` - 料金ページ用メタデータ

---

### Step 2: アナリティクス導入（Phase 2.8）

#### 2.1 パッケージインストール
```bash
pnpm --filter web add @vercel/analytics @vercel/speed-insights
```

#### 2.2 Analytics プロバイダー追加
**更新**: `apps/web/app/layout.tsx`

```typescript
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

// body内:
<Analytics />
<SpeedInsights />
```

#### 2.3 カスタムイベント追跡モジュール
**新規**: `apps/web/lib/analytics/events.ts`

追跡イベント:
- **Auth**: `user_signed_up`, `user_logged_in`, `user_logged_out`
- **Entry**: `entry_created`, `entry_updated`, `entry_deleted`
- **Enrichment**: `enrichment_generated`, `enrichment_regenerated`
- **Review**: `review_session_started`, `review_answered`, `review_session_completed`
- **Deck**: `deck_created`, `deck_deleted`
- **Billing**: `checkout_started`, `checkout_completed`, `checkout_canceled`, `subscription_activated`, `subscription_canceled`, `credits_purchased`
- **Error**: `error_occurred`

#### 2.4 主要フローにイベント追加
**更新**:
- `apps/web/components/billing/CheckoutButton.tsx` - `checkout_started` イベント追加
- `apps/web/app/checkout/success/page.tsx` - `checkout_completed` イベント追加

---

### Step 3: Sentry 監視（Phase 3.2）

#### 3.1 パッケージインストール
```bash
pnpm --filter web add @sentry/nextjs
```

#### 3.2 設定ファイル作成
**新規**:
- `apps/web/sentry.client.config.ts` - クライアント側設定
- `apps/web/sentry.server.config.ts` - サーバー側設定
- `apps/web/sentry.edge.config.ts` - Edge Runtime設定
- `apps/web/instrumentation.ts` - サーバーサイドエラー捕捉

**Sentry設定内容**:
- `tracesSampleRate`: 本番 10%、開発 100%
- `replaysSessionSampleRate`: 10%
- `replaysOnErrorSampleRate`: 100%
- Session Replay 統合（maskAllText, blockAllMedia）
- `tunnelRoute: '/monitoring'`（広告ブロッカー対策）

#### 3.3 next.config.js 更新
**更新**: `apps/web/next.config.js`

```javascript
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: true },
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
  automaticVercelMonitors: true,
})
```

#### 3.4 エラーハンドラー統合
**更新**: `apps/web/lib/api/errors.ts`

```typescript
import * as Sentry from '@sentry/nextjs'

export function handleApiError(error: unknown): NextResponse {
  // 5xx エラーのみSentryに送信（4xxは除外）
  if (error instanceof ApiError && error.status >= 500) {
    Sentry.captureException(error, {
      tags: { type: 'api_error', error_code: error.code },
    })
  }
  // 予期しないエラーは全て送信
  if (!(error instanceof ApiError)) {
    Sentry.captureException(error, { tags: { type: 'unexpected_api_error' } })
  }
  // ...
}
```

#### 3.5 Error Boundary 統合
**更新**: `apps/web/app/error.tsx`

```typescript
import * as Sentry from '@sentry/nextjs'

useEffect(() => {
  Sentry.captureException(error, {
    tags: { type: 'client_error' },
    extra: { digest: error.digest },
  })
}, [error])
```

---

## ファイル構成

```
apps/web/
├── app/
│   ├── layout.tsx              # 更新: メタデータ + Analytics
│   ├── sitemap.ts              # 新規
│   ├── robots.ts               # 新規
│   ├── error.tsx               # 更新: Sentry統合
│   └── (public)/
│       ├── page.tsx            # 更新: メタデータ
│       └── pricing/page.tsx    # 更新: メタデータ
├── lib/
│   ├── analytics/
│   │   └── events.ts           # 新規
│   └── api/
│       └── errors.ts           # 更新: Sentry統合
├── components/billing/
│   └── CheckoutButton.tsx      # 更新: Analytics統合
├── checkout/success/
│   └── page.tsx                # 更新: Analytics統合
├── sentry.client.config.ts     # 新規
├── sentry.server.config.ts     # 新規
├── sentry.edge.config.ts       # 新規
├── instrumentation.ts          # 新規
├── next.config.js              # 更新: Sentry wrapper
└── .env.example                # 更新: Sentry環境変数追加
```

---

## 環境変数追加

`.env.example` に追加:
```
# Sentry (Error Monitoring)
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
SENTRY_ORG=your-org-name
SENTRY_PROJECT=td2u-web
SENTRY_AUTH_TOKEN=sntrys_xxxxx
```

---

## 次のステップ（本番運用前）

### Sentry設定
1. https://sentry.io でプロジェクト作成
2. DSN を取得して環境変数に設定
3. Auth Token を生成（ソースマップアップロード用）
4. アラートルールを設定

### Vercel Analytics設定
- Vercelにデプロイすると自動的に有効化
- カスタムイベントはダッシュボードで確認可能

### SEO確認
- デプロイ後、`/sitemap.xml` と `/robots.txt` にアクセスして確認
- Google Search Console でサイトマップを送信

---

## 残りのタスク

### Phase 3 残り
- [ ] 3.3 パフォーマンス改善（LCP < 3秒、画像最適化、コード分割）
- [ ] 3.4 機能改善（検索、インポート/エクスポート、Apple OAuth）
- [ ] 3.5 セキュリティ（レート制限、入力サニタイズ）

### Phase 2 残り（手動設定）
- [ ] 2.1 Stripe商品設定（Stripe Dashboard操作）

---

## 参考

- Vercel Analytics: https://vercel.com/docs/analytics
- Sentry Next.js: https://docs.sentry.io/platforms/javascript/guides/nextjs/
- Next.js Metadata: https://nextjs.org/docs/app/building-your-application/optimizing/metadata
