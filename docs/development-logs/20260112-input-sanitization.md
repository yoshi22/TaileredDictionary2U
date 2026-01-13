# 入力サニタイズ機能 実装ログ

**日付:** 2026-01-12
**実施者:** Claude Code
**対象:** TaileredDictionary2U (TD2U) Web Application

---

## 概要

TODO.md の「入力サニタイズ（追加対策）」タスクを実装:
1. **サニタイズユーティリティ** - 制御文字除去、Unicode正規化、URL検証
2. **Zodスキーマ強化** - Entry/Deck作成・更新スキーマにサニタイズtransform追加
3. **URL安全性検証** - EnrichmentPreviewのリンクをjavascript:等から保護

---

## セキュリティ課題と対策

### 課題1: URLスキームインジェクション（高リスク）

**問題**: `EnrichmentPreview.tsx`で `href={link.url}` に直接AI生成URLを使用
- `javascript:alert(1)` などの悪意あるURLが実行される可能性
- AI（プロンプトインジェクション経由）が危険なURLを生成する可能性

**対策**: `getSafeUrl()` 関数で http/https のみ許可

### 課題2: 制御文字混入（中リスク）

**問題**: 入力フィールドに制御文字（`\x00`-`\x1F`）が混入可能
- データベース・UI表示での問題
- 潜在的なセキュリティ脆弱性

**対策**: `stripControlChars()` で制御文字を除去（タブ・改行は保持）

### 課題3: Unicode正規化不整合（低リスク）

**問題**: 同じ文字が異なるUnicodeエンコーディングで入力される可能性
- 検索・比較での不整合
- ホモグラフ攻撃の可能性

**対策**: `normalizeUnicode()` でNFC正規化

---

## 実装内容

### Step 1: サニタイズユーティリティ作成

**新規**: `packages/shared-validations/src/sanitize.ts`

```typescript
// 制御文字除去（タブ・改行は保持）
export function stripControlChars(str: string): string {
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// Unicode NFC正規化
export function normalizeUnicode(str: string): string {
  return str.normalize('NFC');
}

// テキストサニタイズ（trim + 制御文字除去 + Unicode正規化）
export function sanitizeText(str: string): string {
  return normalizeUnicode(stripControlChars(str.trim()));
}

// 安全なURLか検証（http/https のみ許可）
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// 安全なURLを返す（無効な場合はnull）
export function getSafeUrl(url: string): string | null {
  // 危険なプロトコルの早期拒否
  const lowerUrl = url.toLowerCase().trim();
  const dangerous = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:', 'blob:'];
  if (dangerous.some(p => lowerUrl.startsWith(p))) return null;

  return isValidUrl(url) ? url : null;
}

// オプショナルテキスト用サニタイズ
export function sanitizeOptionalText(
  str: string | null | undefined
): string | null | undefined {
  if (str === null || str === undefined) return str;
  return sanitizeText(str);
}
```

### Step 2: 単体テスト作成

**新規**: `packages/shared-validations/src/__tests__/sanitize.test.ts`

テストケース（50テスト）:
- `stripControlChars`: null文字、制御文字の除去、タブ・改行の保持
- `normalizeUnicode`: NFC正規化
- `sanitizeText`: 複合サニタイズ
- `isValidUrl`: http/https許可、危険プロトコル拒否
- `getSafeUrl`: 大文字小文字混合のjavascript:対応、null/undefined処理

### Step 3: Zodスキーマ強化

**更新**: `packages/shared-validations/src/entry.ts`

```typescript
import { sanitizeText, sanitizeOptionalText } from './sanitize';

export const CreateEntrySchema = z.object({
  term: z.string()
    .transform(sanitizeText)  // サニタイズ後に検証
    .pipe(z.string().min(1).max(200)),
  context: z.string()
    .optional().nullable()
    .transform(sanitizeOptionalText)
    .pipe(z.string().max(500).optional().nullable()),
  deck_id: z.string().uuid().optional().nullable(),
});
```

**更新**: `packages/shared-validations/src/deck.ts`

同様に `name`, `description` フィールドにサニタイズ追加

### Step 4: URL安全性検証

**更新**: `apps/web/components/entry/EnrichmentPreview.tsx`

```typescript
import { getSafeUrl } from '@td2u/shared-validations';

// References セクション
{referenceLinks.map((link, index) => {
  const safeUrl = getSafeUrl(link.url);
  if (!safeUrl) return null;  // 危険なURLはスキップ

  return (
    <li key={index}>
      <a href={safeUrl} target="_blank" rel="noopener noreferrer">
        {link.title}
      </a>
    </li>
  );
})}
```

### Step 5: エクスポート追加

**更新**: `packages/shared-validations/src/index.ts`

```typescript
export * from './sanitize';
```

---

## ファイル構成

```
packages/shared-validations/
├── src/
│   ├── sanitize.ts              # 新規: サニタイズユーティリティ
│   ├── entry.ts                 # 更新: サニタイズtransform追加
│   ├── deck.ts                  # 更新: サニタイズtransform追加
│   ├── index.ts                 # 更新: sanitizeエクスポート追加
│   └── __tests__/
│       └── sanitize.test.ts     # 新規: 50テスト

apps/web/
├── components/
│   └── entry/
│       └── EnrichmentPreview.tsx  # 更新: URL安全性検証
```

---

## テスト結果

```
✓ src/__tests__/sanitize.test.ts (50 tests) 6ms
✓ src/__tests__/review.test.ts (23 tests) 6ms
✓ src/__tests__/deck.test.ts (16 tests) 8ms
✓ src/__tests__/enrichment.test.ts (19 tests) 8ms
✓ src/__tests__/entry.test.ts (20 tests) 9ms

Test Files  5 passed (5)
     Tests  128 passed (128)
```

---

## 技術的ノート

### Zod transform + pipe パターン

サニタイズ後に検証を行うため、`transform` と `pipe` を組み合わせ:

```typescript
z.string()
  .transform(sanitizeText)  // 1. まずサニタイズ
  .pipe(                    // 2. サニタイズ結果を検証
    z.string().min(1).max(200)
  )
```

これにより:
- `"  hello  "` → trim → `"hello"` → 検証パス
- `"  "` → trim → `""` → min(1)で検証失敗

### 危険なURLプロトコル

拒否対象:
- `javascript:` - XSS攻撃
- `data:` - コンテンツインジェクション
- `vbscript:` - IE向け攻撃
- `file:` - ローカルファイルアクセス
- `about:` - ブラウザ内部
- `blob:` - 動的コンテンツ

### Reactの自動エスケープ

ReactはJSXのテキストコンテンツを自動エスケープするため、HTMLインジェクションのリスクは低い。
ただし `href` 属性は例外であり、今回の対策が必要だった。

---

## 残りのセキュリティタスク

- [ ] 不正利用検知（異常パターン検知、Sentryアラート）
- [ ] 監査ログ強化（usage_logsへの詳細記録）

---

## 参考

- OWASP XSS Prevention: https://owasp.org/www-community/xss-filter-evasion-cheatsheet
- Unicode Normalization: https://unicode.org/reports/tr15/
- Zod Transforms: https://zod.dev/?id=transform
