'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface CreditPackagesProps {
  currentPlan?: 'free' | 'plus'
}

interface CreditPack {
  credits: '50' | '100' | '250'
  price: number
  savings?: string
}

const CREDIT_PACKS: CreditPack[] = [
  { credits: '50', price: 500 },
  { credits: '100', price: 980, savings: 'Save 2%' },
  { credits: '250', price: 2200, savings: 'Save 12%' },
]

export function CreditPackages({ currentPlan }: CreditPackagesProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handlePurchase = async (credits: string) => {
    setIsLoading(credits)
    try {
      const response = await fetch('/api/billing/credits/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credits }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url
    } catch (error) {
      console.error('Credit purchase error:', error)
      alert('Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(null)
    }
  }

  const isPlus = currentPlan === 'plus'

  return (
    <div className="bg-gray-50 rounded-2xl p-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Credit Packs</h2>
        <p className="text-gray-600 mt-2">
          {isPlus
            ? 'Purchase additional credits when you need more AI generations'
            : 'Upgrade to Plus to purchase additional credits'}
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
        {CREDIT_PACKS.map((pack) => (
          <div
            key={pack.credits}
            className={`bg-white rounded-xl p-6 border ${
              pack.savings ? 'border-blue-200' : 'border-gray-200'
            } text-center relative`}
          >
            {pack.savings && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                {pack.savings}
              </span>
            )}
            <div className="text-3xl font-bold text-gray-900 mb-1">{pack.credits}</div>
            <div className="text-gray-600 mb-4">credits</div>
            <div className="text-xl font-semibold text-gray-900 mb-4">
              {pack.price}
            </div>
            <Button
              variant={isPlus ? 'primary' : 'secondary'}
              className="w-full"
              disabled={!isPlus || isLoading === pack.credits}
              onClick={() => handlePurchase(pack.credits)}
            >
              {isLoading === pack.credits ? 'Loading...' : isPlus ? 'Purchase' : 'Plus Only'}
            </Button>
          </div>
        ))}
      </div>

      {!isPlus && (
        <p className="text-center text-sm text-gray-500 mt-6">
          Credit purchases are available for Plus plan subscribers only.
        </p>
      )}
    </div>
  )
}
