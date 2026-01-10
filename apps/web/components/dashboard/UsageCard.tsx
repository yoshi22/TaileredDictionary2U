import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { cn } from '@/lib/utils'

interface UsageCardProps {
  planType: 'free' | 'plus'
  generationUsed: number
  generationLimit: number
  creditBalance: number
}

export function UsageCard({
  planType,
  generationUsed,
  generationLimit,
  creditBalance,
}: UsageCardProps) {
  const usagePercentage = (generationUsed / generationLimit) * 100
  const isNearLimit = usagePercentage >= 80
  const isAtLimit = generationUsed >= generationLimit

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Usage</CardTitle>
        <span className={cn(
          'text-xs font-medium px-2 py-1 rounded',
          planType === 'plus'
            ? 'bg-blue-100 text-blue-700'
            : 'bg-gray-100 text-gray-700'
        )}>
          {planType === 'plus' ? 'Plus' : 'Free'}
        </span>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-600">AI Generations</span>
              <span className={cn(
                'font-medium',
                isAtLimit ? 'text-red-600' : isNearLimit ? 'text-orange-600' : 'text-gray-900'
              )}>
                {generationUsed} / {generationLimit}
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full transition-all',
                  isAtLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-blue-500'
                )}
                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
              />
            </div>
          </div>

          {planType === 'plus' && creditBalance > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Credit Balance</span>
              <span className="font-medium text-gray-900">{creditBalance}</span>
            </div>
          )}

          {planType === 'free' && isNearLimit && (
            <Link
              href="/pricing"
              className="block text-center text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
            >
              Upgrade to Plus for more generations
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
