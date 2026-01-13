import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, handleApiError, errors } from '@/lib/api'
import { stripe } from '@/lib/billing/stripe'
import { getEntitlement } from '@/lib/billing/entitlements'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * POST /api/billing/portal
 * Create a Stripe Customer Portal session
 */
export async function POST(_request: NextRequest) {
  try {
    const user = await getAuthUser()

    // Get user's entitlement to find Stripe customer ID
    const entitlement = await getEntitlement(user.id)

    if (!entitlement?.stripe_customer_id) {
      throw errors.validationError({ message: 'No billing account found. Please subscribe to a plan first.' })
    }

    // Build return URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/settings`

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: entitlement.stripe_customer_id,
      return_url: returnUrl,
    })

    return successResponse({
      portal_url: session.url,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
