# Phase 3.3, 3.4, 3.5 実装ログ

**日付:** 2026-01-12
**実施者:** Claude Code
**対象:** TaileredDictionary2U (TD2U) Web Application

---

## 概要

Phase 3の残りタスクを実装:
1. **3.4 機能改善** - Entry検索機能、Enrichment再生成
2. **3.5 セキュリティ** - APIレート制限
3. **3.3 パフォーマンス改善** - 画像最適化、フォント最適化、SWR最適化

---

## 実装内容

### Step 1: Entry検索機能（3.4）

#### 1.1 API拡張
**更新**: `apps/web/app/api/entries/route.ts`

検索範囲を拡張:
- `term` - 用語名
- `context` - 文脈
- `enrichment->>translation_ja` - 日本語訳
- `enrichment->>translation_en` - 英語訳

```typescript
if (search) {
  const searchPattern = `%${search}%`
  query = query.or(
    `term.ilike.${searchPattern},` +
    `context.ilike.${searchPattern},` +
    `enrichment->>translation_ja.ilike.${searchPattern},` +
    `enrichment->>translation_en.ilike.${searchPattern}`
  )
}
```

#### 1.2 SearchBarコンポーネント
**新規**: `apps/web/components/entry/SearchBar.tsx`

機能:
- デバウンス処理（300ms）
- クリアボタン
- 検索アイコン

#### 1.3 useEntriesフック
**新規**: `apps/web/hooks/useEntries.ts`

- パラメータ: deckId, search, sort, order, limit, page
- SWR最適化設定付き

#### 1.4 Entries一覧ページ
**新規**: `apps/web/app/(authenticated)/entries/page.tsx`

機能:
- SearchBar統合
- Deckフィルター（ドロップダウン）
- ソート切り替え（created_at, term, due_date）
- ページネーション

#### 1.5 ナビゲーション更新
**更新**: `apps/web/components/layout/Header.tsx`

- 「Entries」リンクをナビゲーションに追加

---

### Step 2: Enrichment再生成機能（3.4）

#### 2.1 バリデーションスキーマ更新
**更新**: `packages/shared-validations/src/enrichment.ts`

```typescript
export const GenerateEnrichmentRequestSchema = z.object({
  entry_id: z.string().uuid(),
  force_regenerate: z.boolean().optional().default(false),
})
```

#### 2.2 API拡張
**更新**: `apps/web/app/api/enrichment/route.ts`

- `force_regenerate` パラメータサポート
- 既存enrichmentがあっても強制再生成可能

#### 2.3 ConfirmDialogコンポーネント
**新規**: `apps/web/components/ui/ConfirmDialog.tsx`

機能:
- モーダル表示
- ESCキーで閉じる
- ローディング状態対応
- danger/defaultバリアント

#### 2.4 EntryActions更新
**更新**: `apps/web/components/entry/EntryActions.tsx`

- 「Regenerate AI Content」ボタン追加
- 確認ダイアログ統合
- RefreshアイコンSVG追加

#### 2.5 Entryページ更新
**更新**: `apps/web/app/(authenticated)/entry/[id]/page.tsx`

- `handleGenerateEnrichment`関数が`forceRegenerate`パラメータを受け取るよう更新

---

### Step 3: レート制限実装（3.5）

#### 3.1 パッケージインストール
```bash
pnpm --filter web add @upstash/ratelimit @upstash/redis
```

#### 3.2 レート制限ユーティリティ
**新規**: `apps/web/lib/api/rate-limit.ts`

レート制限設定:
- **api**: 100リクエスト/分（一般API）
- **entryCreate**: 50リクエスト/時間
- **enrichment**: 10リクエスト/分
- **deckCreate**: 20リクエスト/時間
- **checkout**: 5リクエスト/時間
- **auth**: 5リクエスト/15分

機能:
- Upstash未設定時はスキップ（開発環境対応）
- ユーザーID または IPベースの識別
- エラー時の再試行時間表示

#### 3.3 APIルートへの適用
**更新対象**:
- `apps/web/app/api/entries/route.ts` - POST
- `apps/web/app/api/enrichment/route.ts` - POST
- `apps/web/app/api/decks/route.ts` - POST
- `apps/web/app/api/billing/checkout/route.ts` - POST

---

### Step 4: パフォーマンス改善（3.3）

#### 4.1 画像最適化
**更新**: `apps/web/next.config.js`

```javascript
images: {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  imageSizes: [16, 32, 48, 64, 96, 128, 256],
},
experimental: {
  optimizePackageImports: ['@sentry/nextjs'],
},
```

#### 4.2 フォント最適化
**更新**: `apps/web/app/layout.tsx`

```typescript
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})
```

#### 4.3 SWR最適化
**更新対象**:
- `apps/web/hooks/useDecks.ts`
- `apps/web/hooks/useStats.ts`
- `apps/web/hooks/useDueEntries.ts`
- `apps/web/hooks/useEntries.ts`

設定:
```typescript
{
  revalidateOnFocus: false,
  dedupingInterval: 5000-10000,
}
```

---

## ファイル構成

```
apps/web/
├── app/
│   ├── (authenticated)/
│   │   ├── entries/
│   │   │   └── page.tsx            # 新規: 検索付き一覧
│   │   └── entry/[id]/page.tsx     # 更新: forceRegenerate
│   ├── api/
│   │   ├── entries/route.ts        # 更新: 拡張検索 + レート制限
│   │   ├── enrichment/route.ts     # 更新: force_regenerate + レート制限
│   │   ├── decks/route.ts          # 更新: レート制限
│   │   └── billing/checkout/route.ts # 更新: レート制限
│   └── layout.tsx                  # 更新: フォント最適化
├── components/
│   ├── entry/
│   │   ├── SearchBar.tsx           # 新規
│   │   └── EntryActions.tsx        # 更新: Regenerateボタン
│   ├── layout/
│   │   └── Header.tsx              # 更新: Entriesリンク
│   └── ui/
│       ├── ConfirmDialog.tsx       # 新規
│       └── index.ts                # 更新: export追加
├── hooks/
│   ├── useEntries.ts               # 新規
│   ├── useDecks.ts                 # 更新: SWR最適化
│   ├── useStats.ts                 # 更新: SWR最適化
│   └── useDueEntries.ts            # 更新: SWR最適化
├── lib/
│   └── api/
│       ├── rate-limit.ts           # 新規
│       └── index.ts                # 更新: export追加
├── next.config.js                  # 更新: 画像最適化
└── .env.example                    # 更新: Upstash環境変数追加

packages/shared-validations/
└── src/
    └── enrichment.ts               # 更新: force_regenerate
```

---

## 環境変数追加

`.env.example` に追加:
```
# Upstash Redis (Rate Limiting) - Optional for local development
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxx
```

---

## 次のステップ（本番運用前）

### Upstash設定
1. https://console.upstash.com でRedisデータベース作成
2. REST URLとトークンを環境変数に設定
3. Vercel環境変数にも追加

### 残りのタスク
- [ ] LCP計測・改善（Lighthouse実測後）
- [ ] インポート/エクスポート (CSV)
- [ ] Apple OAuth 設定
- [ ] 入力サニタイズ（追加対策）
- [ ] 不正利用検知

---

## 技術的ノート

### レート制限の設計思想
- ローカル開発時はUpstash未設定でもスキップ（開発体験優先）
- ユーザーIDがある場合はユーザーベース、なければIPベース
- 残り少なくなったら警告ログ出力

### SWR最適化の根拠
- `revalidateOnFocus: false` - タブ切り替えでの不要な再取得防止
- `dedupingInterval: 5000-10000` - 短時間での重複リクエスト防止

### 検索機能の実装
- Supabaseの`or`メソッドで複数カラム横断検索
- JSONB内のフィールドは`->>`演算子でテキストとして検索

---

## 参考

- Upstash Ratelimit: https://github.com/upstash/ratelimit
- Next.js Image Optimization: https://nextjs.org/docs/app/building-your-application/optimizing/images
- SWR Options: https://swr.vercel.app/docs/api#options
