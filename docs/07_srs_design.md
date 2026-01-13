# 07. SRS (Spaced Repetition System) Design

## 概要

### SRSとは
**Spaced Repetition System（間隔反復学習システム）**は、忘却曲線に基づいて最適なタイミングで復習を行う学習手法。

### 採用アルゴリズム
**SM-2（SuperMemo 2）** の簡略版を採用
- 実績: Anki等で広く使用され、効果が実証済み
- シンプル: 実装が容易で、チューニングも簡単
- 拡張性: 将来的な改良が可能

---

## SM-2アルゴリズム

### 基本概念

| 用語 | 説明 | 初期値 | 範囲 |
|------|------|--------|------|
| **Ease Factor (EF)** | 難易度係数。高いほど間隔が長くなる | 2.5 | 1.3 - 2.5 |
| **Interval** | 次回復習までの日数 | 0 | 0 - ∞ |
| **Repetitions** | 連続正解回数 | 0 | 0 - ∞ |
| **Due Date** | 次回復習予定日 | 作成日 | - |

### 評価（Rating）

| 値 | 名前 | 意味 | 影響 |
|----|------|------|------|
| 0 | **Again** | 完全に忘れた | 間隔リセット |
| 1 | **Hard** | 思い出せたが困難 | 間隔を少し伸ばす（前回×1.2） |
| 2 | **Good** | 普通に思い出せた | 標準進行 |
| 3 | **Easy** | 簡単に思い出せた | 間隔延長 |

### アルゴリズム詳細

```
入力:
  - rating: 0-3 (ユーザー評価)
  - current_ef: 現在のEase Factor
  - current_interval: 現在の間隔（日）
  - repetitions: 連続正解回数

出力:
  - new_ef: 新しいEase Factor
  - new_interval: 新しい間隔（日）
  - new_repetitions: 新しい連続正解回数
  - due_date: 次回復習日
```

#### Step 1: Ease Factor の更新

```
if rating == 0:
    new_ef = max(1.3, current_ef - 0.2)
else:
    # rating 1-3 は SM-2 の式で調整
    q = rating + 2
    delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
    new_ef = clamp(current_ef + delta, 1.3, 2.5)
```

Hard評価でもSM-2式を使ってわずかにEFを調整する点がオリジナルとの差分。

#### Step 2: Interval の計算

```
if rating == 0:
    new_interval = 1
    new_repetitions = 0
else:
    new_repetitions = repetitions + 1

    if new_repetitions == 1:
        new_interval = 1
    elif new_repetitions == 2:
        new_interval = 6
    else:
        new_interval = round(current_interval * new_ef)

    if rating == 1:
        new_interval = max(1, round(new_interval * 1.2))
    elif rating == 3:
        new_interval = round(new_interval * 1.3)
```

#### Step 3: Due Date の計算

```
due_date = now + new_interval days
```

---

## 実装コード

### SRS計算ロジック

```typescript
// lib/srs/calculator.ts

export interface SrsData {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: Date
  lastReviewedAt: Date | null
}

export interface SrsUpdate {
  easeFactor: number
  interval: number
  repetitions: number
  dueDate: Date
}

export type Rating = 0 | 1 | 2 | 3

export function calculateNextReview(
  current: SrsData,
  rating: Rating
): SrsUpdate {
  let newEf = current.easeFactor
  let newInterval: number
  let newRepetitions: number

  if (rating < 2) {
    // Again (0) or Hard (1): リセット
    newInterval = 1
    newRepetitions = 0
    // EFは維持（下限チェック）
    newEf = Math.max(1.3, newEf)
  } else {
    // Good (2) or Easy (3)
    newRepetitions = current.repetitions + 1

    // EF更新
    const efDelta = 0.1 - (3 - rating) * (0.08 + (3 - rating) * 0.02)
    newEf = Math.max(1.3, current.easeFactor + efDelta)

    // Interval計算
    if (newRepetitions === 1) {
      newInterval = 1
    } else if (newRepetitions === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(current.interval * newEf)
    }

    // Easyボーナス
    if (rating === 3) {
      newInterval = Math.round(newInterval * 1.3)
    }
  }

  // Due Date計算
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + newInterval)
  dueDate.setHours(0, 0, 0, 0) // 日単位

  return {
    easeFactor: newEf,
    interval: newInterval,
    repetitions: newRepetitions,
    dueDate
  }
}
```

### テストケース

```typescript
// lib/srs/calculator.test.ts

describe('SRS Calculator', () => {
  const initialSrs: SrsData = {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: new Date(),
    lastReviewedAt: null
  }

  describe('First review', () => {
    it('Again resets and schedules for 1 day', () => {
      const result = calculateNextReview(initialSrs, 0)
      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(0)
      expect(result.easeFactor).toBe(2.5)
    })

    it('Good schedules for 1 day (first time)', () => {
      const result = calculateNextReview(initialSrs, 2)
      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(1)
    })

    it('Easy schedules for 1 * 1.3 days (first time)', () => {
      const result = calculateNextReview(initialSrs, 3)
      expect(result.interval).toBe(1) // round(1 * 1.3) = 1
      expect(result.repetitions).toBe(1)
    })
  })

  describe('Second review', () => {
    const secondReview: SrsData = {
      easeFactor: 2.5,
      interval: 1,
      repetitions: 1,
      dueDate: new Date(),
      lastReviewedAt: new Date()
    }

    it('Good schedules for 6 days', () => {
      const result = calculateNextReview(secondReview, 2)
      expect(result.interval).toBe(6)
      expect(result.repetitions).toBe(2)
    })

    it('Easy schedules for ~8 days', () => {
      const result = calculateNextReview(secondReview, 3)
      expect(result.interval).toBe(8) // round(6 * 1.3)
    })
  })

  describe('Third+ review', () => {
    const thirdReview: SrsData = {
      easeFactor: 2.5,
      interval: 6,
      repetitions: 2,
      dueDate: new Date(),
      lastReviewedAt: new Date()
    }

    it('Good schedules for interval * EF days', () => {
      const result = calculateNextReview(thirdReview, 2)
      expect(result.interval).toBe(15) // round(6 * 2.5)
      expect(result.repetitions).toBe(3)
    })

    it('Again resets to 1 day', () => {
      const result = calculateNextReview(thirdReview, 0)
      expect(result.interval).toBe(1)
      expect(result.repetitions).toBe(0)
    })
  })

  describe('Ease Factor bounds', () => {
    it('EF never goes below 1.3', () => {
      const lowEf: SrsData = {
        ...initialSrs,
        easeFactor: 1.3
      }
      const result = calculateNextReview(lowEf, 0)
      expect(result.easeFactor).toBe(1.3)
    })
  })
})
```

---

## 評価UI

### フラッシュカード画面

```
┌─────────────────────────────────────┐
│                                     │
│           [ Term ]                  │
│                                     │
│     ───────────────────────         │
│                                     │
│        Context (if any)             │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         [ Show Answer ]             │
│                                     │
└─────────────────────────────────────┘

      ↓ Show Answer クリック後 ↓

┌─────────────────────────────────────┐
│                                     │
│           [ Term ]                  │
│                                     │
│     ───────────────────────         │
│                                     │
│        日本語訳                      │
│        英語訳                        │
│        要約（3行）                   │
│        例文（1つ）                   │
│                                     │
├─────────────────────────────────────┤
│                                     │
│  [Again]  [Hard]  [Good]  [Easy]   │
│   <1m      ~1d     ~4d     ~7d     │
│                                     │
└─────────────────────────────────────┘
```

### 難易度ボタンの表示

各ボタンに次回復習日を表示:

```typescript
// 次回復習日の計算（表示用）
function getNextDueDates(current: SrsData): Record<Rating, string> {
  return {
    0: '< 1分',  // 実際は1日後だが、セッション内で再表示
    1: formatInterval(calculateNextReview(current, 1).interval),
    2: formatInterval(calculateNextReview(current, 2).interval),
    3: formatInterval(calculateNextReview(current, 3).interval)
  }
}

function formatInterval(days: number): string {
  if (days === 1) return '1日'
  if (days < 7) return `${days}日`
  if (days < 30) return `${Math.round(days / 7)}週`
  if (days < 365) return `${Math.round(days / 30)}ヶ月`
  return `${Math.round(days / 365)}年`
}
```

### Reactコンポーネント

```typescript
// components/review/DifficultyButtons.tsx

interface DifficultyButtonsProps {
  srsData: SrsData
  onSelect: (rating: Rating) => void
  disabled?: boolean
}

export function DifficultyButtons({
  srsData,
  onSelect,
  disabled
}: DifficultyButtonsProps) {
  const nextDates = getNextDueDates(srsData)

  const buttons: { rating: Rating; label: string; color: string }[] = [
    { rating: 0, label: 'Again', color: 'red' },
    { rating: 1, label: 'Hard', color: 'orange' },
    { rating: 2, label: 'Good', color: 'green' },
    { rating: 3, label: 'Easy', color: 'blue' }
  ]

  return (
    <div className="flex gap-2 justify-center">
      {buttons.map(({ rating, label, color }) => (
        <button
          key={rating}
          onClick={() => onSelect(rating)}
          disabled={disabled}
          className={`flex flex-col items-center px-4 py-2 rounded bg-${color}-100 hover:bg-${color}-200`}
        >
          <span className="font-medium">{label}</span>
          <span className="text-xs text-gray-600">{nextDates[rating]}</span>
        </button>
      ))}
    </div>
  )
}
```

---

## データ更新ロジック

### API実装

```typescript
// app/api/review/[id]/route.ts

import { createServerClient } from '@supabase/ssr'
import { calculateNextReview, Rating } from '@/lib/srs/calculator'
import { z } from 'zod'

const ReviewRequestSchema = z.object({
  rating: z.number().int().min(0).max(3) as z.ZodType<Rating>
})

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient(/* ... */)

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  // リクエストバリデーション
  const body = await request.json()
  const result = ReviewRequestSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'VALIDATION_ERROR', details: result.error },
      { status: 400 }
    )
  }

  const { rating } = result.data
  const entryId = params.id

  // 現在のSRSデータ取得
  const { data: srsData, error: fetchError } = await supabase
    .from('srs_data')
    .select('*')
    .eq('entry_id', entryId)
    .single()

  if (fetchError || !srsData) {
    return Response.json({ error: 'NOT_FOUND' }, { status: 404 })
  }

  // Entry所有権チェック
  const { data: entry } = await supabase
    .from('entries')
    .select('user_id')
    .eq('id', entryId)
    .single()

  if (entry?.user_id !== user.id) {
    return Response.json({ error: 'FORBIDDEN' }, { status: 403 })
  }

  // SRS計算
  const currentSrs = {
    easeFactor: srsData.ease_factor,
    interval: srsData.interval_days,
    repetitions: srsData.repetitions,
    dueDate: new Date(srsData.due_date),
    lastReviewedAt: srsData.last_reviewed_at
      ? new Date(srsData.last_reviewed_at)
      : null
  }

  const newSrs = calculateNextReview(currentSrs, rating)

  // DB更新
  const { error: updateError } = await supabase
    .from('srs_data')
    .update({
      ease_factor: newSrs.easeFactor,
      interval_days: newSrs.interval,
      repetitions: newSrs.repetitions,
      due_date: newSrs.dueDate.toISOString(),
      last_reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('entry_id', entryId)

  if (updateError) {
    return Response.json({ error: 'INTERNAL_ERROR' }, { status: 500 })
  }

  // 使用ログ記録
  await supabase.from('usage_logs').insert({
    user_id: user.id,
    action_type: 'review',
    metadata: { entry_id: entryId, rating }
  })

  return Response.json({
    data: {
      entry_id: entryId,
      previous: {
        ease_factor: currentSrs.easeFactor,
        interval_days: currentSrs.interval,
        repetitions: currentSrs.repetitions
      },
      updated: {
        ease_factor: newSrs.easeFactor,
        interval_days: newSrs.interval,
        repetitions: newSrs.repetitions,
        due_date: newSrs.dueDate.toISOString()
      }
    }
  })
}
```

### 楽観的更新（フロントエンド）

```typescript
// hooks/useReview.ts

export function useReview() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [entries, setEntries] = useState<EntryWithSrs[]>([])

  const submitRating = async (rating: Rating) => {
    const entry = entries[currentIndex]

    // 楽観的更新: 即座に次のカードへ
    setCurrentIndex(prev => prev + 1)

    // バックグラウンドでAPI呼び出し
    try {
      await fetch(`/api/review/${entry.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating })
      })
    } catch (error) {
      // エラー時はトースト表示（ロールバックしない）
      toast.error('復習の記録に失敗しました')
    }
  }

  return { currentIndex, entries, submitRating }
}
```

---

## セッション内の「Again」処理

Rating = 0 (Again) の場合、セッション内で再度表示:

```typescript
// hooks/useReviewSession.ts

export function useReviewSession(initialEntries: EntryWithSrs[]) {
  const [queue, setQueue] = useState<EntryWithSrs[]>(initialEntries)
  const [againQueue, setAgainQueue] = useState<EntryWithSrs[]>([])
  const [currentEntry, setCurrentEntry] = useState<EntryWithSrs | null>(null)

  useEffect(() => {
    // キューから次のカードを取得
    if (queue.length > 0) {
      setCurrentEntry(queue[0])
      setQueue(prev => prev.slice(1))
    } else if (againQueue.length > 0) {
      // 通常キューが空になったらAgainキューを処理
      setQueue(againQueue)
      setAgainQueue([])
    } else {
      setCurrentEntry(null) // セッション終了
    }
  }, [queue, againQueue])

  const submitRating = async (rating: Rating) => {
    if (!currentEntry) return

    if (rating === 0) {
      // Again: セッション後半で再表示
      setAgainQueue(prev => [...prev, currentEntry])
    }

    // API呼び出し（省略）
    // 次のカードへ
  }

  return { currentEntry, submitRating, remaining: queue.length + againQueue.length }
}
```

---

## 統計・分析

### 学習統計

```sql
-- 今日の復習数
SELECT COUNT(*) as reviews_today
FROM usage_logs
WHERE user_id = $1
  AND action_type = 'review'
  AND created_at >= CURRENT_DATE;

-- 連続学習日数
WITH daily_reviews AS (
  SELECT DISTINCT DATE(created_at) as review_date
  FROM usage_logs
  WHERE user_id = $1 AND action_type = 'review'
  ORDER BY review_date DESC
)
SELECT COUNT(*) as streak
FROM (
  SELECT review_date,
         review_date - INTERVAL '1 day' * ROW_NUMBER() OVER () as grp
  FROM daily_reviews
) t
WHERE grp = (SELECT MAX(grp) FROM t);

-- 難易度分布
SELECT
  (metadata->>'rating')::int as rating,
  COUNT(*) as count
FROM usage_logs
WHERE user_id = $1
  AND action_type = 'review'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY rating;
```

### ダッシュボード表示

```typescript
interface ReviewStats {
  reviewsToday: number
  streakDays: number
  totalReviews: number
  averageEaseFactor: number
  dueCount: number
  masteredCount: number // repetitions >= 5
}
```

---

## 将来の改善案

### 1. FSRS (Free Spaced Repetition Scheduler)
- より精度の高い最新アルゴリズム
- 個人の学習パターンに適応

### 2. 学習時間帯の最適化
- ユーザーの復習時間帯を学習
- 最適な時間にリマインド

### 3. 難易度自動調整
- 回答時間を考慮
- 長時間悩んだ場合は難易度上げる

### 4. 類似Entry連携
- 関連Entryを連続で出題
- 混同しやすいペアを意図的に出題

---

## 関連ドキュメント

- [04_data_model.md](./04_data_model.md) - データモデル
- [05_api_design.md](./05_api_design.md) - API設計
- [02_user_flows_web.md](./02_user_flows_web.md) - 画面フロー
