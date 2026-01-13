import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthUser,
  successResponse,
  handleApiError,
  errors,
  withRateLimit,
  getClientIdentifier,
} from '@/lib/api'
import { GenerateEnrichmentRequestSchema } from '@td2u/shared-validations'
import { getOpenAIProvider, LLMError } from '@/lib/llm'
import {
  checkGenerationEntitlement,
  consumeGeneration,
} from '@/lib/billing/entitlements'
import { detectEnrichmentSpike } from '@/lib/security'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const LOG_PREFIX = '[Enrichment API]'

function log(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.log(`${LOG_PREFIX} ${message}`, payload)
    return
  }
  console.log(`${LOG_PREFIX} ${message}`)
}

function logError(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.error(`${LOG_PREFIX} ${message}`, payload)
    return
  }
  console.error(`${LOG_PREFIX} ${message}`)
}

/**
 * POST /api/enrichment
 * Generate AI enrichment for an entry
 */
export async function POST(request: NextRequest) {
  log('Request received')
  try {
    const user = await getAuthUser()
    log('Authenticated user', { user_id: user.id })

    // Rate limit check (on top of quota)
    const identifier = await getClientIdentifier(user.id)
    await withRateLimit('enrichment', identifier)

    // Abuse detection (non-blocking)
    detectEnrichmentSpike(user.id).catch(() => {
      // Ignore errors - abuse detection should not block request
    })

    const supabase = await createClient()

    // Parse and validate request
    const body = await request.json()
    const result = GenerateEnrichmentRequestSchema.safeParse(body)

    if (!result.success) {
      logError('Request validation failed', {
        issues: result.error.flatten(),
      })
      throw errors.validationError(result.error.flatten())
    }

    const { entry_id, force_regenerate } = result.data
    log('Validated payload', { entry_id, force_regenerate })

    // Fetch the entry
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entry_id)
      .eq('user_id', user.id)
      .single()

    if (entryError || !entry) {
      logError('Entry lookup failed', {
        entry_id,
        user_id: user.id,
        error: entryError,
      })
      throw errors.notFound('Entry')
    }

    log('Entry fetched', { entry_id })

    // Check if entry already has enrichment (skip if force_regenerate)
    if (entry.enrichment && !force_regenerate) {
      log('Entry already has enrichment', { entry_id })
      return successResponse({
        entry,
        message: 'Entry already has enrichment',
        generated: false,
      })
    }

    if (force_regenerate && entry.enrichment) {
      log('Force regenerating enrichment', { entry_id })
    }

    // Check generation entitlement
    const entitlementCheck = await checkGenerationEntitlement(user.id)
    log('Entitlement check result', {
      user_id: user.id,
      allowed: entitlementCheck.allowed,
      reason: entitlementCheck.reason,
    })
    if (!entitlementCheck.allowed) {
      throw errors.rateLimitExceeded(entitlementCheck.reason)
    }

    // Generate enrichment
    const provider = getOpenAIProvider()
    let enrichmentData

    try {
      log('Invoking LLM provider', {
        entry_id,
        term: entry.term,
        has_context: Boolean(entry.context),
      })
      enrichmentData = await provider.generateEnrichment({
        term: entry.term,
        context: entry.context,
      })
      log('LLM provider returned enrichment payload', { entry_id })
    } catch (error) {
      if (error instanceof LLMError) {
        logError('LLM provider error', {
          entry_id,
          code: error.code,
          retryable: error.retryable,
          message: error.message,
        })
        throw errors.internalError()
      }
      logError('Unexpected error from LLM provider', {
        entry_id,
        error,
      })
      throw error
    }

    // Consume generation quota
    await consumeGeneration(user.id)
    log('Generation quota consumed', { user_id: user.id })

    // Build full enrichment object
    const enrichment = {
      ...enrichmentData,
      generated_at: new Date().toISOString(),
      model: 'gpt-4o-mini',
    }

    // Update entry with enrichment
    log('Persisting enrichment on entry', { entry_id })
    const { data: updatedEntry, error: updateError } = await supabase
      .from('entries')
      .update({
        enrichment,
        updated_at: new Date().toISOString(),
      })
      .eq('id', entry_id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      logError('Entry update error', {
        entry_id,
        user_id: user.id,
        error: updateError,
      })
      throw errors.internalError()
    }

    log('Entry enrichment updated successfully', { entry_id })

    return successResponse({
      entry: updatedEntry,
      message: 'Enrichment generated successfully',
      generated: true,
    })
  } catch (error) {
    logError('Request failed', {
      error,
    })
    return handleApiError(error)
  }
}
