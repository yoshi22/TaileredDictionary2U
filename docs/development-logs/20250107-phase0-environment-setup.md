# 20250107 - Phase 0: 環境構築・基盤

## 概要

TD2U (TaileredDictionary2U) プロジェクトのPhase 0として、Turborepoモノレポ環境を構築し、基盤コードを実装した。

## 実施内容

### 1. ルート設定ファイル

| ファイル | 説明 |
|---------|------|
| `package.json` | ルートpackage.json（Turborepoスクリプト） |
| `pnpm-workspace.yaml` | pnpmワークスペース設定 |
| `turbo.json` | Turborepoパイプライン設定 |
| `.gitignore` | Git除外設定 |
| `.env.example` | 環境変数テンプレート |
| `.nvmrc` | Node.js 20指定 |

### 2. 共有パッケージ (packages/)

#### packages/shared-types/
TypeScript型定義パッケージ。

- `entry.ts` - Entry, Enrichment, UsageLog型
- `srs.ts` - SrsData, SrsRating型
- `entitlement.ts` - Entitlement, CreditTransaction, PlanType型
- `deck.ts` - Deck型
- `profile.ts` - Profile型

#### packages/shared-utils/
ユーティリティ関数パッケージ。

- `date.ts` - 日付操作（formatDate, formatRelativeDate, addDays等）
- `format.ts` - フォーマット（truncate, formatNumber等）

#### packages/shared-srs/
SM-2アルゴリズム実装パッケージ。

- `calculator.ts` - SrsCalculator クラス
  - 4段階評価（Again, Hard, Good, Easy）
  - ease_factor, interval_days, repetitions計算
  - 初期状態生成
- `calculator.test.ts` - 13テストケース（全パス）

```typescript
// SM-2アルゴリズムの主要ロジック
calculate(input: SrsInput): SrsCalculationResult {
  // Rating 0 (Again): リセット
  // Rating 1 (Hard): interval * 1.2
  // Rating 2 (Good): interval * easeFactor
  // Rating 3 (Easy): interval * easeFactor * 1.3
}
```

#### packages/shared-validations/
Zodバリデーションスキーマパッケージ。

- `entry.ts` - CreateEntrySchema, UpdateEntrySchema
- `deck.ts` - CreateDeckSchema, UpdateDeckSchema
- `enrichment.ts` - EnrichmentSchema
- `review.ts` - SubmitReviewSchema

### 3. Webアプリケーション (apps/web/)

Next.js 14 App Router + TypeScript + Tailwind CSS構成。

#### 設定ファイル
- `next.config.js` - Turborepo向け設定
- `tsconfig.json` - strict mode、パスエイリアス
- `tailwind.config.js` - テーマ設定
- `.eslintrc.json` - ESLint設定

#### Supabaseクライアント
- `lib/supabase/client.ts` - ブラウザ用クライアント
- `lib/supabase/server.ts` - サーバー用クライアント（SSR対応）

#### 認証ミドルウェア
- `middleware.ts` - 保護ルートのリダイレクト処理

```typescript
const protectedPaths = ['/dashboard', '/entry', '/review', '/decks', '/deck', '/settings'];
if (isProtectedPath && !user) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

### 4. Supabaseマイグレーション (supabase/migrations/)

10個のマイグレーションファイルを作成。

| 番号 | ファイル | 内容 |
|------|---------|------|
| 01 | create_profiles | ユーザープロファイル |
| 02 | create_entitlements | 使用量制限・クレジット |
| 03 | create_decks | Deck管理 |
| 04 | create_entries | 単語登録（JSONB enrichment） |
| 05 | create_srs_data | SRS状態管理 |
| 06 | create_usage_logs | 使用ログ |
| 07 | create_credit_transactions | クレジット取引履歴 |
| 08 | create_triggers | 自動作成トリガー |
| 09 | create_rls_policies | Row Level Security |
| 10 | create_views | 便利ビュー |

#### 主要トリガー
- `on_auth_user_created`: ユーザー作成時にprofiles, entitlements, default deck自動作成
- `on_entry_created`: エントリー作成時にsrs_data自動作成

### 5. Vercel設定

```json
{
  "buildCommand": "pnpm turbo build --filter=web",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs"
}
```

### 6. GitHub連携

- リポジトリ: https://github.com/yoshi22/TaileredDictionary2U
- 初回コミット: 84ファイル、15,570行

## 検証結果

| 項目 | 結果 |
|------|------|
| `pnpm install` | ✅ 成功 |
| `pnpm build` | ✅ 成功（全パッケージ） |
| `pnpm test` | ✅ 成功（SM-2: 13テストパス） |
| `pnpm lint` | ✅ 成功 |
| TypeScript strict mode | ✅ エラーなし |
| GitHub push | ✅ 成功 |

## 修正した問題

### 1. ESLint設定エラー
**問題**: `@typescript-eslint/no-unused-vars` ルールが見つからない

**解決**: `.eslintrc.json`で`no-unused-vars`に変更
```json
{
  "rules": {
    "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }]
  }
}
```

### 2. Webテスト失敗
**問題**: テストファイルなしでvitest終了コード1

**解決**: `--passWithNoTests`フラグ追加
```json
{
  "scripts": {
    "test": "vitest run --passWithNoTests"
  }
}
```

## 作成ファイル一覧（84ファイル）

```
.
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
├── vercel.json
├── apps/web/
│   ├── .env.example
│   ├── .eslintrc.json
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── middleware.ts
│   ├── next.config.js
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── tsconfig.json
├── packages/
│   ├── shared-srs/
│   │   ├── src/calculator.ts
│   │   ├── src/calculator.test.ts
│   │   └── src/index.ts
│   ├── shared-types/
│   │   ├── src/deck.ts
│   │   ├── src/entitlement.ts
│   │   ├── src/entry.ts
│   │   ├── src/profile.ts
│   │   └── src/srs.ts
│   ├── shared-utils/
│   │   ├── src/date.ts
│   │   └── src/format.ts
│   └── shared-validations/
│       ├── src/deck.ts
│       ├── src/enrichment.ts
│       ├── src/entry.ts
│       └── src/review.ts
└── supabase/
    ├── config.toml
    ├── migrations/ (10ファイル)
    └── seed.sql
```

## ローカル開発環境セットアップ（追記）

### Supabase CLIインストール
```bash
brew install supabase/tap/supabase
# バージョン: 2.67.1
```

### ローカル環境起動
```bash
supabase start
# → PostgreSQL, Auth, Studio, Mailpit等が起動
```

### 起動後の情報
| サービス | URL |
|---------|-----|
| Project URL | http://127.0.0.1:54321 |
| Studio | http://127.0.0.1:54323 |
| Database | postgresql://postgres:postgres@127.0.0.1:54322/postgres |
| Mailpit | http://127.0.0.1:54324 |

### 環境変数設定
`apps/web/.env.local` を作成し、ローカルSupabaseのキーを設定。

### マイグレーション適用
```bash
supabase db reset
# → 10マイグレーションすべて適用
```

### 作成されたテーブル
- profiles, entitlements, decks, entries, srs_data, usage_logs, credit_transactions

### 作成されたビュー
- v_entries_with_srs, v_due_entries, v_user_stats

---

## 次のステップ (Phase 1)

1. **認証フロー実装**
   - Supabase Auth連携
   - ログイン/サインアップページ
   - セッション管理

2. **基本CRUD API**
   - Server Actions実装
   - Entry作成・取得・更新・削除
   - Deck管理

3. **ダッシュボード**
   - 統計表示
   - Due entries一覧
   - クイックアクション

## 技術スタック確認

- **Node.js**: 20.x
- **pnpm**: 9.15.2
- **Next.js**: 14.2.21
- **TypeScript**: 5.3.3
- **Tailwind CSS**: 3.4.17
- **Supabase**: @supabase/supabase-js 2.47.10, @supabase/ssr 0.5.2
- **Zod**: 3.23.8
- **Vitest**: 2.1.8

---

*作成日: 2025-01-07*
*作成者: Claude Code*
