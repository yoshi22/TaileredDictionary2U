'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'
import { trackEvent } from '@/lib/analytics/events'

interface CheckoutButtonProps {
  priceId: string
  planType?: 'plus' | 'credits'
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  disabled?: boolean
}

export function CheckoutButton({
  priceId,
  planType = 'plus',
  children,
  variant = 'primary',
  className,
  disabled,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)
    trackEvent.checkoutStarted(planType, priceId)

    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ price_id: priceId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      className={className}
      onClick={handleCheckout}
      disabled={disabled || isLoading}
    >
      {isLoading ? 'Loading...' : children}
    </Button>
  )
}
