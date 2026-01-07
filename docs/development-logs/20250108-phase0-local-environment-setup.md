# 20250108 - Phase 0: ローカル開発環境セットアップ

## 概要

TD2UプロジェクトのPhase 0残り項目として、Supabase CLIを使用したローカル開発環境を構築した。
これにより、クラウド環境（本番Supabase/Vercel）なしでPhase 1の開発を開始できる状態になった。

## 前提条件

- Phase 0基盤構築完了済み（84ファイル、GitHubにpush済み）
- Docker Desktop インストール済み（v28.1.1）
- マイグレーションファイル10個作成済み

## 実施内容

### 1. Supabase CLIインストール

```bash
brew install supabase/tap/supabase
```

- バージョン: 2.67.1
- zsh補完もインストール済み

### 2. ローカルSupabase起動

```bash
supabase start
```

初回起動時にDockerイメージをダウンロード（約5分）。以下のサービスが起動：

| サービス | ポート | 説明 |
|---------|--------|------|
| PostgreSQL | 54322 | データベース |
| Kong (API Gateway) | 54321 | Supabase API |
| GoTrue | - | 認証サービス |
| PostgREST | - | REST API |
| Realtime | - | リアルタイム通信 |
| Storage | - | ファイルストレージ |
| Studio | 54323 | 管理UI |
| Mailpit | 54324 | メールテスト |

### 3. 環境変数ファイル作成

**ファイル**: `apps/web/.env.local`

```bash
# Supabase（ローカル）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI（ダミー値 - 後で設定）
OPENAI_API_KEY=sk-dummy-key-for-development

# Stripe（Phase 2で設定）
STRIPE_SECRET_KEY=sk_test_dummy
...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**注意**: `.env.local`は`.gitignore`に含まれており、コミットされない。

### 4. マイグレーション適用

```bash
supabase db reset
```

**適用されたマイグレーション**:
1. `20250107000001_create_profiles.sql`
2. `20250107000002_create_entitlements.sql`
3. `20250107000003_create_decks.sql`
4. `20250107000004_create_entries.sql`
5. `20250107000005_create_srs_data.sql`
6. `20250107000006_create_usage_logs.sql`
7. `20250107000007_create_credit_transactions.sql`
8. `20250107000008_create_triggers.sql`
9. `20250107000009_create_rls_policies.sql`
10. `20250107000010_create_views.sql`

### 5. DB構造確認

**テーブル（7個）**:
```
 Schema |        Name         | Type
--------+---------------------+-------
 public | credit_transactions | table
 public | decks               | table
 public | entitlements        | table
 public | entries             | table
 public | profiles            | table
 public | srs_data            | table
 public | usage_logs          | table
```

**ビュー（3個）**:
```
 Schema |        Name        | Type
--------+--------------------+------
 public | v_due_entries      | view
 public | v_entries_with_srs | view
 public | v_user_stats       | view
```

### 6. 動作確認

```bash
pnpm dev:web
```

- Next.js開発サーバー起動（http://localhost:3000）
- HTTP 200レスポンス確認
- TD2Uランディングページ表示確認

## ローカル開発コマンド

### 日常の開発フロー

```bash
# 1. ローカルSupabase起動
supabase start

# 2. Next.js開発サーバー起動
pnpm dev:web

# 3. ブラウザで確認
open http://localhost:3000        # アプリ
open http://127.0.0.1:54323       # Supabase Studio
open http://127.0.0.1:54324       # Mailpit（メール確認）
```

### Supabase操作

```bash
# ステータス確認
supabase status

# DBリセット（マイグレーション再適用）
supabase db reset

# マイグレーション差分確認
supabase db diff

# ログ確認
supabase logs

# 停止
supabase stop
```

## GitHubコミット

```
b0b672a chore: Phase 0 ローカル開発環境セットアップ完了
```

**変更ファイル**:
- `TODO.md` - ローカル環境セットアップ項目追加
- `docs/development-logs/20250107-phase0-environment-setup.md` - ローカル環境セットアップセクション追記

## 本番環境への移行（後日）

ローカル開発が完了したら、以下の手順で本番環境をセットアップ：

1. **Supabaseプロジェクト作成**
   ```bash
   # Supabaseダッシュボードで新規プロジェクト作成
   # https://supabase.com/dashboard
   ```

2. **プロジェクトリンク**
   ```bash
   supabase link --project-ref <PROJECT_REF>
   ```

3. **マイグレーション適用**
   ```bash
   supabase db push
   ```

4. **Vercel連携**
   ```bash
   vercel link
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   # ... その他の環境変数
   ```

## 次のステップ（Phase 1）

ローカル環境が整ったので、Phase 1の開発を開始：

1. **認証画面**
   - `/login` - ログインページ
   - `/signup` - 新規登録ページ
   - Supabase Auth連携

2. **ダッシュボード**
   - `/dashboard` - メイン画面
   - 統計カード
   - クイックアクション

3. **Entry CRUD**
   - `/entry/new` - 新規登録
   - `/entry/[id]` - 詳細・編集
   - Server Actions実装

## 技術情報

| 項目 | 値 |
|------|-----|
| Supabase CLI | 2.67.1 |
| Docker | 28.1.1 |
| PostgreSQL (local) | 15.x |
| Next.js | 14.2.35 |
| Node.js | 20.x |

---

*作成日: 2025-01-08*
*作成者: Claude Code*
