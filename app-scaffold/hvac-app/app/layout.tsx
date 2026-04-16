import './globals.css'
import type { Metadata } from 'next'
import { Providers } from './providers'
import { NavHeader } from './components/nav-header'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'HVAC SaaS',
  description: 'Quote-to-payment SaaS for residential HVAC shops',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body>
        <Providers>
          <NavHeader />
          {children}
        </Providers>
      </body>
    </html>
  )
}
