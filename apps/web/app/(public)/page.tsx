import { Metadata } from 'next'
import { Hero, Features, HowItWorks, Pricing, CTA } from '@/components/landing'

export const metadata: Metadata = {
  title: 'TD2U - AI-Powered Vocabulary Learning',
  description:
    '知らない言葉に出会ったら、登録するだけ。AIが翻訳、要約、例文、関連語を自動生成。間隔反復学習（SRS）で効率的に記憶定着。',
  openGraph: {
    title: 'TD2U - AI-Powered Vocabulary Learning',
    description:
      '知らない言葉に出会ったら、登録するだけ。AIが翻訳、要約、例文、関連語を自動生成。間隔反復学習（SRS）で効率的に記憶定着。',
  },
}

export default function HomePage() {
  return (
    <>
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CTA />
    </>
  )
}
