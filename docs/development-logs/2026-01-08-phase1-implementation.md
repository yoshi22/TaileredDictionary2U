# Phase 1 Web MVP 実装ログ

**日付:** 2026-01-08
**実施者:** Claude Code
**対象:** TaileredDictionary2U (TD2U) Web Application

---

## 概要

Phase 1 Web MVPの全12 PRを一括実装。認証からSRS復習まで、コア機能を網羅的に実装した。

---

## 実装内容

### PR1: 基盤レイアウト・共通コンポーネント

**追加パッケージ:**
- `clsx` - クラス名結合ユーティリティ
- `tailwind-merge` - Tailwindクラス競合解決

**作成ファイル:**
```
lib/utils.ts                    # cn() ユーティリティ
components/ui/
├── Button.tsx                  # ボタン (primary/secondary/ghost/danger variants)
├── Input.tsx                   # フォーム入力
├── Textarea.tsx                # テキストエリア
├── Card.tsx                    # カードコンテナ
├── Spinner.tsx                 # ローディングスピナー
├── Skeleton.tsx                # スケルトンローダー
└── index.ts                    # エクスポート
components/layout/
├── Header.tsx                  # ナビゲーションヘッダー
├── HeaderWrapper.tsx           # クライアントラッパー (signOut処理)
├── Footer.tsx                  # フッター
└── index.ts
app/(public)/layout.tsx         # 公開ページレイアウト
app/(authenticated)/layout.tsx  # 認証済みページレイアウト
hooks/useUser.ts                # ユーザー情報取得フック
```

### PR2: 認証画面

**作成ファイル:**
```
lib/auth/actions.ts             # Server Actions (signIn, signUp, signOut)
components/auth/
├── LoginForm.tsx
├── SignupForm.tsx
├── OAuthButtons.tsx
└── index.ts
app/(public)/login/page.tsx
app/(public)/signup/page.tsx
app/auth/callback/route.ts      # OAuth コールバック
```

**技術的決定:**
- Server ActionsでSupabase Auth操作
- OAuth (Google) サポート
- HeaderWrapperでClient ComponentとしてsignOut処理

### PR3: ランディングページ

**作成ファイル:**
```
components/landing/
├── Hero.tsx
├── Features.tsx
├── HowItWorks.tsx
├── Pricing.tsx
├── CTA.tsx
└── index.ts
app/(public)/page.tsx           # ランディングページ
```

### PR4: ダッシュボード + Stats API

**作成ファイル:**
```
app/api/stats/route.ts          # GET /api/stats
components/dashboard/
├── StatsCards.tsx              # 統計カード (entries, due, decks, reviews)
├── QuickActions.tsx            # クイックアクション
├── RecentEntries.tsx           # 最近のエントリー
├── UsageCard.tsx               # 使用量カード
└── index.ts
hooks/useStats.ts               # SWR統計データフック
app/(authenticated)/dashboard/page.tsx
```

### PR5: Entry CRUD API

**作成ファイル:**
```
lib/api/
├── errors.ts                   # ApiError クラス、エラーファクトリ
├── response.ts                 # successResponse, paginatedResponse等
├── auth.ts                     # getAuthUser()
└── index.ts
app/api/entries/route.ts        # GET (list), POST (create)
app/api/entries/[id]/route.ts   # GET, PATCH, DELETE
```

**APIエンドポイント:**
- `GET /api/entries?deck_id=&search=&limit=&offset=&sort=&order=`
- `POST /api/entries`
- `GET/PATCH/DELETE /api/entries/[id]`

**技術的詳細:**
- Supabase JOINでsrs_data, decksを含めて取得
- Zodスキーマ (`@td2u/shared-validations`) でバリデーション
- EntryWithSrs型でSRSデータを統合

### PR6: Entry作成画面

**作成ファイル:**
```
components/entry/
├── DeckSelect.tsx
├── EntryForm.tsx
└── index.ts
hooks/useDecks.ts               # デッキ一覧取得
hooks/useCreateEntry.ts         # エントリー作成
app/(authenticated)/entry/new/page.tsx
app/api/decks/route.ts          # GET, POST (基本実装)
```

### PR7: LLM統合 + Enrichment API

**作成ファイル:**
```
lib/llm/
├── types.ts                    # LLMProvider interface, LLMError
├── openai.ts                   # OpenAI実装
├── utils.ts                    # プロンプト読み込み、JSON抽出
├── retry.ts                    # エクスポネンシャルバックオフ
└── index.ts
lib/billing/
└── entitlements.ts             # checkGenerationEntitlement, consumeGeneration
app/api/enrichment/route.ts     # POST /api/enrichment
```

**技術的詳細:**
- OpenAI GPT-4o-mini使用
- `prompts/enrichment.txt`からプロンプトテンプレート読み込み
- `LLMEnrichmentResponseSchema`でレスポンス検証
- リトライロジック (max 2回、エクスポネンシャルバックオフ)
- 月間クォータ → クレジット消費の優先順位

### PR8: Entry詳細・編集画面

**作成ファイル:**
```
components/entry/
├── EntryCard.tsx               # エントリーカード (リスト用)
├── EnrichmentPreview.tsx       # AI生成コンテンツ表示
├── SrsStatus.tsx               # SRS状態表示
├── EntryActions.tsx            # アクションボタン
└── EditEntryForm.tsx           # 編集フォーム
hooks/useEntry.ts               # 単一エントリー取得
app/(authenticated)/entry/[id]/page.tsx
app/(authenticated)/entry/[id]/edit/page.tsx
```

### PR9: SRS復習

**作成ファイル:**
```
app/api/review/due/route.ts     # GET /api/review/due
app/api/review/[id]/route.ts    # POST /api/review/[id]
components/review/
├── ReviewCard.tsx              # 復習カード (問題/回答表示)
├── DifficultyButtons.tsx       # 難易度ボタン (Again/Hard/Good/Easy)
├── SessionProgress.tsx         # 進捗バー
├── SessionSummary.tsx          # セッション完了サマリー
└── index.ts
hooks/useDueEntries.ts          # due entries取得
hooks/useReviewSession.ts       # 復習セッション管理
app/(authenticated)/review/page.tsx
```

**SRS計算:**
- `@td2u/shared-srs` の `SrsCalculator` 使用
- SM-2アルゴリズムベース
- rating 0-3 → ease_factor, interval_days, repetitions更新

### PR10: Deck管理

**作成ファイル:**
```
app/api/decks/[id]/route.ts     # GET, PATCH, DELETE
components/deck/
├── DeckCard.tsx
├── DeckList.tsx
├── DeckForm.tsx
├── CreateDeckModal.tsx
└── index.ts
hooks/useDeck.ts                # 単一デッキ取得
app/(authenticated)/decks/page.tsx
app/(authenticated)/deck/[id]/page.tsx
```

### PR11: 設定画面

**作成ファイル:**
```
app/api/profile/route.ts        # GET, PATCH
components/settings/
├── ProfileSection.tsx          # プロフィール編集
├── UsageSection.tsx            # 使用量表示
├── PlanSection.tsx             # プラン情報
├── DangerZone.tsx              # サインアウト、アカウント削除
└── index.ts
hooks/useProfile.ts             # プロフィール + entitlement取得
app/(authenticated)/settings/page.tsx
```

### PR12: エラーハンドリング・レスポンシブ

**作成ファイル:**
```
app/error.tsx                   # エラー境界
app/not-found.tsx               # 404ページ
app/loading.tsx                 # ローディング状態
components/ui/Skeleton.tsx      # スケルトンローダー
```

---

## ファイル構成 (最終)

```
apps/web/
├── app/
│   ├── (authenticated)/
│   │   ├── dashboard/page.tsx
│   │   ├── entry/
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/
│   │   │       ├── page.tsx
│   │   │       └── edit/page.tsx
│   │   ├── review/page.tsx
│   │   ├── decks/page.tsx
│   │   ├── deck/[id]/page.tsx
│   │   ├── settings/page.tsx
│   │   └── layout.tsx
│   ├── (public)/
│   │   ├── page.tsx            # ランディング
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx
│   ├── api/
│   │   ├── stats/route.ts
│   │   ├── entries/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── decks/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   ├── enrichment/route.ts
│   │   ├── review/
│   │   │   ├── due/route.ts
│   │   │   └── [id]/route.ts
│   │   └── profile/route.ts
│   ├── auth/callback/route.ts
│   ├── error.tsx
│   ├── not-found.tsx
│   └── loading.tsx
├── components/
│   ├── ui/
│   ├── layout/
│   ├── auth/
│   ├── landing/
│   ├── dashboard/
│   ├── entry/
│   ├── review/
│   ├── deck/
│   └── settings/
├── hooks/
│   ├── useUser.ts
│   ├── useStats.ts
│   ├── useDecks.ts
│   ├── useDeck.ts
│   ├── useEntry.ts
│   ├── useCreateEntry.ts
│   ├── useDueEntries.ts
│   ├── useReviewSession.ts
│   └── useProfile.ts
└── lib/
    ├── utils.ts
    ├── api/
    ├── auth/
    ├── llm/
    ├── billing/
    └── supabase/
```

---

## 技術的決定事項

### 1. UIライブラリ
- **採用:** Tailwind CSS のみ
- **理由:** ユーザー要望、依存関係の最小化
- **追加:** `clsx` + `tailwind-merge` で className管理

### 2. データフェッチング
- **SWR** を全面採用
- カスタムフックでデータ取得ロジックをカプセル化
- `mutate()` で楽観的更新対応

### 3. フォームバリデーション
- **Zod** (`@td2u/shared-validations`)
- サーバー側で `safeParse()` 使用
- クライアント側は手動バリデーション (react-hook-form未使用)

### 4. 認証フロー
- Supabase SSR (`@supabase/ssr`)
- Server Actions でauth操作
- ミドルウェアで認証ガード

### 5. LLM統合
- Provider抽象化 (`LLMProvider` interface)
- OpenAI GPT-4o-mini 実装
- リトライ + エラーハンドリング

### 6. SRS計算
- `@td2u/shared-srs` の `SrsCalculator` 使用
- SM-2アルゴリズム準拠

---

## 解決した課題

### Server Action → Client Component 問題
- **問題:** `(authenticated)/layout.tsx` でServer ActionをHeaderに渡せない
- **解決:** `HeaderWrapper` Client Componentを作成、Supabase clientで直接signOut

### Supabase JOIN型推論
- **問題:** JOINしたテーブルが配列として推論される
- **解決:** `Array.isArray()` チェックで [0] アクセス

---

## 残作業・注意事項

### 必須設定
1. **環境変数** (`.env.local`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

2. **Supabase設定**
   - マイグレーション適用: `supabase db push`
   - Auth Providers設定 (Email, Google OAuth)

3. **prompts/enrichment.txt** が存在すること

### 未実装・改善余地
- Toast通知システム (現在はalert使用)
- モバイルナビゲーション (ハンバーガーメニュー)
- アカウント削除API (`/api/account` DELETE)
- Stripe統合 (プラン変更、クレジット購入)
- E2Eテスト

---

## 動作確認

```bash
# 型チェック
pnpm type-check  # ✅ Pass

# リント
pnpm lint        # ✅ Pass (false positive警告のみ)

# 開発サーバー
pnpm dev:web
```

---

## 参考資料

- 計画ファイル: `~/.claude/plans/composed-tumbling-abelson.md`
- API設計: `docs/05_api_design.md`
- SRS仕様: `packages/shared-srs/src/calculator.ts`
- プロンプト: `prompts/enrichment.txt`
