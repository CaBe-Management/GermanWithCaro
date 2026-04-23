import type { Metadata } from 'next'
import { Fraunces, Inter_Tight } from 'next/font/google'
import AuthGuard from '@/components/AuthGuard'
import CookieBanner from '@/components/CookieBanner'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  style: ['normal', 'italic'],
})

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'German With Caro - Learn German',
  description: 'A simple, word-by-word German vocabulary learning app',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" data-theme="plum" className={`${fraunces.variable} ${interTight.variable}`}>
      <body className="bg-gwc-base text-gwc-text font-sans">
        <AuthGuard>
          <main className="min-h-screen">{children}</main>
        </AuthGuard>
        <CookieBanner />
      </body>
    </html>
  )
}
