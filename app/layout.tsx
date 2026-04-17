import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Besiktnings\u00F6versikt',
  description: 'H\u00E5ll koll p\u00E5 fordonsbesiktningar och f\u00F6rfallodatum',
}

export const viewport: Viewport = {
  themeColor: '#f1f3f4',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="sv"
      data-theme="light"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-[#f1f3f4] flex flex-col">{children}</body>
    </html>
  )
}
