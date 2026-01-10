# Phase 0: 本番デプロイ手順ガイド

**対象:** TaileredDictionary2U (TD2U) Web Application
**前提:** Phase 1 Web MVP実装完了済み

---

## 進捗状況

| Step | 項目 | ステータス |
|------|------|-----------|
| 1 | Supabaseプロジェクト作成 | ✅ 完了 |
| 2 | マイグレーション適用 | ✅ 完了 |
| 3.1 | Email/Password認証 | ✅ 完了 |
| 3.2 | Google OAuth（任意） | ⏭️ スキップ |
| 4 | Vercelプロジェクト作成 | ✅ 完了 |
| 5 | Vercel環境変数設定 | ⏳ 未完了 |
| 6 | デプロイ確認 | ⏳ 未完了 |

**最終更新:** 2025-01-10

---

## 概要

本ドキュメントでは、TD2Uを本番環境にデプロイするための手順を説明します。

### 必要なサービス
- **Supabase**: データベース、認証、RLS
- **Vercel**: Next.jsホスティング
- **OpenAI**: AI Enrichment生成

---

## Step 1: Supabaseプロジェクト作成

### 1.1 プロジェクト作成

1. https://supabase.com にログイン
2. 「New project」をクリック
3. 以下を設定:
   - **Project name:** `td2u-production`
   - **Database Password:** 強力なパスワードを生成・安全に保存
   - **Region:** `Northeast Asia (Tokyo)`
4. 「Create new project」をクリック

### 1.2 API情報取得

プロジェクト作成完了後:

1. **Settings** > **API** に移動
2. 以下の値をコピーして保存:

| キー | 説明 |
|-----|------|
| `Project URL` | `NEXT_PUBLIC_SUPABASE_URL` として使用 |
| `anon public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` として使用 |
| `service_role` | `SUPABASE_SERVICE_ROLE_KEY` として使用（秘密鍵） |

> **重要:** `service_role` キーは絶対に公開しないでください。サーバーサイドでのみ使用します。

---

## Step 2: マイグレーション適用

### 2.1 Supabase CLIログイン

```bash
supabase login
```

ブラウザが開き、認証を求められます。

### 2.2 プロジェクトリンク

```bash
cd /path/to/TaileredDictionary2U

# project-ref はダッシュボードURLから取得
# 例: https://supabase.com/dashboard/project/abcdefghijklmnop
#     → project-ref = abcdefghijklmnop
supabase link --project-ref <your-project-ref>
```

### 2.3 マイグレーション適用

```bash
supabase db push
```

以下のテーブルが作成されます:
- `profiles` - ユーザープロフィール
- `entitlements` - 使用量制限・プラン情報
- `decks` - 単語帳デッキ
- `entries` - 単語エントリー
- `srs_data` - SRS学習データ
- `usage_logs` - 使用ログ
- `credit_transactions` - クレジット取引履歴

---

## Step 3: Supabase Auth設定

### 3.1 Email/Password認証

1. Supabase Dashboard > **Authentication** > **Providers**
2. **Email** プロバイダーを有効化
3. 設定:
   - **Enable Email provider:** ON
   - **Confirm email:** OFF（開発初期、後で有効化推奨）
   - **Secure email change:** ON

### 3.2 Google OAuth（任意）

#### Google Cloud Console設定

1. https://console.cloud.google.com にアクセス
2. プロジェクトを選択（または新規作成）
3. **APIs & Services** > **Credentials**
4. 「Create Credentials」 > 「OAuth client ID」
5. Application type: **Web application**
6. 設定:
   - **Name:** `TD2U Production`
   - **Authorized redirect URIs:**
     ```
     https://<your-project-ref>.supabase.co/auth/v1/callback
     ```
7. 「Create」をクリック
8. **Client ID** と **Client Secret** をコピー

#### Supabase設定

1. Supabase Dashboard > **Authentication** > **Providers**
2. **Google** を有効化
3. 以下を入力:
   - **Client ID:** Google Cloud Consoleからコピーした値
   - **Client Secret:** Google Cloud Consoleからコピーした値
4. 「Save」をクリック

---

## Step 4: Vercelプロジェクト作成

### 4.1 プロジェクトインポート

1. https://vercel.com にログイン
2. 「Add New...」 > 「Project」
3. GitHubリポジトリ `TaileredDictionary2U` を選択
4. 「Import」をクリック

### 4.2 ビルド設定

| 設定項目 | 値 |
|---------|-----|
| **Framework Preset** | Next.js |
| **Root Directory** | `apps/web` |
| **Build Command** | `pnpm build` |
| **Output Directory** | `.next` (デフォルト) |
| **Install Command** | `pnpm install` |

### 4.3 デプロイ

「Deploy」をクリックして初回デプロイを開始。

> **注意:** 環境変数が未設定の場合、ビルドは成功しますが実行時にエラーが発生します。
> 次のステップで環境変数を設定してください。

---

## Step 5: Vercel環境変数設定

### 5.1 環境変数追加

Vercel Dashboard > プロジェクト > **Settings** > **Environment Variables**

以下の変数を追加:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Production, Preview, Development |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key | Production, Preview, Development |
| `OPENAI_API_KEY` | OpenAI APIキー | Production, Preview, Development |

### 5.2 OpenAI APIキー取得

1. https://platform.openai.com にログイン
2. **API Keys** > 「Create new secret key」
3. キーをコピーして環境変数に設定

> **注意:** OpenAI APIは従量課金です。使用量に注意してください。

---

## Step 6: デプロイ確認

### 6.1 再デプロイ

環境変数設定後、再デプロイが必要です:

1. Vercel Dashboard > **Deployments**
2. 最新のデプロイを選択
3. 「Redeploy」をクリック

### 6.2 動作確認チェックリスト

| 確認項目 | URL | 期待結果 |
|---------|-----|---------|
| ランディングページ | `/` | Hero、Features、Pricing表示 |
| ログイン画面 | `/login` | ログインフォーム表示 |
| サインアップ画面 | `/signup` | サインアップフォーム表示 |
| 認証リダイレクト | `/dashboard` | 未認証時 → `/login` へリダイレクト |

### 6.3 機能テスト

1. **サインアップ**
   - Email/Passwordでアカウント作成
   - ダッシュボードにリダイレクト

2. **Entry作成**
   - 新規Entry作成
   - AI Enrichment生成確認

3. **復習**
   - Due entriesが表示される
   - 難易度ボタンで回答可能

---

## トラブルシューティング

### ビルドエラー

```
Module not found: Can't resolve '@td2u/shared-xxx'
```

**解決策:** Turborepoの依存関係を確認
```bash
pnpm install
pnpm build
```

### 認証エラー

```
AuthSessionMissingError: Auth session missing!
```

**解決策:**
1. Supabase Auth設定を確認
2. 環境変数 `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を確認

### AI生成エラー

```
OpenAI API error: 401 Unauthorized
```

**解決策:**
1. `OPENAI_API_KEY` が正しく設定されているか確認
2. OpenAIアカウントのクレジット残高を確認

---

## 本番運用の注意点

### セキュリティ

- [ ] `service_role` キーは絶対に公開しない
- [ ] RLSポリシーが正しく動作していることを確認
- [ ] 定期的にAPIキーをローテーション

### 監視

- [ ] Vercel Analytics を有効化
- [ ] Supabase Dashboard で使用量を監視
- [ ] OpenAI Dashboard でAPI使用量を監視

### バックアップ

- [ ] Supabase の定期バックアップを確認
- [ ] Point-in-time recovery の設定

---

## 関連ドキュメント

- [API設計](./05_api_design.md)
- [アーキテクチャ](./03_architecture_web.md)
- [データモデル](./04_data_model.md)
- [開発ログ](./development-logs/)
