import type { Metadata } from 'next'
import AuthGuard from '@/components/AuthGuard'
import CookieBanner from '@/components/CookieBanner'
import './globals.css'

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
    <html lang="en">
      <body className="bg-[#0f0e17] text-[#e8e6f0]">
        <AuthGuard>
          <main className="min-h-screen">{children}</main>
        </AuthGuard>
        {/* Cookie info banner — essential cookies only, no opt-in required */}
        <CookieBanner />
      </body>
    </html>
  )
}
