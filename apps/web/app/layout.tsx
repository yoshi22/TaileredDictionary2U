import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'TD2U - AI-Powered Vocabulary Learning',
    template: '%s | TD2U',
  },
  description:
    '知らない言葉に出会ったら、登録するだけ。AIが学習コンテンツを生成し、SRSで最適な復習タイミングを提案。',
  keywords: ['vocabulary', 'learning', 'AI', 'SRS', 'spaced repetition', '語彙学習', '単語帳', 'フラッシュカード'],
  authors: [{ name: 'TD2U' }],
  creator: 'TD2U',
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'TD2U - TaileredDictionary2U',
    title: 'TD2U - AI-Powered Vocabulary Learning',
    description: '知らない言葉に出会ったら、登録するだけ。AIが学習コンテンツを生成し、SRSで最適な復習タイミングを提案。',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TD2U - AI-Powered Vocabulary Learning',
    description: '知らない言葉に出会ったら、登録するだけ。AIが学習コンテンツを生成し、SRSで最適な復習タイミングを提案。',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={inter.className}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
