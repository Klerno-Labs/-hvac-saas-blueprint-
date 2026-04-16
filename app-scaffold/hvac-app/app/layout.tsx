import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import { NavHeader } from './components/nav-header'

export const metadata: Metadata = {
  title: 'HVAC SaaS',
  description: 'Quote-to-payment SaaS for residential HVAC shops',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <NavHeader />
          {children}
        </Providers>
      </body>
    </html>
  )
}
