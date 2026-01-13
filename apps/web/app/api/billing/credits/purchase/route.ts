import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, handleApiError, errors } from '@/lib/api'
import { stripe, STRIPE_PRICES } from '@/lib/billing/stripe'
import { getEntitlement, updateStripeCustomerId } from '@/lib/billing/entitlements'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CreditPurchaseSchema = z.object({
  credits: z.enum(['50', '100', '250']),
})

/**
 * POST /api/billing/credits/purchase
 * Create a Stripe Checkout session for credit pack purchase
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    // Parse and validate request
    const body = await request.json()
    const result = CreditPurchaseSchema.safeParse(body)

    if (!result.success) {
      throw errors.validationError(result.error.flatten())
    }

    const { credits } = result.data

    // Map credits to price ID
    const priceIdMap: Record<string, string> = {
      '50': STRIPE_PRICES.CREDIT_50,
      '100': STRIPE_PRICES.CREDIT_100,
      '250': STRIPE_PRICES.CREDIT_250,
    }
    const priceId = priceIdMap[credits]

    if (!priceId) {
      throw errors.validationError({ fieldErrors: { credits: ['Invalid credit amount'] } })
    }

    // Get user's entitlement to check for existing Stripe customer
    const entitlement = await getEntitlement(user.id)

    // Only Plus users can purchase credits
    if (!entitlement || entitlement.plan_type !== 'plus') {
      throw errors.forbidden('Credit purchase is only available for Plus plan subscribers')
    }

    let customerId = entitlement.stripe_customer_id

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id
      await updateStripeCustomerId(user.id, customerId)
    }

    // Build URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}&type=credits`
    const cancelUrl = `${baseUrl}/checkout/cancel`

    // Create checkout session for one-time payment
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        price_id: priceId,
        credit_amount: credits,
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          price_id: priceId,
          credit_amount: credits,
        },
      },
    })

    return successResponse({
      checkout_url: session.url,
      session_id: session.id,
      credit_amount: parseInt(credits),
    })
  } catch (error) {
    return handleApiError(error)
  }
}
