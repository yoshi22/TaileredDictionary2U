'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'
import type { Entitlement } from '@td2u/shared-types'

interface UsageSectionProps {
  entitlement: Entitlement
}

export function UsageSection({ entitlement }: UsageSectionProps) {
  const usagePercentage = Math.min(
    100,
    Math.round(
      (entitlement.monthly_generation_used / entitlement.monthly_generation_limit) * 100
    )
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Generation Usage */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">AI Generations</span>
            <span className="font-medium">
              {entitlement.monthly_generation_used} /{' '}
              {entitlement.monthly_generation_limit}
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                usagePercentage >= 90
                  ? 'bg-red-500'
                  : usagePercentage >= 70
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Resets at the start of each billing period
          </p>
        </div>

        {/* Credits (if Plus) */}
        {entitlement.plan_type === 'plus' && (
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Credit Balance</span>
              <span className="font-medium">{entitlement.credit_balance}</span>
            </div>
            <p className="text-xs text-gray-500">
              Credits are used when monthly quota is exceeded
            </p>
          </div>
        )}

        {/* Period Info */}
        {entitlement.current_period_end && (
          <div className="text-sm text-gray-600">
            Current period ends:{' '}
            {new Date(entitlement.current_period_end).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
