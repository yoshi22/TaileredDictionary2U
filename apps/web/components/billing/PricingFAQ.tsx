'use client'

import { useState } from 'react'

interface FAQItem {
  question: string
  answer: string
}

const FAQ_ITEMS: FAQItem[] = [
  {
    question: 'What counts as an AI generation?',
    answer:
      'Each time you create or enrich a vocabulary entry with AI-generated content (translations, summaries, examples, related terms), it counts as one AI generation.',
  },
  {
    question: 'What happens when I run out of monthly generations?',
    answer:
      'Free plan users will need to wait until the next month for their quota to reset. Plus plan users can purchase additional credits to continue using AI features.',
  },
  {
    question: 'Do unused credits expire?',
    answer:
      'No, purchased credits never expire. They remain in your account until you use them. Monthly generation quotas reset at the beginning of each billing period.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes, you can cancel your Plus subscription at any time. You will retain access to Plus features until the end of your current billing period.',
  },
  {
    question: 'Will I lose my data if I downgrade to Free?',
    answer:
      'No, your vocabulary entries and learning progress are never deleted. You will only have reduced AI generation limits on the Free plan.',
  },
  {
    question: 'How do I manage my subscription?',
    answer:
      'Plus subscribers can manage their subscription, update payment methods, and view billing history through the Customer Portal, accessible from the Settings page.',
  },
]

export function PricingFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
        Frequently Asked Questions
      </h2>

      <div className="space-y-4">
        {FAQ_ITEMS.map((item, index) => (
          <div
            key={index}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden"
          >
            <button
              className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggleFAQ(index)}
            >
              <span className="font-medium text-gray-900">{item.question}</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  openIndex === index ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4">
                <p className="text-gray-600">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
