import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import { NavHeader } from './components/nav-header'
import { TrialBannerWrapper } from './components/trial-banner-wrapper'
import { Analytics } from '@vercel/analytics/react'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'FieldClose — Get Paid Faster on Every HVAC Job',
  description: 'The quote-to-payment operating system for residential HVAC businesses. Estimates, invoices, payments, and collections in one workflow.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f766e" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <Providers>
          <NavHeader />
          <TrialBannerWrapper />
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
