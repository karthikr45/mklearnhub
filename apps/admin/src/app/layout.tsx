import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

import { AdminChrome } from '@/lib/auth'

import './globals.css'

const inter = Inter({ subsets: ['latin'], display: 'swap' })

export const metadata: Metadata = {
  title: 'LearnHub Admin',
  description: 'Platform super-admin dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.className} min-h-screen bg-background text-foreground antialiased`}
        suppressHydrationWarning
      >
        <AdminChrome>{children}</AdminChrome>
      </body>
    </html>
  )
}
