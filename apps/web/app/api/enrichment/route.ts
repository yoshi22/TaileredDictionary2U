import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAuthUser,
  successResponse,
  handleApiError,
  errors,
} from '@/lib/api'
import { GenerateEnrichmentRequestSchema } from '@td2u/shared-validations'
import { getOpenAIProvider, LLMError } from '@/lib/llm'
import {
  checkGenerationEntitlement,
  consumeGeneration,
} from '@/lib/billing/entitlements'

/**
 * POST /api/enrichment
 * Generate AI enrichment for an entry
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()

    // Parse and validate request
    const body = await request.json()
    const result = GenerateEnrichmentRequestSchema.safeParse(body)

    if (!result.success) {
      throw errors.validationError(result.error.flatten())
    }

    const { entry_id } = result.data

    // Fetch the entry
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .select('*')
      .eq('id', entry_id)
      .eq('user_id', user.id)
      .single()

    if (entryError || !entry) {
      throw errors.notFound('Entry')
    }

    // Check if entry already has enrichment
    if (entry.enrichment) {
      return successResponse({
        entry,
        message: 'Entry already has enrichment',
        generated: false,
      })
    }

    // Check generation entitlement
    const entitlementCheck = await checkGenerationEntitlement(user.id)
    if (!entitlementCheck.allowed) {
      throw errors.rateLimitExceeded(entitlementCheck.reason)
    }

    // Generate enrichment
    const provider = getOpenAIProvider()
    let enrichmentData

    try {
      enrichmentData = await provider.generateEnrichment({
        term: entry.term,
        context: entry.context,
      })
    } catch (error) {
      if (error instanceof LLMError) {
        console.error('LLM Error:', error)
        throw errors.internalError()
      }
      throw error
    }

    // Consume generation quota
    await consumeGeneration(user.id)

    // Build full enrichment object
    const enrichment = {
      ...enrichmentData,
      generated_at: new Date().toISOString(),
      model: 'gpt-4o-mini',
    }

    // Update entry with enrichment
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
      console.error('Entry update error:', updateError)
      throw errors.internalError()
    }

    return successResponse({
      entry: updatedEntry,
      message: 'Enrichment generated successfully',
      generated: true,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
