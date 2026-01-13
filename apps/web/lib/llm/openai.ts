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

const LLM_LOG_PREFIX = '[LLM:OpenAI]'

function logLLM(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.log(`${LLM_LOG_PREFIX} ${message}`, payload)
    return
  }
  console.log(`${LLM_LOG_PREFIX} ${message}`)
}

function logLLMError(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.error(`${LLM_LOG_PREFIX} ${message}`, payload)
    return
  }
  console.error(`${LLM_LOG_PREFIX} ${message}`)
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI
  private config: LLMConfig

  constructor(config: Partial<LLMConfig> = {}) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      logLLMError('Missing OPENAI_API_KEY environment variable')
      throw new LLMError('OPENAI_API_KEY is not configured', 'CONFIG_ERROR')
    }

    this.client = new OpenAI({ apiKey })
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  async generateEnrichment(input: EnrichmentInput): Promise<LLMEnrichmentResponse> {
    logLLM('Starting enrichment generation', {
      model: this.config.model,
      term: input.term,
      hasContext: Boolean(input.context),
    })
    const prompt = buildEnrichmentPrompt(input)
    logLLM('Prompt prepared', {
      promptLength: prompt.length,
      termLength: input.term.length,
      contextLength: input.context ? input.context.length : 0,
    })

    const response = await withRetry(
      async () => {
        try {
          logLLM('Calling OpenAI chat completion', {
            model: this.config.model,
            maxTokens: this.config.maxTokens,
          })
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
          logLLM('OpenAI responded', {
            model: completion.model,
            finishReason: completion.choices[0]?.finish_reason,
            promptTokens: completion.usage?.prompt_tokens,
            completionTokens: completion.usage?.completion_tokens,
          })

          const content = completion.choices[0]?.message?.content
          if (!content) {
            logLLMError('OpenAI response did not include content')
            throw new LLMError('Empty response from OpenAI', 'EMPTY_RESPONSE', true)
          }

          return content
        } catch (error) {
          if (error instanceof OpenAI.APIError) {
            logLLMError('OpenAI API error', {
              status: error.status,
              type: error.type,
              code: error.code,
              message: error.message,
            })
            const retryable = error.status === 429 || error.status === 500 || error.status === 503
            throw new LLMError(
              error.message,
              `OPENAI_${error.status}`,
              retryable
            )
          }
          logLLMError('Unexpected error invoking OpenAI', { error })
          throw error
        }
      },
      { maxRetries: 2 }
    )

    logLLM('Received raw response from OpenAI', {
      length: response.length,
    })

    // Parse and validate response
    const jsonContent = extractJSON(response)
    let parsed: unknown

    try {
      parsed = JSON.parse(jsonContent)
      logLLM('Parsed JSON successfully')
    } catch (parseError) {
      logLLMError('Invalid JSON response from OpenAI', {
        snippet: jsonContent.slice(0, 200),
        error: parseError,
      })
      throw new LLMError('Invalid JSON response from OpenAI', 'PARSE_ERROR')
    }

    const result = LLMEnrichmentResponseSchema.safeParse(parsed)
    if (!result.success) {
      logLLMError('LLM response validation error', {
        issues: result.error.flatten(),
      })
      throw new LLMError(
        'Invalid enrichment response structure',
        'VALIDATION_ERROR'
      )
    }

    logLLM('LLM response validated successfully', {
      examples: result.data.examples.length,
      relatedTerms: result.data.related_terms.length,
      referenceLinks: result.data.reference_links.length,
    })

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
