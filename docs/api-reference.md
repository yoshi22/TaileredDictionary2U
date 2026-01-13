# API Reference

TD2U Web API リファレンス

## 概要

TD2U APIは、Next.js Route Handlersで実装されたRESTful APIです。
すべてのエンドポイントは認証が必要です（Supabase Auth）。

**Base URL**: `https://your-domain.com/api`

## 認証

すべてのAPIリクエストにはSupabase認証セッションが必要です。
認証はCookieベースで自動的に処理されます。

## レート制限

APIにはレート制限が設定されています（Upstash Redis使用）:

| エンドポイント | 制限 |
|---------------|------|
| POST /api/entries | 50リクエスト/時間 |
| POST /api/enrichment | 10リクエスト/分 |
| POST /api/decks | 20リクエスト/時間 |
| POST /api/billing/checkout | 5リクエスト/時間 |
| POST /api/entries/import | 3リクエスト/時間 |
| GET /api/entries/export | 10リクエスト/時間 |

レスポンスヘッダー:
- `X-RateLimit-Limit`: 制限数
- `X-RateLimit-Remaining`: 残り回数
- `X-RateLimit-Reset`: リセット時刻（Unix timestamp）

---

## Entries API

### GET /api/entries

Entry一覧を取得します。

**クエリパラメータ**:

| パラメータ | 型 | デフォルト | 説明 |
|-----------|---|----------|------|
| deck_id | UUID | - | デッキでフィルタ |
| search | string | - | 用語/文脈/翻訳を検索 |
| limit | number | 20 | 取得件数 (1-100) |
| offset | number | 0 | オフセット |
| sort | string | created_at | ソートキー (created_at, term, due_date) |
| order | string | desc | ソート順 (asc, desc) |

**レスポンス**:

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "deck_id": "uuid | null",
      "term": "string",
      "context": "string | null",
      "enrichment": { ... },
      "created_at": "timestamp",
      "updated_at": "timestamp",
      "ease_factor": 2.5,
      "interval_days": 0,
      "repetitions": 0,
      "due_date": "timestamp",
      "last_reviewed_at": "timestamp | null",
      "deck_name": "string | null"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /api/entries/[id]

特定のEntryを取得します。

**レスポンス**:

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "deck_id": "uuid | null",
    "term": "string",
    "context": "string | null",
    "enrichment": { ... },
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### POST /api/entries

新規Entryを作成します。

**リクエストボディ**:

```json
{
  "term": "string (1-200文字)",
  "context": "string (0-500文字, optional)",
  "deck_id": "uuid (optional)"
}
```

**レスポンス** (201 Created):

```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "deck_id": "uuid | null",
    "term": "string",
    "context": "string | null",
    "enrichment": null,
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

### PATCH /api/entries/[id]

Entryを更新します。

**リクエストボディ**:

```json
{
  "term": "string (1-200文字, optional)",
  "context": "string (0-500文字, optional)",
  "deck_id": "uuid | null (optional)"
}
```

### DELETE /api/entries/[id]

Entryを削除します。

**レスポンス** (204 No Content)

---

## Enrichment API

### POST /api/enrichment

EntryのAI Enrichmentを生成します。

**リクエストボディ**:

```json
{
  "entry_id": "uuid",
  "force_regenerate": false
}
```

**レスポンス**:

```json
{
  "data": {
    "entry": { ... },
    "message": "Enrichment generated successfully",
    "generated": true
  }
}
```

**Enrichmentオブジェクト構造**:

```json
{
  "translation_ja": "日本語訳",
  "translation_en": "English translation",
  "summary": "3行要約",
  "examples": ["例文1", "例文2"],
  "related_terms": ["関連語1", "関連語2"],
  "reference_links": [
    { "title": "リンクタイトル", "url": "https://..." }
  ],
  "generated_at": "timestamp",
  "model": "gpt-4o-mini"
}
```

---

## Decks API

### GET /api/decks

Deck一覧を取得します。

**レスポンス**:

```json
{
  "data": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "string",
      "description": "string | null",
      "entry_count": 0,
      "created_at": "timestamp",
      "updated_at": "timestamp"
    }
  ]
}
```

### POST /api/decks

新規Deckを作成します。

**リクエストボディ**:

```json
{
  "name": "string (1-100文字)",
  "description": "string (0-500文字, optional)"
}
```

### PATCH /api/decks/[id]

Deckを更新します。

### DELETE /api/decks/[id]

Deckを削除します（Entry は削除されません）。

---

## Review API

### GET /api/review/due

復習予定のEntry一覧を取得します。

**クエリパラメータ**:

| パラメータ | 型 | デフォルト | 説明 |
|-----------|---|----------|------|
| deck_id | UUID | - | デッキでフィルタ |
| limit | number | 20 | 取得件数 |

### POST /api/review/[id]

復習結果を記録し、SRSデータを更新します。

**リクエストボディ**:

```json
{
  "rating": 0-3
}
```

Rating値:
- 0: Again（もう一度）
- 1: Hard（難しい）
- 2: Good（普通）
- 3: Easy（簡単）

---

## Billing API

### POST /api/billing/checkout

Stripe Checkout セッションを作成します（サブスク/単発ともに `price_id` を指定）。

```json
{
  "price_id": "price_plus_monthly"
}
```

### POST /api/billing/portal

Stripe Customer Portal URLを取得します。

### POST /api/billing/credits/purchase

Plusユーザー向けクレジット購入。`credits` に `"50" | "100" | "250"` を指定し、Checkout URL を返します。

---

## CSV Import/Export API

### GET /api/entries/export

EntryをCSV形式でエクスポートします。

**クエリパラメータ**:

| パラメータ | 型 | 説明 |
|-----------|---|------|
| deck_id | UUID | デッキでフィルタ（optional） |

**レスポンス**: `text/csv`

### POST /api/entries/import

CSVファイルからEntryをインポートします。

**リクエストボディ**: `multipart/form-data`（最大 5MB / 500行）

| フィールド | 型 | 説明 |
|-----------|---|------|
| file | File | CSVファイル |
| deck_id | UUID | インポート先デッキ（optional） |
| skip_duplicates | boolean | 重複スキップ（default: true） |

レスポンスには `total`, `imported`, `skipped`, `failed`, `errors[]` を含む。

---

## Profile API

### GET /api/profile

`profiles` + `entitlements` を返却。

### PATCH /api/profile

`display_name` 等を更新。

**制限**:
- 最大ファイルサイズ: 5MB
- 最大行数: 500行

---

## Webhook API

### POST /api/webhooks/stripe

Stripe Webhookを処理します。

**サポートイベント**:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

---

## エラーレスポンス

すべてのエラーは統一されたフォーマットで返されます:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

**エラーコード一覧**:

| コード | HTTPステータス | 説明 |
|--------|---------------|------|
| UNAUTHORIZED | 401 | 認証が必要 |
| FORBIDDEN | 403 | アクセス権限なし |
| NOT_FOUND | 404 | リソースが見つからない |
| VALIDATION_ERROR | 400 | リクエストが無効 |
| RATE_LIMIT_EXCEEDED | 429 | レート制限超過 |
| INTERNAL_ERROR | 500 | サーバーエラー |

---

## セキュリティ

### 入力サニタイズ

すべてのテキスト入力は自動的にサニタイズされます:
- 制御文字の除去
- Unicode NFC正規化
- トリミング

### URLバリデーション

Enrichmentの参照リンクは安全なURLのみ許可:
- `http://` と `https://` のみ
- `javascript:`, `data:`, `vbscript:` 等は拒否

### 不正利用検知

異常なアクセスパターンは自動検知されSentryに報告されます:
- Entry作成スパイク: 30件/10分
- Enrichment連続呼び出し: 20回/5分
- 長文字列の繰り返し送信
- CSVインポート連続試行
