import { Metadata } from 'next'
import Link from 'next/link'
import { PlanComparison, CreditPackages, PricingFAQ } from '@/components/billing'
import { STRIPE_PRICES } from '@/lib/billing/stripe'
import { createClient } from '@/lib/supabase/server'
import { getEntitlement } from '@/lib/billing/entitlements'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'TD2Uの料金プラン。Free プランで無料で始めて、Plus プランでAI生成回数を拡大。クレジットパック購入も可能。',
  openGraph: {
    title: 'Pricing | TD2U',
    description:
      'TD2Uの料金プラン。Free プランで無料で始めて、Plus プランでAI生成回数を拡大。クレジットパック購入も可能。',
  },
}

export const dynamic = 'force-dynamic'

async function getCurrentUserPlan() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { plan: 'free' as const, isAuthenticated: false }
    }

    const entitlement = await getEntitlement(user.id)
    return {
      plan: (entitlement?.plan_type || 'free') as 'free' | 'plus',
      isAuthenticated: true,
    }
  } catch {
    return { plan: 'free' as const, isAuthenticated: false }
  }
}

export default async function PricingPage() {
  const userPlan = await getCurrentUserPlan()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your learning goals. Upgrade or downgrade anytime.
          </p>
        </div>
      </div>

      {/* Plan Comparison */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <PlanComparison
          plusPriceId={STRIPE_PRICES.PLUS_MONTHLY}
          currentPlan={userPlan.plan}
        />

        {!userPlan.isAuthenticated && (
          <p className="text-center text-gray-600 mt-8">
            <Link href="/login" className="text-blue-600 hover:underline">
              Sign in
            </Link>
            {' or '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              create an account
            </Link>
            {' to get started.'}
          </p>
        )}
      </div>

      {/* Credit Packages */}
      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <CreditPackages currentPlan={userPlan.plan} />
      </div>

      {/* FAQ Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <PricingFAQ />
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-white">
            Ready to accelerate your learning?
          </h2>
          <p className="mt-2 text-blue-100">
            Start for free, upgrade when you need more.
          </p>
          <div className="mt-6">
            {userPlan.isAuthenticated ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/signup"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                Get Started Free
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
