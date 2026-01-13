import type { LLMEnrichmentResponse } from '@td2u/shared-validations'

export interface EnrichmentInput {
  term: string
  context?: string | null
}

export interface LLMProvider {
  generateEnrichment(_input: EnrichmentInput): Promise<LLMEnrichmentResponse>
}

export interface LLMConfig {
  model: string
  maxTokens: number
  temperature: number
}

export interface LLMResponse {
  content: string
  model: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class LLMError extends Error {
  public code: string
  public retryable: boolean

  constructor(message: string, code: string, retryable = false) {
    super(message)
    this.name = 'LLMError'
    this.code = code
    this.retryable = retryable
  }
}
