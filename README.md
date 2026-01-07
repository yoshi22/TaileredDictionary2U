# TaileredDictionary2U (TD2U)

> 知らない言葉に出会ったら、登録するだけ。あとはAIとSRSにおまかせ。

個人向け単語帳 + SRS（間隔反復学習）アプリケーション。

## 概要

TD2Uは、新しい用語・フレーズ・文を登録すると、AIが自動で「日英訳 + 3行要約 + 使用例 + 関連語 + 参考リンク候補」を生成し、SRS（Spaced Repetition System）で最適なタイミングでの復習をサポートする学習アプリです。

### 主な用途
- 業界キャッチアップ（新しい分野の専門用語学習）
- 新環境オンボーディング（会社・プロジェクト固有の用語習得）
- 語学学習（英単語・フレーズの効率的暗記）

## 技術スタック

### Web (MVP)
- **フロントエンド**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **バックエンド/DB/認証**: Supabase (PostgreSQL + Auth + RLS)
- **API**: Next.js Route Handlers
- **AI**: OpenAI GPT-4o-mini
- **決済**: Stripe

### Mobile (将来)
- **フレームワーク**: React Native + Expo
- **課金**: RevenueCat (IAP / Play Billing)

## セットアップ

### 必要条件

- Node.js 20+
- pnpm 8+
- Supabase アカウント
- OpenAI API キー
- Stripe アカウント (課金機能用)

### 環境構築

```bash
# リポジトリクローン
git clone https://github.com/yourname/td2u.git
cd td2u

# 依存関係インストール
pnpm install

# 環境変数設定
cp apps/web/.env.example apps/web/.env.local
```

### 環境変数 (.env.local)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-xxxxx

# Stripe
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase セットアップ

```bash
# Supabase CLI インストール
npm install -g supabase

# ログイン
supabase login

# プロジェクトリンク
supabase link --project-ref your-project-ref

# マイグレーション実行
supabase db push

# (オプション) シードデータ投入
supabase db seed
```

### ローカル起動

```bash
# 開発サーバー起動
pnpm dev:web

# http://localhost:3000 でアクセス
```

## 開発コマンド

```bash
# 開発サーバー
pnpm dev:web

# ビルド
pnpm build

# リント
pnpm lint

# 型チェック
pnpm type-check

# テスト
pnpm test

# E2Eテスト
pnpm test:e2e
```

## プロジェクト構成

```
td2u/
├── apps/
│   ├── web/                # Next.js Web アプリ
│   └── mobile/             # Expo モバイルアプリ（将来）
├── packages/
│   ├── shared-types/       # TypeScript 型定義
│   ├── shared-utils/       # 共通ユーティリティ
│   ├── shared-srs/         # SRS計算ロジック
│   └── shared-validations/ # Zodスキーマ
├── docs/                   # 設計ドキュメント
├── prompts/                # LLMプロンプトテンプレート
└── supabase/               # DBマイグレーション
```

詳細は [docs/14_repo_structure.md](./docs/14_repo_structure.md) を参照。

## デプロイ

### Vercel (推奨)

1. Vercelにリポジトリを接続
2. 環境変数を設定
3. `apps/web` をルートディレクトリに設定
4. 自動デプロイ

### Stripe Webhook

本番環境では以下のエンドポイントにWebhookを設定:
```
https://your-domain.com/api/webhooks/stripe
```

必要なイベント:
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [00_overview.md](./docs/00_overview.md) | プロジェクト概要 |
| [01_prd.md](./docs/01_prd.md) | プロダクト要求仕様 |
| [02_user_flows_web.md](./docs/02_user_flows_web.md) | Web画面フロー |
| [03_architecture_web.md](./docs/03_architecture_web.md) | アーキテクチャ |
| [04_data_model.md](./docs/04_data_model.md) | データモデル |
| [05_api_design.md](./docs/05_api_design.md) | API設計 |
| [06_llm_prompt_design.md](./docs/06_llm_prompt_design.md) | LLMプロンプト設計 |
| [07_srs_design.md](./docs/07_srs_design.md) | SRSアルゴリズム |
| [08_billing_entitlements.md](./docs/08_billing_entitlements.md) | 課金・権利管理 |
| [09_business_model_unit_economics.md](./docs/09_business_model_unit_economics.md) | ビジネスモデル |
| [10_metrics_growth.md](./docs/10_metrics_growth.md) | メトリクス・グロース |
| [11_roadmap.md](./docs/11_roadmap.md) | ロードマップ |
| [12_mobile_plan.md](./docs/12_mobile_plan.md) | モバイル展開計画 |
| [13_testing_ops.md](./docs/13_testing_ops.md) | テスト・運用 |
| [14_repo_structure.md](./docs/14_repo_structure.md) | リポジトリ構成 |

## 主な機能

### MVP (Phase 1)
- ユーザー認証 (Email / Google OAuth)
- Entry登録 + AI Enrichment生成
- SRS復習 (SM-2ベース)
- Deck管理
- 使用量制限 (Free: 月20回)

### 課金 (Phase 2)
- Plusプラン (月$4.99, 200回/月)
- クレジット購入 (Plus専用)

### 将来 (Phase 3+)
- モバイルアプリ (iOS / Android)
- OCR登録
- Push通知
- インポート/エクスポート

## ライセンス

Private - All rights reserved

## サポート

- GitHub Issues: バグ報告・機能要望
- Email: support@td2u.app (将来)
