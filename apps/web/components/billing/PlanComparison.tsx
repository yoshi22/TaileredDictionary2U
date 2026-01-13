'use client'

import { CheckoutButton } from './CheckoutButton'

interface PlanComparisonProps {
  plusPriceId: string
  currentPlan?: 'free' | 'plus'
}

const PLAN_FEATURES = {
  free: {
    name: 'Free',
    price: 0,
    priceLabel: 'Free',
    description: 'Get started with basic features',
    features: [
      '20 AI generations per month',
      'Basic vocabulary management',
      'Standard SRS algorithm',
      'Single device',
    ],
    notIncluded: [
      'Additional credit purchases',
      'Priority support',
      'Export features',
    ],
  },
  plus: {
    name: 'Plus',
    price: 980,
    priceLabel: '980',
    description: 'For serious language learners',
    features: [
      '200 AI generations per month',
      'Advanced vocabulary management',
      'Optimized SRS algorithm',
      'Multiple devices sync',
      'Additional credit purchases',
      'Priority support',
      'Export features',
    ],
    notIncluded: [],
  },
}

export function PlanComparison({ plusPriceId, currentPlan }: PlanComparisonProps) {
  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      {/* Free Plan */}
      <div className="relative bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900">{PLAN_FEATURES.free.name}</h3>
          <p className="text-gray-600 mt-2">{PLAN_FEATURES.free.description}</p>
          <div className="mt-4">
            <span className="text-4xl font-bold text-gray-900">{PLAN_FEATURES.free.priceLabel}</span>
          </div>
        </div>

        <ul className="space-y-4 mb-8">
          {PLAN_FEATURES.free.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
          {PLAN_FEATURES.free.notIncluded.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-gray-400">
              <svg
                className="w-5 h-5 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        {currentPlan === 'free' ? (
          <button
            className="w-full py-3 px-4 bg-gray-100 text-gray-500 rounded-lg font-medium cursor-not-allowed"
            disabled
          >
            Current Plan
          </button>
        ) : (
          <button
            className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            disabled
          >
            Downgrade
          </button>
        )}
      </div>

      {/* Plus Plan */}
      <div className="relative bg-white rounded-2xl border-2 border-blue-500 p-8 shadow-lg">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
            Popular
          </span>
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold text-gray-900">{PLAN_FEATURES.plus.name}</h3>
          <p className="text-gray-600 mt-2">{PLAN_FEATURES.plus.description}</p>
          <div className="mt-4 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-gray-900">{PLAN_FEATURES.plus.priceLabel}</span>
            <span className="text-gray-600">/month</span>
          </div>
        </div>

        <ul className="space-y-4 mb-8">
          {PLAN_FEATURES.plus.features.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>

        {currentPlan === 'plus' ? (
          <button
            className="w-full py-3 px-4 bg-green-100 text-green-700 rounded-lg font-medium cursor-not-allowed"
            disabled
          >
            Current Plan
          </button>
        ) : (
          <CheckoutButton
            priceId={plusPriceId}
            className="w-full py-3 px-4"
          >
            Upgrade to Plus
          </CheckoutButton>
        )}
      </div>
    </div>
  )
}
