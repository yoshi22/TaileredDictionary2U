import { NextRequest } from 'next/server'
import { getAuthUser, successResponse, handleApiError, errors, withRateLimit, getClientIdentifier } from '@/lib/api'
import { stripe, isPlusPlanPriceId, isCreditPackPriceId } from '@/lib/billing/stripe'
import { getEntitlement, updateStripeCustomerId } from '@/lib/billing/entitlements'
import { z } from 'zod'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CheckoutRequestSchema = z.object({
  price_id: z.string().min(1, 'Price ID is required'),
})

/**
 * POST /api/billing/checkout
 * Create a Stripe Checkout session for subscription or one-time purchase
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser()

    // Rate limit check - strict limit for checkout
    const identifier = await getClientIdentifier(user.id)
    await withRateLimit('checkout', identifier)

    // Parse and validate request
    const body = await request.json()
    const result = CheckoutRequestSchema.safeParse(body)

    if (!result.success) {
      throw errors.validationError(result.error.flatten())
    }

    const { price_id } = result.data

    // Validate price_id is one of our known prices
    if (!isPlusPlanPriceId(price_id) && !isCreditPackPriceId(price_id)) {
      throw errors.validationError({ fieldErrors: { price_id: ['Invalid price ID'] } })
    }

    // Get user's entitlement to check for existing Stripe customer
    const entitlement = await getEntitlement(user.id)
    let customerId = entitlement?.stripe_customer_id

    // Create Stripe customer if not exists
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to entitlement
      await updateStripeCustomerId(user.id, customerId)
    }

    // Determine checkout mode based on price type
    const mode = isPlusPlanPriceId(price_id) ? 'subscription' : 'payment'

    // Build success and cancel URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}/checkout/cancel`

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode,
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: user.id,
        price_id,
      },
      // For subscriptions, allow promotion codes
      ...(mode === 'subscription' && {
        allow_promotion_codes: true,
        subscription_data: {
          metadata: {
            user_id: user.id,
          },
        },
      }),
      // For one-time payments (credits)
      ...(mode === 'payment' && {
        payment_intent_data: {
          metadata: {
            user_id: user.id,
            price_id,
          },
        },
      }),
    })

    return successResponse({
      checkout_url: session.url,
      session_id: session.id,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
