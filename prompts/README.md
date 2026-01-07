# Prompts Directory

このディレクトリには、LLM呼び出しに使用するプロンプトテンプレートを配置します。

## ファイル一覧

| ファイル | 用途 |
|---------|------|
| `enrichment.txt` | Entry Enrichment生成用メインプロンプト |
| `system.txt` | OpenAI APIのsystem messageに使用 |

## 使用方法

```typescript
// lib/llm/utils.ts
import fs from 'fs'
import path from 'path'

export function readPromptTemplate(name: string): string {
  const filePath = path.join(process.cwd(), 'prompts', `${name}.txt`)
  return fs.readFileSync(filePath, 'utf-8')
}

// 使用例
const promptTemplate = readPromptTemplate('enrichment')
const systemPrompt = readPromptTemplate('system')
```

## テンプレート変数

`enrichment.txt` では以下の変数を使用:

| 変数 | 説明 | 必須 |
|------|------|------|
| `{{term}}` | 学習対象の用語 | Yes |
| `{{context}}` | 用語の使用文脈 | No |

### 条件付き表示

```
{{#if context}}
CONTEXT: {{context}}
{{/if}}
```

context が存在する場合のみ表示されます。

## A/Bテスト

新しいプロンプトバージョンをテストする場合:

1. `enrichment_v2.txt` など新しいファイルを作成
2. コードでバージョン切り替えロジックを実装
3. 結果を比較

## 注意事項

- プロンプトの変更は出力品質に直接影響します
- 本番環境で変更する前にテスト環境で十分に検証してください
- センシティブな情報（APIキー等）を含めないでください
