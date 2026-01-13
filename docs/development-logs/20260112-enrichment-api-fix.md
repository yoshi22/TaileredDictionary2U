# Enrichment API Internal Error Investigation

**日付:** 2026-01-12  
**実施者:** Codex (GPT-5)  
**対象:** `apps/web` (Next.js 14 / TaileredDictionary2U)

---

## 背景
- Entry詳細ページの「Generate AI Content」ボタン押下時に `/api/enrichment` が 500 を返す。
- 過去にプロンプト読み込み方法や LLM メッセージ構成を変更したが解決せず。
- Vercel Serverless で稼働しており、`handleApiError()` によって実際のスタックはマスクされる。

---

## 調査メモ
1. 関連ファイル（API ルート、LLM プロバイダ、プロンプト、ユーティリティ、課金関連、Zod スキーマ）を全て精読。
2. `/api/enrichment` のフローを追跡:
   - `getAuthUser()` → `entries` 取得 → 既存 enrichment 判定 → `checkGenerationEntitlement()` → `OpenAIProvider.generateEnrichment()` → `consumeGeneration()` → `entries` 更新。
3. Supabase RLS ポリシーを確認。`entitlements` テーブルは `SELECT` のみ許可、`UPDATE` は Service Role 専用。
4. `consumeGeneration()` がユーザー権限のクライアントを使用し `UPDATE` していることを確認（RLS で拒否 → 500）。
5. 失敗箇所が特定しづらかったため、各ステップに診断ログを追加する方針とした。

---

## 主な原因
- `apps/web/lib/billing/entitlements.ts` で `createClient()`（ユーザー権限）を使って `entitlements` を更新していた。RLS で `UPDATE` が禁止されているため、Vercel 上だと常に 500 になっていた。

---

## 対応内容
- **Supabase Service Role 化:** `checkGenerationEntitlement()` / `consumeGeneration()` を `createServiceRoleClient()` に切り替え、`updated_at` も更新。処理内容をすべてログに残すよう統一。
- **API ルートの診断ログ:** `POST /api/enrichment` で認証～DB更新までの各フェーズを `console.log` / `console.error` で記録し、LLM・Supabase の失敗位置を特定しやすくした。
- **OpenAI プロバイダの計測:** プロンプト生成、API 呼び出し、レスポンス受信、JSON パース／Zod 検証結果、API エラー時の詳細をログ出力する仕組みを追加。`OPENAI_API_KEY` が未設定の場合もエラー内容を明示。
- **Quota 消費エラー検知:** 課金モジュール側で取得／更新失敗時にログを残し、例外発生箇所を明確化。
- **開発ログ作成:** 本ファイルを作成し、調査・修正内容を記録。

---

## 動作確認
- `pnpm --filter web lint`
  - 成功。既存の `no-unused-vars` Warning（DeckForm など複数ファイル）あり。今回の変更による新規 Warning は無し。

---

## 今後のフォローアップ候補
1. `apps/web/lib/api/errors.ts` や `apps/web/lib/llm/types.ts` の `no-unused-vars` Warning 解消。
2. `EnrichmentSchema` を実際の API レスポンス検証にも活用し、参照リンク URL の妥当性をサーバー側で保証する。
3. `consumeGeneration()` におけるクォータ減算を DB 関数化してレースコンディションを回避。

## 追加対応 (Edgeランタイム警告・Dynamicサーバー制御)
- Supabase を使う全ての API ルート（decks, entries, review, profile, stats, enrichment）に `export const runtime = 'nodejs'` と `export const dynamic = 'force-dynamic'` を明示して、ビルド時に Edge ランタイムへ最適化されないようにした。
- `turbo.json` に `globalEnv` を追加し、Vercel 側で設定している `OPENAI_API_KEY` と `SUPABASE_SERVICE_ROLE_KEY` が Turbo タスクでも確実に参照されるようにした。
- ESLint の `no-unused-vars` 警告（型定義内のパラメータ名やコンストラクタのプロパティ省略記法など）をすべて解消。`DeckForm` / `DeckSelect` / `DifficultyButtons` のコールバック引数名を `_` 付きに変更し、`ApiError` と `LLMError` を明示的なクラスプロパティで初期化する形へ修正。
- `pnpm --filter web lint` を再実行し、警告ゼロを確認。
