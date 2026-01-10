import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAuthUser, successResponse, handleApiError, errors } from '@/lib/api'

/**
 * GET /api/profile
 * Get user profile with entitlement
 */
export async function GET() {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()

    // Get profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // If profile doesn't exist, create one
      if (profileError.code === 'PGRST116') {
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email!,
          })
          .select()
          .single()

        if (createError) {
          throw errors.internalError()
        }

        return successResponse(newProfile)
      }
      throw errors.internalError()
    }

    // Get entitlement
    const { data: entitlement } = await supabase
      .from('entitlements')
      .select('*')
      .eq('user_id', user.id)
      .single()

    return successResponse({
      ...profile,
      entitlement,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * PATCH /api/profile
 * Update user profile
 */
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser()
    const supabase = await createClient()

    const body = await request.json()
    const { display_name } = body

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        display_name,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Profile update error:', error)
      throw errors.internalError()
    }

    return successResponse(profile)
  } catch (error) {
    return handleApiError(error)
  }
}
