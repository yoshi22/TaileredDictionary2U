# 06. LLM Prompt Design

## 概要

### 目的
Term（用語）と Context（文脈）から、以下のEnrichmentを生成する:
- 日本語訳
- 英語訳
- 3行要約
- 使用例（2-3件）
- 関連語（3-5語）
- 参考リンク候補（2-3件）

### 使用モデル
- **MVP**: `gpt-4o-mini`（コスト効率重視）
- **将来**: プロバイダ抽象化で切替可能（Claude, Gemini等）

### コスト見積もり
| 項目 | トークン数 | 単価 |
|------|-----------|------|
| 入力 | ~500 | $0.15/1M |
| 出力 | ~1000 | $0.60/1M |
| **1回あたり** | | **$0.001-0.003** |

---

## プロンプトテンプレート

### メインプロンプト

アプリケーションコード内 (`apps/web/lib/llm/prompts.ts`) に埋め込みテンプレートとして定義している。

```text
You are a language learning assistant that helps users understand and memorize new terms.

Given a TERM and optional CONTEXT, generate educational content in the following JSON format.

## Rules
1. If TERM is in English, provide Japanese translation. If in Japanese, provide English translation.
2. SUMMARY should be exactly 3 lines, explaining the term clearly and concisely.
3. EXAMPLES should be practical, real-world usage examples (2-3 items).
4. RELATED_TERMS should be closely related words or concepts (3-5 items).
5. REFERENCE_LINKS should suggest authoritative sources (Wikipedia, official docs, etc.). Generate plausible URLs based on the term - do NOT make up specific article titles.
6. All content should be appropriate for adult learners.
7. If CONTEXT is provided, consider it when generating content.

## Output Format (JSON)
{
  "translation_ja": "Japanese translation of the term",
  "translation_en": "English translation of the term",
  "summary": "Line 1 explaining what it is.\nLine 2 explaining why it matters.\nLine 3 explaining how it's used.",
  "examples": [
    "Example sentence 1 in English or Japanese",
    "Example sentence 2",
    "Example sentence 3"
  ],
  "related_terms": [
    "related term 1",
    "related term 2",
    "related term 3"
  ],
  "reference_links": [
    {
      "title": "Suggested resource title",
      "url": "https://example.com/relevant-page"
    }
  ]
}

---

TERM: {{term}}
{{#if context}}
CONTEXT: {{context}}
{{/if}}

Generate the JSON response:
```

### システムプロンプト

同じく `prompts.ts` で定義され、OpenAI Chat Completionsにそのまま渡す。

```
You are a precise language learning assistant. You MUST respond with valid JSON only. No markdown, no explanations, just the JSON object.
```

---

## 出力JSONスキーマ

### TypeScript型定義

```typescript
// types/enrichment.ts

export interface Enrichment {
  translation_ja: string;
  translation_en: string;
  summary: string;           // 改行区切りで3行
  examples: string[];        // 2-3件
  related_terms: string[];   // 3-5件
  reference_links: ReferenceLink[];  // 2-3件
}

export interface ReferenceLink {
  title: string;
  url: string;
}
```

### Zodスキーマ

```typescript
// lib/validations/enrichment.ts

import { z } from 'zod'

export const ReferenceLinkSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url()
})

export const EnrichmentSchema = z.object({
  translation_ja: z.string().min(1).max(500),
  translation_en: z.string().min(1).max(500),
  summary: z.string().min(1).max(1000),
  examples: z.array(z.string().min(1).max(500)).min(1).max(5),
  related_terms: z.array(z.string().min(1).max(100)).min(1).max(10),
  reference_links: z.array(ReferenceLinkSchema).min(0).max(5)
})

export type EnrichmentOutput = z.infer<typeof EnrichmentSchema>
```

### JSON Schema（OpenAI用）

```json
{
  "type": "object",
  "properties": {
    "translation_ja": {
      "type": "string",
      "description": "Japanese translation of the term"
    },
    "translation_en": {
      "type": "string",
      "description": "English translation of the term"
    },
    "summary": {
      "type": "string",
      "description": "3-line summary explaining the term"
    },
    "examples": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 2,
      "maxItems": 3,
      "description": "Usage examples"
    },
    "related_terms": {
      "type": "array",
      "items": { "type": "string" },
      "minItems": 3,
      "maxItems": 5,
      "description": "Related terms or concepts"
    },
    "reference_links": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "title": { "type": "string" },
          "url": { "type": "string", "format": "uri" }
        },
        "required": ["title", "url"]
      },
      "minItems": 1,
      "maxItems": 3,
      "description": "Suggested reference links"
    }
  },
  "required": [
    "translation_ja",
    "translation_en",
    "summary",
    "examples",
    "related_terms",
    "reference_links"
  ],
  "additionalProperties": false
}
```

---

## 実装コード

### LLMプロバイダ抽象化

```typescript
// lib/llm/types.ts

export interface LLMProvider {
  generateEnrichment(input: EnrichmentInput): Promise<Enrichment>
}

export interface EnrichmentInput {
  term: string
  context?: string
}
```

### OpenAI実装

```typescript
// lib/llm/openai.ts

import OpenAI from 'openai'
import { LLMProvider, EnrichmentInput } from './types'
import { Enrichment, EnrichmentSchema } from '@/types/enrichment'
import { readPromptTemplate } from './utils'

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
  }

  async generateEnrichment(input: EnrichmentInput): Promise<Enrichment> {
    const prompt = this.buildPrompt(input)

    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a precise language learning assistant. You MUST respond with valid JSON only. No markdown, no explanations, just the JSON object.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('Empty response from LLM')
    }

    return this.parseAndValidate(content)
  }

  private buildPrompt(input: EnrichmentInput): string {
    // テンプレートを読み込んで変数を置換
    let template = readPromptTemplate('enrichment')
    template = template.replace('{{term}}', input.term)

    if (input.context) {
      template = template.replace('{{#if context}}', '')
      template = template.replace('{{/if}}', '')
      template = template.replace('{{context}}', input.context)
    } else {
      // context部分を削除
      template = template.replace(/{{#if context}}[\s\S]*?{{\/if}}/g, '')
    }

    return template
  }

  private parseAndValidate(content: string): Enrichment {
    let parsed: unknown
    try {
      parsed = JSON.parse(content)
    } catch (e) {
      throw new Error(`Invalid JSON from LLM: ${content.substring(0, 100)}`)
    }

    const result = EnrichmentSchema.safeParse(parsed)
    if (!result.success) {
      throw new Error(`Validation failed: ${JSON.stringify(result.error.errors)}`)
    }

    return result.data
  }
}
```

### プロバイダファクトリー

```typescript
// lib/llm/index.ts

import { LLMProvider } from './types'
import { OpenAIProvider } from './openai'

export function getLLMProvider(): LLMProvider {
  const provider = process.env.LLM_PROVIDER || 'openai'

  switch (provider) {
    case 'openai':
      return new OpenAIProvider()
    // 将来追加
    // case 'anthropic':
    //   return new AnthropicProvider()
    // case 'google':
    //   return new GoogleProvider()
    default:
      throw new Error(`Unknown LLM provider: ${provider}`)
  }
}
```

### ユーティリティ

```typescript
// lib/llm/prompts.ts

export const PROMPTS = {
  system: 'You are a precise language learning assistant...'
  enrichment: 'You are a language learning assistant ...'
} as const

export type PromptName = keyof typeof PROMPTS

export function getPromptTemplate(name: PromptName): string {
  return PROMPTS[name]
}
```

---

## バリデーション

### 入力バリデーション

```typescript
// Route Handler での使用
import { GenerateEnrichmentRequestSchema } from '@td2u/shared-validations'

export async function POST(request: Request) {
  const body = await request.json()

  const inputResult = GenerateEnrichmentRequestSchema.safeParse(body)
  if (!inputResult.success) {
    return Response.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid request', details: inputResult.error },
      { status: 400 }
    )
  }

  const { entry_id, force_regenerate } = inputResult.data
  const entry = await db.entries.findById(entry_id)
  if (!entry) {
    return Response.json({ error: 'NOT_FOUND', message: 'Entry not found' }, { status: 404 })
  }

  const provider = getLLMProvider()
  const enrichment = await provider.generateEnrichment({
    term: entry.term,
    context: entry.context ?? undefined,
  })

  // ... entriesテーブルへ保存 + usage更新
  return Response.json({ data: { entry: { ...entry, enrichment }, generated: true } })
}
```

### 出力バリデーション

LLM出力は必ずZodでバリデーション（`parseAndValidate`で実施）

---

## 失敗時リトライ

### リトライ戦略

```typescript
// lib/llm/retry.ts

export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = DEFAULT_CONFIG
): Promise<T> {
  let lastError: Error | undefined
  let delay = config.initialDelayMs

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      // リトライ不可能なエラー
      if (isNonRetryableError(error)) {
        throw error
      }

      if (attempt < config.maxRetries) {
        await sleep(delay)
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs)
      }
    }
  }

  throw lastError
}

function isNonRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // バリデーションエラーはリトライしない
    if (error.message.includes('Validation failed')) {
      return true
    }
    // 認証エラーはリトライしない
    if (error.message.includes('401') || error.message.includes('403')) {
      return true
    }
  }
  return false
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

### 使用例

```typescript
// API Route Handler
export async function POST(request: Request) {
  // ... バリデーション ...

  try {
    const provider = getLLMProvider()
    const enrichment = await withRetry(() =>
      provider.generateEnrichment({ term, context })
    )

    return Response.json({ data: enrichment })
  } catch (error) {
    console.error('Enrichment generation failed:', error)

    return Response.json(
      { error: 'LLM_ERROR', message: 'AI生成に失敗しました' },
      { status: 503 }
    )
  }
}
```

---

## エラーハンドリング

### エラー分類

| エラー | 原因 | 対応 |
|--------|------|------|
| `Invalid JSON` | LLM出力が不正 | リトライ |
| `Validation failed` | 出力スキーマ不一致 | リトライ（1回のみ） |
| `Rate limit exceeded` | OpenAI制限 | 指数バックオフでリトライ |
| `401/403` | 認証エラー | 即時失敗 |
| `500` | OpenAI内部エラー | リトライ |

### ログ出力

```typescript
// 成功時
logger.info('Enrichment generated', {
  userId,
  term,
  model: 'gpt-4o-mini',
  inputTokens: response.usage?.prompt_tokens,
  outputTokens: response.usage?.completion_tokens,
  durationMs: Date.now() - startTime
})

// 失敗時
logger.error('Enrichment generation failed', {
  userId,
  term,
  error: error.message,
  attempt,
  durationMs: Date.now() - startTime
})
```

---

## プロンプト最適化

### 将来の改善案

1. **Few-shot examples**: 良い出力例をプロンプトに含める
2. **Chain of Thought**: 複雑な用語は段階的に処理
3. **コンテキスト強化**: 用語の分野（IT, ビジネス, 語学）を自動判定
4. **多言語対応**: 言語検出 → 適切な翻訳方向を選択

### A/Bテスト計画

```typescript
// プロンプトバージョン管理
const PROMPT_VERSIONS = {
  v1: 'enrichment_v1.txt',
  v2: 'enrichment_v2.txt',  // few-shot追加版
}

// ユーザーごとにランダム割り当て
function getPromptVersion(userId: string): string {
  const hash = hashCode(userId)
  return hash % 2 === 0 ? 'v1' : 'v2'
}
```

---

## セキュリティ考慮

### 入力サニタイズ

```typescript
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // 制御文字除去
    .substring(0, 500) // 最大長制限
}
```

### プロンプトインジェクション対策

1. ユーザー入力は `{{term}}` と `{{context}}` に限定
2. システムプロンプトで出力形式を厳格に指定
3. 出力をZodで厳密にバリデーション
4. 不審な出力（HTMLタグ、スクリプト等）を検出・除去

### センシティブ情報の除外

```typescript
// 入力に含まれる可能性のあるセンシティブ情報を検出
function containsSensitiveData(input: string): boolean {
  const patterns = [
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // クレジットカード
    /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/, // SSN
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // メール
  ]
  return patterns.some(p => p.test(input))
}
```

---

## ファイル配置

```
apps/web/lib/llm/
├── prompts.ts              # システム/ユーザープロンプトを埋め込み定義
├── openai.ts               # OpenAI Provider実装
├── retry.ts                # リトライ制御
└── utils.ts               # プロンプト整形/JSON抽出
```

---

## 関連ドキュメント

- [05_api_design.md](./05_api_design.md) - API設計
- [03_architecture_web.md](./03_architecture_web.md) - アーキテクチャ
- [13_testing_ops.md](./13_testing_ops.md) - テスト・運用
