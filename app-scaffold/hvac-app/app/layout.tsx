import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HVAC SaaS',
  description: 'Quote-to-payment SaaS for residential HVAC shops',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
