import Link from 'next/link'
import { Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '0',
      description: '個人学習に最適',
      features: [
        'AI生成 月20回',
        'デッキ 5個まで',
        'エントリー 無制限',
        'SRS復習 無制限',
      ],
      cta: '無料で始める',
      href: '/signup',
      featured: false,
    },
    {
      name: 'Plus',
      price: '980',
      description: 'パワーユーザー向け',
      features: [
        'AI生成 月200回',
        'デッキ 無制限',
        'エントリー 無制限',
        'SRS復習 無制限',
        '追加クレジット購入可能',
        '優先サポート',
      ],
      cta: 'Plusを始める',
      href: '/signup?plan=plus',
      featured: true,
    },
  ]

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            シンプルな料金プラン
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            まずは無料で始めて、必要に応じてアップグレード
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'rounded-2xl p-8',
                plan.featured
                  ? 'bg-blue-600 text-white ring-4 ring-blue-600 ring-offset-2'
                  : 'bg-white border border-gray-200'
              )}
            >
              <h3 className={cn(
                'text-xl font-semibold',
                plan.featured ? 'text-white' : 'text-gray-900'
              )}>
                {plan.name}
              </h3>
              <p className={cn(
                'mt-2 text-sm',
                plan.featured ? 'text-blue-100' : 'text-gray-500'
              )}>
                {plan.description}
              </p>
              <div className="mt-6">
                <span className={cn(
                  'text-4xl font-bold',
                  plan.featured ? 'text-white' : 'text-gray-900'
                )}>
                  ¥{plan.price}
                </span>
                <span className={cn(
                  'text-sm ml-1',
                  plan.featured ? 'text-blue-100' : 'text-gray-500'
                )}>
                  /月
                </span>
              </div>
              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <svg
                      className={cn(
                        'w-5 h-5 mr-3 flex-shrink-0',
                        plan.featured ? 'text-blue-200' : 'text-blue-600'
                      )}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className={plan.featured ? 'text-blue-50' : 'text-gray-600'}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link href={plan.href}>
                  <Button
                    variant={plan.featured ? 'secondary' : 'primary'}
                    className="w-full"
                    size="lg"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
