import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user stats using v_user_stats view
    const { data: stats, error: statsError } = await supabase
      .from('v_user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (statsError && statsError.code !== 'PGRST116') {
      console.error('Stats error:', statsError)
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Failed to fetch stats' },
        { status: 500 }
      )
    }

    // Get entitlements
    const { data: entitlement, error: entitlementError } = await supabase
      .from('entitlements')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (entitlementError && entitlementError.code !== 'PGRST116') {
      console.error('Entitlement error:', entitlementError)
    }

    // Get today's review count
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const { count: reviewsToday } = await supabase
      .from('srs_data')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', user.id)
      .gte('last_reviewed_at', todayISO)

    return NextResponse.json({
      data: {
        total_entries: stats?.total_entries ?? 0,
        due_entries: stats?.due_entries ?? 0,
        total_decks: stats?.total_decks ?? 0,
        reviews_today: reviewsToday ?? 0,
        streak_days: 0,
        plan: {
          type: entitlement?.plan_type ?? 'free',
          generation_used: entitlement?.monthly_generation_used ?? 0,
          generation_limit: entitlement?.monthly_generation_limit ?? 20,
          credit_balance: entitlement?.credit_balance ?? 0,
        },
      },
    })
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
