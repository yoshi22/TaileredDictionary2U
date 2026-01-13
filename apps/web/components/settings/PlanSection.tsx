'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import type { Entitlement } from '@td2u/shared-types'

interface PlanSectionProps {
  entitlement: Entitlement
}

export function PlanSection({ entitlement }: PlanSectionProps) {
  const router = useRouter()
  const [isLoadingPortal, setIsLoadingPortal] = useState(false)
  const isPro = entitlement.plan_type === 'plus'

  const handleManageSubscription = async () => {
    setIsLoadingPortal(true)
    try {
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to open portal')
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.portal_url
    } catch (error) {
      console.error('Failed to open customer portal:', error)
      alert('Failed to open subscription management. Please try again.')
    } finally {
      setIsLoadingPortal(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-lg capitalize">
              {entitlement.plan_type === 'free' ? 'Free Plan' : 'Plus Plan'}
            </p>
            <p className="text-sm text-gray-600">
              {isPro
                ? '200 AI generations per month + credit purchases'
                : `${entitlement.monthly_generation_limit} AI generations per month`}
            </p>
          </div>
          {isPro && (
            <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-medium">
              Active
            </span>
          )}
        </div>

        {!isPro && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Upgrade to Plus</h4>
            <ul className="text-sm text-gray-600 space-y-1 mb-4">
              <li>- 200 AI generations per month</li>
              <li>- Priority support</li>
              <li>- Purchase additional credits</li>
            </ul>
            <Button onClick={() => router.push('/pricing')}>
              Upgrade Now
            </Button>
          </div>
        )}

        {isPro && entitlement.stripe_subscription_id && (
          <Button
            variant="secondary"
            onClick={handleManageSubscription}
            disabled={isLoadingPortal}
          >
            {isLoadingPortal ? 'Loading...' : 'Manage Subscription'}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
