import { NextRequest, NextResponse } from 'next/server'
import { stripe, getCreditAmountFromPriceId, isPlusPlanPriceId } from '@/lib/billing/stripe'
import { activatePlusPlan, deactivatePlusPlan, addCredits } from '@/lib/billing/entitlements'
import { createServiceRoleClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const WEBHOOK_LOG_PREFIX = '[Stripe Webhook]'

function logWebhook(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.log(`${WEBHOOK_LOG_PREFIX} ${message}`, payload)
    return
  }
  console.log(`${WEBHOOK_LOG_PREFIX} ${message}`)
}

function logWebhookError(message: string, payload?: Record<string, unknown>) {
  if (payload) {
    console.error(`${WEBHOOK_LOG_PREFIX} ${message}`, payload)
    return
  }
  console.error(`${WEBHOOK_LOG_PREFIX} ${message}`)
}

/**
 * Check if event has already been processed (idempotency)
 */
async function isEventProcessed(eventId: string): Promise<boolean> {
  const supabase = createServiceRoleClient()

  const { data } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('stripe_event_id', eventId)
    .single()

  return !!data
}

/**
 * Mark event as processed
 */
async function markEventProcessed(
  eventId: string,
  eventType: string,
  payload: unknown
): Promise<void> {
  const supabase = createServiceRoleClient()

  const { error } = await supabase.from('webhook_events').insert({
    stripe_event_id: eventId,
    event_type: eventType,
    payload,
  })

  if (error) {
    logWebhookError('Failed to mark event as processed', { eventId, error })
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
): Promise<void> {
  const userId = session.metadata?.user_id
  const customerId = session.customer as string

  if (!userId) {
    logWebhookError('No user_id in session metadata', { sessionId: session.id })
    return
  }

  logWebhook('Processing checkout session', {
    sessionId: session.id,
    mode: session.mode,
    userId,
  })

  if (session.mode === 'subscription') {
    // Plus plan subscription
    const subscriptionId = session.subscription as string
    await activatePlusPlan(userId, customerId, subscriptionId)
    logWebhook('Plus plan activated', { userId, subscriptionId })
  } else if (session.mode === 'payment') {
    // Credit pack purchase
    const priceId = session.metadata?.price_id
    if (priceId) {
      const creditAmount = getCreditAmountFromPriceId(priceId)
      if (creditAmount) {
        await addCredits(userId, creditAmount, 'purchase', `Credit pack purchase: ${creditAmount} credits`)
        logWebhook('Credits added', { userId, creditAmount })
      }
    }
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    logWebhookError('No user_id in subscription metadata', {
      subscriptionId: subscription.id,
    })
    return
  }

  logWebhook('Subscription updated', {
    subscriptionId: subscription.id,
    status: subscription.status,
    userId,
  })

  // Handle subscription status changes
  if (subscription.status === 'active') {
    const customerId = subscription.customer as string
    await activatePlusPlan(userId, customerId, subscription.id)
  } else if (
    subscription.status === 'canceled' ||
    subscription.status === 'unpaid' ||
    subscription.status === 'past_due'
  ) {
    // Note: For past_due, you might want to give a grace period instead
    if (subscription.status === 'canceled') {
      await deactivatePlusPlan(userId)
      logWebhook('Plus plan deactivated due to cancellation', { userId })
    }
  }
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
): Promise<void> {
  const userId = subscription.metadata?.user_id

  if (!userId) {
    logWebhookError('No user_id in subscription metadata', {
      subscriptionId: subscription.id,
    })
    return
  }

  logWebhook('Subscription deleted', { subscriptionId: subscription.id, userId })
  await deactivatePlusPlan(userId)
}

/**
 * Handle invoice.paid event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    // One-time payment, already handled by checkout.session.completed
    return
  }

  logWebhook('Invoice paid for subscription', {
    invoiceId: invoice.id,
    subscriptionId,
    amountPaid: invoice.amount_paid,
  })

  // The subscription.updated event will handle the renewal
  // This is mainly for logging/audit purposes
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string

  logWebhookError('Invoice payment failed', {
    invoiceId: invoice.id,
    customerId,
    amountDue: invoice.amount_due,
  })

  // Future enhancement: Send email notification to user
  // For now, just log. Stripe will retry and eventually
  // the subscription status will change to past_due/unpaid
}

/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      logWebhookError('Missing stripe-signature header')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      )
    }

    // Verify webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      logWebhookError('Webhook signature verification failed', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    logWebhook('Received event', { type: event.type, id: event.id })

    // Check idempotency
    if (await isEventProcessed(event.id)) {
      logWebhook('Event already processed, skipping', { eventId: event.id })
      return NextResponse.json({ received: true, skipped: true })
    }

    // Process event based on type
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        )
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription
        )
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        )
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        logWebhook('Unhandled event type', { type: event.type })
    }

    // Mark event as processed
    await markEventProcessed(event.id, event.type, event.data.object)

    return NextResponse.json({ received: true })
  } catch (error) {
    logWebhookError('Webhook processing error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
