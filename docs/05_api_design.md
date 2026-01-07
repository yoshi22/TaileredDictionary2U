# 05. API Design

## API概要

### ベースURL
- 開発: `http://localhost:3000/api`
- 本番: `https://td2u.vercel.app/api`

### 認証
- Supabase Auth セッション（Cookie ベース）
- API Route Handlers で `supabase.auth.getUser()` を使用

### 共通ヘッダー
```http
Content-Type: application/json
```

---

## エンドポイント一覧

| メソッド | パス | 説明 |
|---------|------|------|
| **Entries** |||
| GET | `/api/entries` | Entry一覧取得 |
| GET | `/api/entries/[id]` | Entry詳細取得 |
| POST | `/api/entries` | Entry作成 |
| PATCH | `/api/entries/[id]` | Entry更新 |
| DELETE | `/api/entries/[id]` | Entry削除 |
| **Enrichment** |||
| POST | `/api/enrichment` | AI生成 |
| **Review** |||
| GET | `/api/review/due` | Due Entry取得 |
| POST | `/api/review/[id]` | SRS更新 |
| **Decks** |||
| GET | `/api/decks` | Deck一覧取得 |
| POST | `/api/decks` | Deck作成 |
| PATCH | `/api/decks/[id]` | Deck更新 |
| DELETE | `/api/decks/[id]` | Deck削除 |
| **Stats** |||
| GET | `/api/stats` | 統計情報取得 |
| **Billing** |||
| POST | `/api/billing/checkout` | Checkout Session作成 |
| POST | `/api/billing/portal` | Customer Portal作成 |
| GET | `/api/billing/credits` | クレジット残高取得 |
| POST | `/api/billing/credits/purchase` | クレジット購入 |
| **Webhooks** |||
| POST | `/api/webhooks/stripe` | Stripe Webhook |

---

## エンドポイント詳細

### Entries

#### GET `/api/entries`

Entry一覧を取得。

**Query Parameters:**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `deck_id` | string | No | Deckでフィルタ |
| `search` | string | No | Term検索 |
| `page` | number | No | ページ番号（default: 1） |
| `limit` | number | No | 取得件数（default: 20, max: 100） |
| `sort` | string | No | ソート（created_at_desc, due_date_asc） |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "term": "SRS",
      "context": "SRSを使って効率的に学習",
      "deck_id": "uuid",
      "deck_name": "技術用語",
      "enrichment": {
        "translation_ja": "間隔反復学習システム",
        "translation_en": "Spaced Repetition System",
        "summary": "...",
        "examples": ["..."],
        "related_terms": ["..."],
        "reference_links": [{"title": "...", "url": "..."}]
      },
      "srs": {
        "ease_factor": 2.5,
        "interval_days": 4,
        "due_date": "2025-01-10T00:00:00Z",
        "repetitions": 3
      },
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

#### GET `/api/entries/[id]`

Entry詳細を取得。

**Response: 200 OK**
```json
{
  "data": {
    "id": "uuid",
    "term": "SRS",
    "context": "...",
    "deck_id": "uuid",
    "deck_name": "技術用語",
    "enrichment": { /* ... */ },
    "srs": { /* ... */ },
    "created_at": "2025-01-01T00:00:00Z",
    "updated_at": "2025-01-01T00:00:00Z"
  }
}
```

**Response: 404 Not Found**
```json
{
  "error": "NOT_FOUND",
  "message": "Entry not found"
}
```

#### POST `/api/entries`

Entry作成。

**Request Body:**
```json
{
  "term": "SRS",
  "context": "SRSを使って効率的に学習",
  "deck_id": "uuid",
  "enrichment": {
    "translation_ja": "間隔反復学習システム",
    "translation_en": "Spaced Repetition System",
    "summary": "...",
    "examples": ["..."],
    "related_terms": ["..."],
    "reference_links": [{"title": "...", "url": "..."}]
  }
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `term` | string | Yes | 用語（1-200文字） |
| `context` | string | No | 文脈（0-500文字） |
| `deck_id` | string | No | Deck ID（デフォルトDeck使用） |
| `enrichment` | object | No | AI生成結果 |

**Response: 201 Created**
```json
{
  "data": {
    "id": "uuid",
    "term": "SRS",
    /* ... */
  }
}
```

**Response: 400 Bad Request**
```json
{
  "error": "VALIDATION_ERROR",
  "message": "Invalid request body",
  "details": {
    "term": "Required, max 200 characters"
  }
}
```

#### PATCH `/api/entries/[id]`

Entry更新。

**Request Body:**
```json
{
  "term": "SRS (Updated)",
  "context": "...",
  "deck_id": "uuid",
  "enrichment": { /* ... */ }
}
```

**Response: 200 OK**
```json
{
  "data": { /* updated entry */ }
}
```

#### DELETE `/api/entries/[id]`

Entry削除。

**Response: 204 No Content**

---

### Enrichment

#### POST `/api/enrichment`

AI生成を実行。使用量チェックあり。

**Request Body:**
```json
{
  "term": "SRS",
  "context": "SRSを使って効率的に学習する方法について"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `term` | string | Yes | 用語（1-200文字） |
| `context` | string | No | 文脈（0-500文字） |

**Response: 200 OK**
```json
{
  "data": {
    "translation_ja": "間隔反復学習システム",
    "translation_en": "Spaced Repetition System",
    "summary": "SRSは記憶の定着を科学的に最適化する学習手法です。\n忘却曲線に基づいて復習タイミングを計算します。\nAnkiなどのツールで広く採用されています。",
    "examples": [
      "I use SRS to memorize vocabulary efficiently.",
      "SRSアプリで毎日15分復習しています。"
    ],
    "related_terms": [
      "spaced repetition",
      "forgetting curve",
      "Anki",
      "flashcard"
    ],
    "reference_links": [
      {
        "title": "Spaced repetition - Wikipedia",
        "url": "https://en.wikipedia.org/wiki/Spaced_repetition"
      }
    ]
  },
  "usage": {
    "used": 15,
    "limit": 20,
    "remaining": 5,
    "credit_balance": 0
  }
}
```

**Response: 429 Rate Limit Exceeded**
```json
{
  "error": "RATE_LIMIT_EXCEEDED",
  "message": "月間のAI生成上限に達しました",
  "usage": {
    "used": 20,
    "limit": 20,
    "remaining": 0,
    "credit_balance": 0
  },
  "upgrade_url": "/pricing"
}
```

**Response: 503 Service Unavailable**
```json
{
  "error": "LLM_ERROR",
  "message": "AI生成に失敗しました。しばらくしてから再度お試しください。"
}
```

---

### Review

#### GET `/api/review/due`

復習予定のEntryを取得。

**Query Parameters:**
| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `deck_id` | string | No | Deckでフィルタ |
| `limit` | number | No | 取得件数（default: 20） |

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "term": "SRS",
      "context": "...",
      "enrichment": { /* ... */ },
      "srs": {
        "ease_factor": 2.5,
        "interval_days": 4,
        "due_date": "2025-01-05T00:00:00Z",
        "repetitions": 3
      }
    }
  ],
  "total_due": 15
}
```

#### POST `/api/review/[id]`

復習結果を記録し、SRSパラメータを更新。

**Request Body:**
```json
{
  "rating": 3
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `rating` | number | Yes | 難易度（0: Again, 1: Hard, 2: Good, 3: Easy） |

**Response: 200 OK**
```json
{
  "data": {
    "entry_id": "uuid",
    "previous": {
      "ease_factor": 2.5,
      "interval_days": 4,
      "repetitions": 3
    },
    "updated": {
      "ease_factor": 2.6,
      "interval_days": 10,
      "repetitions": 4,
      "due_date": "2025-01-15T00:00:00Z"
    }
  }
}
```

---

### Decks

#### GET `/api/decks`

**Response: 200 OK**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "技術用語",
      "description": "プログラミング関連の用語",
      "entry_count": 45,
      "due_count": 5,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ]
}
```

#### POST `/api/decks`

**Request Body:**
```json
{
  "name": "技術用語",
  "description": "プログラミング関連の用語"
}
```

**Response: 201 Created**
```json
{
  "data": {
    "id": "uuid",
    "name": "技術用語",
    /* ... */
  }
}
```

#### PATCH `/api/decks/[id]`

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

#### DELETE `/api/decks/[id]`

**Response: 204 No Content**

※ Deck削除時、Entry の deck_id は NULL になる（entries は削除されない）

---

### Stats

#### GET `/api/stats`

**Response: 200 OK**
```json
{
  "data": {
    "total_entries": 150,
    "due_entries": 15,
    "total_decks": 5,
    "reviews_today": 10,
    "streak_days": 7,
    "plan": {
      "type": "plus",
      "generation_used": 45,
      "generation_limit": 200,
      "credit_balance": 50
    }
  }
}
```

---

### Billing

#### POST `/api/billing/checkout`

Stripe Checkout Session を作成。

**Request Body:**
```json
{
  "price_id": "price_xxx",
  "mode": "subscription"
}
```

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `price_id` | string | Yes | Stripe Price ID |
| `mode` | string | Yes | "subscription" or "payment" |

**Response: 200 OK**
```json
{
  "data": {
    "checkout_url": "https://checkout.stripe.com/..."
  }
}
```

#### POST `/api/billing/portal`

Stripe Customer Portal Session を作成。

**Response: 200 OK**
```json
{
  "data": {
    "portal_url": "https://billing.stripe.com/..."
  }
}
```

#### GET `/api/billing/credits`

**Response: 200 OK**
```json
{
  "data": {
    "balance": 50,
    "transactions": [
      {
        "id": "uuid",
        "type": "purchase",
        "amount": 100,
        "balance_after": 100,
        "created_at": "2025-01-01T00:00:00Z"
      },
      {
        "id": "uuid",
        "type": "consume",
        "amount": -1,
        "balance_after": 99,
        "created_at": "2025-01-02T00:00:00Z"
      }
    ]
  }
}
```

#### POST `/api/billing/credits/purchase`

クレジット購入用 Checkout Session を作成。

**Request Body:**
```json
{
  "package_id": "credits_100"
}
```

---

### Webhooks

#### POST `/api/webhooks/stripe`

Stripe Webhook を受信。

**Headers:**
```http
Stripe-Signature: t=xxx,v1=xxx
```

**Handled Events:**
- `checkout.session.completed` - 決済完了
- `customer.subscription.created` - サブスク開始
- `customer.subscription.updated` - サブスク更新
- `customer.subscription.deleted` - サブスク解約
- `invoice.paid` - 請求支払い完了
- `invoice.payment_failed` - 請求支払い失敗

**Response: 200 OK**
```json
{
  "received": true
}
```

---

## エラー仕様

### エラーレスポンス形式

```typescript
interface ApiError {
  error: string;        // エラーコード
  message: string;      // ユーザー向けメッセージ
  details?: unknown;    // 追加情報
}
```

### エラーコード一覧

| コード | HTTP Status | 説明 |
|--------|-------------|------|
| `VALIDATION_ERROR` | 400 | リクエストバリデーションエラー |
| `UNAUTHORIZED` | 401 | 認証エラー |
| `FORBIDDEN` | 403 | 権限エラー |
| `NOT_FOUND` | 404 | リソースが見つからない |
| `RATE_LIMIT_EXCEEDED` | 429 | レート制限超過 |
| `DECK_LIMIT_EXCEEDED` | 429 | Deck数上限超過 |
| `LLM_ERROR` | 503 | LLM呼び出しエラー |
| `INTERNAL_ERROR` | 500 | 内部エラー |

---

## レート制限仕様

### AI生成（`/api/enrichment`）

| プラン | 月間上限 | リセット |
|--------|---------|---------|
| Free | 20回 | 月初（UTC） |
| Plus | 200回 | 月初（UTC） |
| クレジット | 残高分 | なし |

**判定ロジック:**
```
1. monthly_generation_used < monthly_generation_limit なら許可
2. 超過時、credit_balance > 0 ならクレジット消費で許可
3. それ以外は 429 エラー
```

### API全体

| エンドポイント | 制限 |
|---------------|------|
| 全API | 100 req/min per user |
| `/api/enrichment` | 10 req/min per user |
| `/api/webhooks/stripe` | 制限なし（IP制限で保護） |

**Response Headers:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704067200
```

---

## Zodスキーマ

```typescript
// lib/validations/entry.ts
import { z } from 'zod'

export const CreateEntrySchema = z.object({
  term: z.string().min(1).max(200),
  context: z.string().max(500).optional(),
  deck_id: z.string().uuid().optional(),
  enrichment: z.object({
    translation_ja: z.string(),
    translation_en: z.string(),
    summary: z.string(),
    examples: z.array(z.string()),
    related_terms: z.array(z.string()),
    reference_links: z.array(z.object({
      title: z.string(),
      url: z.string().url()
    }))
  }).optional()
})

export const UpdateEntrySchema = CreateEntrySchema.partial()

export const EnrichmentRequestSchema = z.object({
  term: z.string().min(1).max(200),
  context: z.string().max(500).optional()
})

export const ReviewRequestSchema = z.object({
  rating: z.number().int().min(0).max(3)
})

export const CreateDeckSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional()
})

export const CheckoutRequestSchema = z.object({
  price_id: z.string(),
  mode: z.enum(['subscription', 'payment'])
})
```

---

## 関連ドキュメント

- [03_architecture_web.md](./03_architecture_web.md) - アーキテクチャ
- [04_data_model.md](./04_data_model.md) - データモデル
- [06_llm_prompt_design.md](./06_llm_prompt_design.md) - LLMプロンプト設計
- [08_billing_entitlements.md](./08_billing_entitlements.md) - 課金・権利管理
