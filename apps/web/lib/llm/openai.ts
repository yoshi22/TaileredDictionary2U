import OpenAI from 'openai'
import { LLMEnrichmentResponseSchema } from '@td2u/shared-validations'
import type { LLMEnrichmentResponse } from '@td2u/shared-validations'
import type { LLMProvider, EnrichmentInput, LLMConfig } from './types'
import { LLMError } from './types'
import { buildEnrichmentPrompt, extractJSON } from './utils'
import { getPromptTemplate } from './prompts'
import { withRetry } from './retry'

const DEFAULT_CONFIG: LLMConfig = {
  model: 'gpt-4o-mini',
  maxTokens: 2000,
  temperature: 0.7,
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI
  private config: LLMConfig

  constructor(config: Partial<LLMConfig> = {}) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new LLMError('OPENAI_API_KEY is not configured', 'CONFIG_ERROR')
    }

    this.client = new OpenAI({ apiKey })
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async generateEnrichment(input: EnrichmentInput): Promise<LLMEnrichmentResponse> {
    const prompt = buildEnrichmentPrompt(input)

    const response = await withRetry(
      async () => {
        try {
          const completion = await this.client.chat.completions.create({
            model: this.config.model,
            messages: [
              {
                role: 'system',
                content: getPromptTemplate('system'),
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: this.config.maxTokens,
            temperature: this.config.temperature,
            response_format: { type: 'json_object' },
          })

          const content = completion.choices[0]?.message?.content
          if (!content) {
            throw new LLMError('Empty response from OpenAI', 'EMPTY_RESPONSE', true)
          }

          return content
        } catch (error) {
          if (error instanceof OpenAI.APIError) {
            const retryable = error.status === 429 || error.status === 500 || error.status === 503
            throw new LLMError(
              error.message,
              `OPENAI_${error.status}`,
              retryable
            )
          }
          throw error
        }
      },
      { maxRetries: 2 }
    )

    // Parse and validate response
    const jsonContent = extractJSON(response)
    let parsed: unknown

    try {
      parsed = JSON.parse(jsonContent)
    } catch {
      throw new LLMError('Invalid JSON response from OpenAI', 'PARSE_ERROR')
    }

    const result = LLMEnrichmentResponseSchema.safeParse(parsed)
    if (!result.success) {
      console.error('LLM response validation error:', result.error)
      throw new LLMError(
        'Invalid enrichment response structure',
        'VALIDATION_ERROR'
      )
    }

    return result.data
  }
}

// Singleton instance
let providerInstance: OpenAIProvider | null = null

export function getOpenAIProvider(): OpenAIProvider {
  if (!providerInstance) {
    providerInstance = new OpenAIProvider()
  }
  return providerInstance
}
