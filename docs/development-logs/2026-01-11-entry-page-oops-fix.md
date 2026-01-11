# Entry詳細ページ「Oops!」エラー修正ログ

**日付:** 2026-01-11
**実施者:** Claude Code
**対象:** TaileredDictionary2U (TD2U) Web Application

---

## 問題概要

ダッシュボードの「Recent Entries」からエントリーをクリックすると、Entry詳細ページで「Oops! Something went wrong」エラーが表示される問題が発生。

---

## 調査・修正履歴

### 第1回修正 (commit: 44a8e01)

**問題:** Next.js 14 と Next.js 15 の API 差異
- ページコンポーネントで `use(params)` を使用していたが、Next.js 14 では非対応

**修正:**
```typescript
// Before
const { id } = use(params)

// After
const params = useParams<{ id: string }>()
const id = params.id
```

**対象ファイル:**
- `app/(authenticated)/entry/[id]/page.tsx`
- `app/(authenticated)/entry/[id]/edit/page.tsx`
- `app/(authenticated)/deck/[id]/page.tsx`

---

### 第2回修正 (commit: e1a624b)

**問題:** API ルートでも Next.js 15 パターンを使用
- `params: Promise<{ id: string }>` と `await params` は Next.js 15 のパターン
- Next.js 14 では `params` は同期的にアクセス可能

**修正:**
```typescript
// Before
interface RouteParams {
  params: Promise<{ id: string }>
}
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
}

// After
interface RouteParams {
  params: { id: string }
}
export async function GET(request: NextRequest, { params }: RouteParams) {
  const { id } = params
}
```

**対象ファイル:**
- `app/api/entries/[id]/route.ts`
- `app/api/decks/[id]/route.ts`
- `app/api/review/[id]/route.ts`

---

### 第3回修正 (commit: 5d84fe9)

**問題:** `useParams()` の戻り値の型安全性
- `useParams<{ id: string }>()` の戻り値は `{ id: string | string[] } | {}`
- `params.id` は `string | string[] | undefined` になる可能性があり、ランタイムエラーの原因に

**修正:**
```typescript
// Before
const params = useParams<{ id: string }>()
const id = params.id

// After
const params = useParams<{ id: string }>()
const id = typeof params.id === 'string' ? params.id : null
```

**対象ファイル:**
- `app/(authenticated)/entry/[id]/page.tsx`
- `app/(authenticated)/entry/[id]/edit/page.tsx`
- `app/(authenticated)/deck/[id]/page.tsx`

---

### 第4回修正 (commit: 1e5b22a)

**問題:** カスタムフックのフェッチャーでエラーハンドリング不足
- `res.json()` を直接呼び出していたため、サーバーが HTML エラーページを返した場合にパースエラーが発生
- SWR がこのエラーをキャッチしても、エラーメッセージが不明確になる

**修正:**
```typescript
// Before
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = await res.json()  // HTMLだとパースエラー
    throw new Error(error.message || 'Failed to fetch entry')
  }
  const json = await res.json()
  return json.data
}

// After
const fetcher = async (url: string) => {
  const res = await fetch(url)
  const text = await res.text()  // まずテキストとして取得

  let json
  try {
    json = JSON.parse(text)  // 安全にパース
  } catch {
    throw new Error(`Failed to parse response: ${res.status}`)
  }

  if (!res.ok) {
    throw new Error(json.message || `Request failed: ${res.status}`)
  }

  return json.data
}
```

**対象ファイル:**
- `hooks/useEntry.ts`
- `hooks/useDeck.ts`

---

## 技術的知見

### Next.js 14 vs 15 の違い

| 機能 | Next.js 14 | Next.js 15 |
|------|-----------|-----------|
| ページの `params` | `useParams()` フック使用 | `use(params)` で Promise 解決 |
| API ルートの `params` | 同期的アクセス `{ params }` | Promise として `await params` |
| `cookies()` | 同期的 | 非同期 (Promise) |

### 堅牢なフェッチャーの設計

1. **レスポンスをテキストとして最初に取得** - `res.text()` を使用
2. **JSON パースを try-catch で包む** - HTML エラーページに対応
3. **ステータスコードをエラーメッセージに含める** - デバッグ容易性向上

---

## コミット履歴

| コミット | メッセージ | 日時 |
|---------|----------|------|
| 44a8e01 | fix: use useParams hook instead of use(params) for Next.js 14 | 2026-01-10 |
| e1a624b | fix: remove await from params in API routes for Next.js 14 | 2026-01-10 |
| 5d84fe9 | fix: add type safety for useParams().id in dynamic pages | 2026-01-11 |
| 1e5b22a | fix: improve fetcher error handling for robust JSON parsing | 2026-01-11 |

---

## 確認手順

1. `pnpm turbo build --filter=web` でビルド成功を確認
2. GitHub へプッシュ
3. Vercel で自動デプロイ (キャッシュクリア推奨)
4. ダッシュボードから Entry 詳細ページへ遷移テスト

---

## 解決確認

**ステータス:** 解決済み

**確認日時:** 2026-01-11

**確認内容:**
- Vercel でキャッシュクリア再デプロイ実施
- ダッシュボードの「Recent Entries」からエントリーをクリック
- Entry 詳細ページが正常に表示されることを確認

**根本原因:**
複合的な問題であったが、主な原因は以下の通り：

1. **Next.js バージョン不整合** - コードベースに Next.js 15 のパターン（`use(params)`, `await params`）が混在していた
2. **型安全性の欠如** - `useParams()` の戻り値が `undefined` になる可能性を考慮していなかった
3. **フェッチャーのエラーハンドリング** - 非 JSON レスポンスに対応していなかった

---

## 参考リンク

- [Next.js 14 Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
- [SWR Error Handling](https://swr.vercel.app/docs/error-handling)
- プラン: `~/.claude/plans/sparkling-forging-snail.md`
