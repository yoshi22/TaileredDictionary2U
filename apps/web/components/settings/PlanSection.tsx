'use client'

import { Card, CardContent, CardHeader, CardTitle, Button } from '@/components/ui'
import type { Entitlement } from '@td2u/shared-types'

interface PlanSectionProps {
  entitlement: Entitlement
}

export function PlanSection({ entitlement }: PlanSectionProps) {
  const isPro = entitlement.plan_type === 'plus'

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
                ? 'Unlimited generations and premium features'
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
              <li>- Unlimited AI generations</li>
              <li>- Priority support</li>
              <li>- Purchase additional credits</li>
            </ul>
            <Button onClick={() => alert('Stripe checkout coming soon!')}>
              Upgrade Now
            </Button>
          </div>
        )}

        {isPro && entitlement.stripe_subscription_id && (
          <Button
            variant="secondary"
            onClick={() => alert('Stripe customer portal coming soon!')}
          >
            Manage Subscription
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
