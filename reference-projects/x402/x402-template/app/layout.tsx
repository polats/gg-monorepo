import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { GemBalanceProvider } from '@/contexts/gem-balance-context'
import { GemBalanceHeader } from '@/components/gem-balance-header'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Solana x402 Template',
  description: 'This is a Next.js template with Solana payment integration using the x402 protocol.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <GemBalanceProvider>
          <GemBalanceHeader />
          <div className="pt-16">
            {children}
          </div>
        </GemBalanceProvider>
      </body>
    </html>
  )
}
