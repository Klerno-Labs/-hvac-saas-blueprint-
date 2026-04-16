'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/customers', label: 'Customers' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/estimates', label: 'Estimates' },
  { href: '/invoices', label: 'Invoices' },
  { href: '/reports', label: 'Reports' },
  { href: '/reminders', label: 'Reminders' },
  { href: '/settings', label: 'Settings' },
]

export function NavHeader() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const hideOn = ['/login', '/signup', '/onboarding', '/portal', '/pay']
  if (hideOn.some((p) => pathname.startsWith(p)) || pathname === '/') {
    return null
  }

  return (
    <header className="sticky top-0 z-50 bg-card border-b">
      <div className="max-w-[1200px] mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-1 overflow-x-auto">
          <Link
            href="/dashboard"
            className="font-bold text-primary text-base no-underline mr-4 whitespace-nowrap"
          >
            HVAC SaaS
          </Link>
          <Separator orientation="vertical" className="h-6 mr-2" />
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href as never}
                className={`text-[13px] px-3 py-1.5 rounded-md no-underline whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
        <div className="flex items-center gap-3 ml-4">
          {session?.user?.name && (
            <span className="text-xs text-muted-foreground hidden md:inline">
              {session.user.name}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-xs"
          >
            Sign out
          </Button>
        </div>
      </div>
    </header>
  )
}
