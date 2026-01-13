# CSV Import/Export 実装ログ

**日付:** 2026-01-12
**実施者:** Claude Code
**対象:** TaileredDictionary2U (TD2U) Web Application

---

## 概要

TODO.mdに記載されていた「インポート/エクスポート (CSV)」機能を実装。
手動操作（外部サービス設定等）なしで完結する純粋なコード実装。

**主要機能:**
1. **CSV Export** - エントリーをCSVファイルとしてダウンロード
2. **CSV Import** - CSVファイルからエントリーを一括登録

---

## 実装内容

### Phase 1: CSVユーティリティ基盤

#### 1.1 型定義
**新規**: `apps/web/lib/csv/types.ts`

```typescript
// CSV行の型
interface CsvRow {
  term: string
  context?: string | null
  deck_id?: string | null
}

// インポート結果
interface CsvImportResult {
  total: number
  imported: number
  skipped: number
  failed: number
  errors: CsvRowError[]
}

// 定数
const CSV_MAX_FILE_SIZE = 5 * 1024 * 1024  // 5MB
const CSV_MAX_ROWS = 500
const CSV_ARRAY_DELIMITER = '|'
```

#### 1.2 CSVパーサー
**新規**: `apps/web/lib/csv/parser.ts`

機能:
- BOM (Byte Order Mark) 対応
- 引用符内のカンマ・改行対応
- エスケープされた引用符 (`""`) 対応
- 行番号付きエラーレポート
- ヘッダー行バリデーション

```typescript
export function parseCSV(content: string): CsvParseResult {
  // BOM除去 → 行分割 → ヘッダー検証 → 行バリデーション
}
```

#### 1.3 CSVフォーマッター
**新規**: `apps/web/lib/csv/formatter.ts`

機能:
- エントリーをCSV形式に変換
- 特殊文字のエスケープ（カンマ、引用符、改行）
- 配列フィールドの結合（`|`区切り）
- BOM付きUTF-8でExcel互換

エクスポートカラム:
```csv
term,context,deck_name,translation_ja,translation_en,summary,examples,related_terms
```

---

### Phase 2: バリデーションスキーマ

**新規**: `packages/shared-validations/src/csv.ts`

```typescript
export const CsvRowSchema = z.object({
  term: z.string().min(1).max(200),
  context: z.string().max(500).optional().nullable(),
  deck_id: z.string().uuid().optional().nullable(),
})

export const CsvImportOptionsSchema = z.object({
  deck_id: z.string().uuid().optional().nullable(),
  skip_duplicates: z.coerce.boolean().default(false),
})

export const CsvExportQuerySchema = z.object({
  deck_id: z.string().uuid().optional(),
})
```

---

### Phase 3: Export機能

#### 3.1 Export APIエンドポイント
**新規**: `apps/web/app/api/entries/export/route.ts`

```typescript
// GET /api/entries/export?deck_id=xxx
export async function GET(request: NextRequest) {
  // 1. 認証チェック
  // 2. Rate Limit (csvExport: 10回/時間)
  // 3. deck_id検証（オプション）
  // 4. 全エントリー取得（SRS/Deck結合）
  // 5. CSV形式に変換
  // 6. BOM付きでレスポンス
}
```

レスポンスヘッダー:
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="td2u-entries-2026-01-12.csv"`

#### 3.2 ExportButtonコンポーネント
**新規**: `apps/web/components/entry/ExportButton.tsx`

機能:
- クリックでCSVダウンロード
- ローディング状態表示
- エラーハンドリング
- デッキ指定対応

```tsx
<ExportButton deckId={deckId} deckName="Deck Name" variant="secondary" />
```

---

### Phase 4: Import機能

#### 4.1 Rate Limiter追加
**更新**: `apps/web/lib/api/rate-limit.ts`

```typescript
csvImport: new Ratelimit({
  limiter: Ratelimit.fixedWindow(3, '1 h'),  // 3回/時間
  prefix: 'ratelimit:csv_import',
})

csvExport: new Ratelimit({
  limiter: Ratelimit.slidingWindow(10, '1 h'),  // 10回/時間
  prefix: 'ratelimit:csv_export',
})
```

#### 4.2 Import APIエンドポイント
**新規**: `apps/web/app/api/entries/import/route.ts`

```typescript
// POST /api/entries/import (multipart/form-data)
export async function POST(request: NextRequest) {
  // 1. 認証チェック
  // 2. Rate Limit (csvImport: 3回/時間)
  // 3. ファイルバリデーション（サイズ、形式）
  // 4. CSVパース・行バリデーション
  // 5. 重複チェック（skip_duplicates時）
  // 6. deck_id所有権検証
  // 7. バッチ挿入（50件ずつ）
  // 8. SRSデータ初期化
  // 9. 結果レポート返却
}
```

リクエスト:
- `file`: CSVファイル（必須）
- `deck_id`: UUID（任意、全エントリーに適用）
- `skip_duplicates`: boolean（任意）

レスポンス:
```json
{
  "data": {
    "total": 100,
    "imported": 95,
    "skipped": 3,
    "failed": 2,
    "errors": [
      { "row": 5, "term": "apple", "message": "Term is required" }
    ]
  }
}
```

#### 4.3 ImportModalコンポーネント
**新規**: `apps/web/components/entry/ImportModal.tsx`

機能:
- ドラッグ&ドロップ対応
- ファイル選択ダイアログ
- デッキ選択（任意）
- 重複スキップオプション
- インポート結果表示
- エラー詳細展開
- テンプレートCSVダウンロード

---

### Phase 5: UI統合

#### 5.1 Entriesページ
**更新**: `apps/web/app/(authenticated)/entries/page.tsx`

変更内容:
- Import/Exportボタンをヘッダーに追加
- ImportModal統合
- デッキフィルター連動Export

```tsx
<div className="flex items-center gap-2">
  <Button onClick={() => setIsImportModalOpen(true)}>Import</Button>
  <ExportButton deckId={deckId} variant="secondary" />
  <Link href="/entry/new"><Button>New Entry</Button></Link>
</div>
```

#### 5.2 Deck詳細ページ
**更新**: `apps/web/app/(authenticated)/deck/[id]/page.tsx`

変更内容:
- デッキ専用Import/Exportボタン追加
- ImportModal統合（デッキIDプリセット）

```tsx
<div className="flex flex-wrap gap-2">
  <Button>Add Entry</Button>
  <Button>Review</Button>
  <Button onClick={() => setIsImportModalOpen(true)}>Import</Button>
  <ExportButton deckId={id} deckName={deck.name} />
</div>
```

#### 5.3 コンポーネントエクスポート
**更新**: `apps/web/components/entry/index.ts`

```typescript
export { ExportButton } from './ExportButton'
export { ImportModal } from './ImportModal'
export { SearchBar } from './SearchBar'
```

---

## ファイル構成

```
apps/web/
├── app/
│   ├── (authenticated)/
│   │   ├── entries/page.tsx          # 更新: Import/Export統合
│   │   └── deck/[id]/page.tsx        # 更新: Import/Export統合
│   └── api/
│       └── entries/
│           ├── export/
│           │   └── route.ts          # 新規: GET
│           └── import/
│               └── route.ts          # 新規: POST
├── components/
│   └── entry/
│       ├── ExportButton.tsx          # 新規
│       ├── ImportModal.tsx           # 新規
│       └── index.ts                  # 更新: export追加
└── lib/
    ├── api/
    │   └── rate-limit.ts             # 更新: csvImport/Export追加
    └── csv/
        ├── types.ts                  # 新規
        ├── parser.ts                 # 新規
        ├── formatter.ts              # 新規
        └── index.ts                  # 新規

packages/shared-validations/
└── src/
    ├── csv.ts                        # 新規
    └── index.ts                      # 更新: export追加
```

---

## 技術的ノート

### CSVパーサーの設計

RFC 4180準拠を意識した実装:
- 引用符内のカンマは文字として扱う
- 引用符内の改行は文字として扱う
- 引用符のエスケープは `""` (ダブルクォート2つ)
- BOM (0xFEFF) は自動除去

```typescript
// 引用符内の処理例
'"Hello, World"'  → 'Hello, World'
'"Say ""Hi"""'    → 'Say "Hi"'
'"Line1\nLine2"'  → 'Line1\nLine2'
```

### バッチ挿入の根拠

```typescript
const BATCH_SIZE = 50
```

- Supabaseの1リクエストあたりの制限を考慮
- タイムアウト防止（Vercel Edge: 30秒）
- メモリ使用量の制御

### Rate Limitの設計思想

| 操作 | 制限 | 根拠 |
|------|------|------|
| Export | 10回/時間 | 読み取り専用、負荷低 |
| Import | 3回/時間 | 書き込み、DB負荷高 |

---

## セキュリティ考慮

1. **ファイルサイズ制限**: 5MB
2. **行数制限**: 500行
3. **deck_id所有権検証**: 他ユーザーのデッキ指定不可
4. **Rate Limiting**: 悪用防止
5. **入力バリデーション**: Zodスキーマで厳密検証

---

## 品質確認

### ESLint
```bash
pnpm lint
# 結果: 警告のみ（既存のunused変数）、エラーなし
```

### TypeScript
```bash
pnpm type-check
# 結果: 既存のテスト設定エラーのみ、新規コードにエラーなし
```

---

## 使用方法

### Export

1. `/entries` ページで「Export CSV」ボタンをクリック
2. デッキフィルター適用時は、フィルターされたエントリーのみExport
3. `/deck/[id]` ページでは、そのデッキのエントリーのみExport

### Import

1. `/entries` または `/deck/[id]` で「Import」ボタンをクリック
2. CSVファイルをドラッグ&ドロップ、または選択
3. デッキ割り当て（任意）を選択
4. 「Skip duplicate terms」をチェック（任意）
5. 「Import」をクリック
6. 結果確認、エラーがあれば詳細表示

### CSVフォーマット

**Import用**:
```csv
term,context,deck_id
"vocabulary","example context",""
"another word","",""
```

**Export出力**:
```csv
term,context,deck_name,translation_ja,translation_en,summary,examples,related_terms
"vocabulary","example context","My Deck","語彙","vocabulary","A word or phrase...","example1|example2","related1|related2"
```

---

## TODO.md更新

```markdown
### 3.4 機能改善 ✅ 主要完了
- [x] インポート/エクスポート (CSV) - 2026-01-12完了
  - GET /api/entries/export (CSVエクスポート、デッキフィルター対応)
  - POST /api/entries/import (CSVインポート、重複スキップオプション)
  - ExportButton, ImportModal コンポーネント
  - Rate Limiting: csvExport 10/時間, csvImport 3/時間
```

---

## 参考

- RFC 4180 (CSV Format): https://datatracker.ietf.org/doc/html/rfc4180
- Upstash Ratelimit: https://github.com/upstash/ratelimit
- Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers
