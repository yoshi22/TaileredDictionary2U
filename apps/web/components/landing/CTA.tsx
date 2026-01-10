import Link from 'next/link'
import { Button } from '@/components/ui'

export function CTA() {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-blue-600 rounded-2xl py-16 px-8 sm:px-16 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            今すぐ始めましょう
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            TD2Uで、知らない言葉を確実に自分のものに。
            <br />
            無料プランで今日から学習を始めることができます。
          </p>
          <Link href="/signup">
            <Button variant="secondary" size="lg">
              無料アカウントを作成
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
