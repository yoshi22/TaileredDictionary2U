# 10. Metrics & Growth

## 主要KPI

### North Star Metric
**週間アクティブ復習ユーザー数 (WAU-Reviewers)**

理由:
- 復習を継続 = 価値を実感している
- Entry登録よりも「定着」が重要
- 有料化への最も強い予測因子

### AARRR フレームワーク

| 段階 | 指標 | 目標値 | 計測方法 |
|------|------|--------|---------|
| **Acquisition** | 新規サインアップ | 100/週 | auth.users.created |
| **Activation** | D1に1Entry作成 | 40% | entries.created D1 |
| **Retention** | D7復習実行 | 25% | usage_logs.review D7 |
| **Revenue** | Plus転換 | 3% | entitlements.plan_type |
| **Referral** | 紹介からの登録 | 10% | ref_code tracking |

### リテンション目標

| 期間 | 目標 | 健全性判断 |
|------|------|-----------|
| D1 | > 40% | 初日のアハ体験 |
| D7 | > 25% | 習慣化開始 |
| D30 | > 15% | 定着 |
| D90 | > 10% | ロイヤルユーザー |

---

## イベント設計

### 計測イベント一覧

#### ユーザーライフサイクル

| イベント名 | トリガー | プロパティ |
|-----------|---------|-----------|
| `user_signed_up` | サインアップ完了 | method (email/google/apple) |
| `user_logged_in` | ログイン | method |
| `user_logged_out` | ログアウト | - |
| `user_deleted_account` | アカウント削除 | reason (任意) |

#### Entry関連

| イベント名 | トリガー | プロパティ |
|-----------|---------|-----------|
| `entry_created` | Entry保存 | deck_id, has_context, has_enrichment |
| `entry_updated` | Entry更新 | fields_changed[] |
| `entry_deleted` | Entry削除 | - |
| `enrichment_generated` | AI生成完了 | duration_ms, model |
| `enrichment_failed` | AI生成失敗 | error_type |

#### 復習関連

| イベント名 | トリガー | プロパティ |
|-----------|---------|-----------|
| `review_session_started` | 復習開始 | deck_id, due_count |
| `review_card_answered` | 難易度選択 | rating, response_time_ms |
| `review_session_completed` | 復習完了 | cards_reviewed, duration_ms |
| `review_session_abandoned` | 途中離脱 | cards_reviewed, reason |

#### Deck関連

| イベント名 | トリガー | プロパティ |
|-----------|---------|-----------|
| `deck_created` | Deck作成 | - |
| `deck_renamed` | Deck名変更 | - |
| `deck_deleted` | Deck削除 | entry_count |

#### 課金関連

| イベント名 | トリガー | プロパティ |
|-----------|---------|-----------|
| `pricing_page_viewed` | 料金ページ表示 | source (settings/limit_reached/etc) |
| `checkout_started` | チェックアウト開始 | plan, price |
| `checkout_completed` | 決済完了 | plan, price |
| `checkout_abandoned` | 決済離脱 | plan, step |
| `subscription_canceled` | 解約 | reason (任意) |
| `credits_purchased` | クレジット購入 | amount, price |

#### 機能使用

| イベント名 | トリガー | プロパティ |
|-----------|---------|-----------|
| `search_performed` | 検索実行 | query_length, results_count |
| `export_requested` | エクスポート | format (csv/json) |
| `import_completed` | インポート完了 | entry_count |

### イベント実装例

```typescript
// lib/analytics/events.ts

export interface AnalyticsEvent {
  name: string
  properties?: Record<string, unknown>
  userId?: string
  timestamp?: Date
}

export const analytics = {
  track(event: AnalyticsEvent) {
    // 開発環境: コンソール出力
    if (process.env.NODE_ENV === 'development') {
      console.log('[Analytics]', event.name, event.properties)
    }

    // 本番環境: PostHog等に送信
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(event.name, event.properties)
    }
  },

  identify(userId: string, traits?: Record<string, unknown>) {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.identify(userId, traits)
    }
  }
}

// 使用例
analytics.track({
  name: 'entry_created',
  properties: {
    deck_id: 'uuid',
    has_context: true,
    has_enrichment: true
  }
})
```

### サーバーサイドイベント

```typescript
// lib/analytics/server.ts

export async function trackServerEvent(
  event: string,
  userId: string,
  properties?: Record<string, unknown>
) {
  // usage_logsテーブルに記録
  await supabase.from('usage_logs').insert({
    user_id: userId,
    action_type: event,
    metadata: properties
  })

  // PostHog Server API（オプション）
  if (process.env.POSTHOG_API_KEY) {
    await fetch('https://app.posthog.com/capture/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: process.env.POSTHOG_API_KEY,
        event,
        distinct_id: userId,
        properties
      })
    })
  }
}
```

---

## コホート分析

### リテンションコホート

```sql
-- 週次リテンション
WITH user_cohorts AS (
  SELECT
    id AS user_id,
    DATE_TRUNC('week', created_at) AS cohort_week
  FROM auth.users
),
weekly_activity AS (
  SELECT
    user_id,
    DATE_TRUNC('week', created_at) AS activity_week
  FROM usage_logs
  WHERE action_type = 'review'
  GROUP BY user_id, DATE_TRUNC('week', created_at)
)
SELECT
  c.cohort_week,
  COUNT(DISTINCT c.user_id) AS cohort_size,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '1 week' THEN a.user_id END) AS week_1,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '2 weeks' THEN a.user_id END) AS week_2,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '3 weeks' THEN a.user_id END) AS week_3,
  COUNT(DISTINCT CASE WHEN a.activity_week = c.cohort_week + INTERVAL '4 weeks' THEN a.user_id END) AS week_4
FROM user_cohorts c
LEFT JOIN weekly_activity a ON c.user_id = a.user_id
GROUP BY c.cohort_week
ORDER BY c.cohort_week DESC;
```

### 転換コホート

```sql
-- Free → Plus 転換率（週次コホート）
WITH user_cohorts AS (
  SELECT
    id AS user_id,
    DATE_TRUNC('week', created_at) AS signup_week
  FROM auth.users
),
plus_conversions AS (
  SELECT
    user_id,
    MIN(updated_at) AS conversion_date
  FROM entitlements
  WHERE plan_type = 'plus'
  GROUP BY user_id
)
SELECT
  c.signup_week,
  COUNT(DISTINCT c.user_id) AS signups,
  COUNT(DISTINCT CASE WHEN p.conversion_date <= c.signup_week + INTERVAL '7 days' THEN p.user_id END) AS converted_w1,
  COUNT(DISTINCT CASE WHEN p.conversion_date <= c.signup_week + INTERVAL '14 days' THEN p.user_id END) AS converted_w2,
  COUNT(DISTINCT CASE WHEN p.conversion_date <= c.signup_week + INTERVAL '30 days' THEN p.user_id END) AS converted_m1
FROM user_cohorts c
LEFT JOIN plus_conversions p ON c.user_id = p.user_id
GROUP BY c.signup_week
ORDER BY c.signup_week DESC;
```

---

## 獲得施策

### 1. SEO / コンテンツマーケティング

| 施策 | 内容 | 想定効果 |
|------|------|---------|
| ブログ記事 | 「SRS学習法」「専門用語の覚え方」 | オーガニック流入 |
| テンプレートDeck公開 | プログラミング用語、TOEIC頻出 | シェア促進 |
| ランディングページSEO | 「単語帳アプリ」「間隔反復」 | 検索流入 |

**検証計画:**
- 週1記事投稿 × 3ヶ月
- 計測: オーガニック流入数、記事→サインアップ率

### 2. コミュニティ / SNS

| 施策 | 内容 | 想定効果 |
|------|------|---------|
| Twitter/X | 開発進捗、学習Tips | 認知拡大 |
| Qiita/Zenn | 技術記事（SRS実装等） | エンジニア獲得 |
| Discord | ユーザーコミュニティ | リテンション向上 |

**検証計画:**
- フォロワー 1000 目標
- 計測: SNS→サインアップ率

### 3. 紹介プログラム（将来）

| 施策 | 内容 | 想定効果 |
|------|------|---------|
| 紹介コード | 紹介者・被紹介者に特典 | バイラル係数向上 |
| Deck共有 | 公開Deckからの流入 | 新規ユーザー獲得 |

**特典案:**
- 紹介者: +10クレジット or 1週間Plus
- 被紹介者: +10クレジット

### 4. 有料広告（将来）

| チャネル | 想定CPA | 検証タイミング |
|---------|---------|---------------|
| Twitter/X Ads | $20-40 | オーガニックが頭打ち後 |
| Google Ads | $30-50 | LTV確定後 |

---

## ファネル分析

### サインアップファネル

```
LP訪問 → サインアップページ → 入力完了 → 認証完了
  100%        40%                 25%          20%
```

### Activation ファネル

```
サインアップ → 初回Entry作成 → AI生成実行 → 初回復習
   100%            60%            50%          30%
```

### 転換ファネル

```
上限到達 → 料金ページ → チェックアウト開始 → 完了
  100%       50%           20%              15%
```

### 計測クエリ

```sql
-- Activationファネル（過去30日）
WITH signups AS (
  SELECT id, created_at
  FROM auth.users
  WHERE created_at >= NOW() - INTERVAL '30 days'
),
first_entry AS (
  SELECT user_id, MIN(created_at) AS first_entry_at
  FROM entries
  GROUP BY user_id
),
first_enrichment AS (
  SELECT user_id, MIN(created_at) AS first_enrichment_at
  FROM usage_logs
  WHERE action_type = 'generation'
  GROUP BY user_id
),
first_review AS (
  SELECT user_id, MIN(created_at) AS first_review_at
  FROM usage_logs
  WHERE action_type = 'review'
  GROUP BY user_id
)
SELECT
  COUNT(DISTINCT s.id) AS signups,
  COUNT(DISTINCT e.user_id) AS created_entry,
  COUNT(DISTINCT en.user_id) AS generated_enrichment,
  COUNT(DISTINCT r.user_id) AS completed_review
FROM signups s
LEFT JOIN first_entry e ON s.id = e.user_id
LEFT JOIN first_enrichment en ON s.id = en.user_id
LEFT JOIN first_review r ON s.id = r.user_id;
```

---

## ダッシュボード設計

### 日次レポート

| 指標 | 計算 |
|------|------|
| DAU | ユニークログインユーザー |
| 新規サインアップ | auth.users 当日作成 |
| Entry作成数 | entries 当日作成 |
| AI生成数 | usage_logs.generation 当日 |
| 復習セッション数 | usage_logs.review 当日 |
| 新規Plus | entitlements.plan_type変更 |

### 週次レポート

| 指標 | 計算 |
|------|------|
| WAU | 週間ユニークユーザー |
| WAU-Reviewers | 週間復習ユーザー |
| W1 Retention | 先週サインアップ→今週アクティブ |
| MRR | Plus × $4.99 + Credits |
| ARPU | MRR / MAU |

### アラート設定

| 条件 | アクション |
|------|-----------|
| D1 Retention < 30% | Activationフロー見直し |
| AI生成エラー率 > 5% | LLM設定確認 |
| Checkout離脱 > 90% | 決済フロー確認 |

---

## A/Bテスト計画

### 価格テスト

```typescript
// lib/experiments/pricing.ts

export function getPricingVariant(userId: string): 'A' | 'B' | 'C' {
  const hash = hashCode(userId)
  const bucket = hash % 100

  if (bucket < 33) return 'A' // $4.99
  if (bucket < 66) return 'B' // $3.99
  return 'C' // $6.99
}
```

### オンボーディングテスト

| バリアント | 内容 | 計測 |
|-----------|------|------|
| Control | 現行フロー | Activation率 |
| Test A | チュートリアル追加 | Activation率 |
| Test B | サンプルEntry付与 | Activation率 |

### 統計的有意性

```typescript
// サンプルサイズ計算
// 95%信頼区間、80%検出力、5%効果量
// → 約800サンプル/バリアント必要
```

---

## 関連ドキュメント

- [09_business_model_unit_economics.md](./09_business_model_unit_economics.md) - ビジネスモデル
- [11_roadmap.md](./11_roadmap.md) - ロードマップ
- [13_testing_ops.md](./13_testing_ops.md) - テスト・運用
