import Link from 'next/link'
import { Button } from '@/components/ui'

export function Hero() {
  return (
    <section className="py-20 lg:py-32">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
            知らない言葉に出会ったら、
            <br className="hidden sm:block" />
            <span className="text-blue-600">登録するだけ。</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            あとはAIとSRSにおまかせ。
            <br />
            TD2Uが翻訳、解説、例文、関連語を自動生成。
            <br />
            科学的な間隔反復で、確実に記憶に定着させます。
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                無料で始める
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                詳しく見る
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            クレジットカード不要・月20回までAI生成無料
          </p>
        </div>
      </div>
    </section>
  )
}
