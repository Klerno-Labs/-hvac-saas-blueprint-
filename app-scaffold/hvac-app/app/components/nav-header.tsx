'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'

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

  // Don't render nav on public/portal/auth pages
  const hideOn = ['/login', '/signup', '/onboarding', '/portal', '/pay']
  if (hideOn.some((p) => pathname.startsWith(p)) || pathname === '/') {
    return null
  }

  return (
    <header style={{
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      padding: '0 20px',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{
        maxWidth: 1100,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 52,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'auto' }}>
          <Link href="/dashboard" style={{
            fontWeight: 700,
            fontSize: 15,
            color: 'var(--primary)',
            textDecoration: 'none',
            marginRight: 16,
            whiteSpace: 'nowrap',
          }}>
            HVAC SaaS
          </Link>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href as never}
                style={{
                  fontSize: 13,
                  padding: '6px 10px',
                  borderRadius: 6,
                  textDecoration: 'none',
                  color: isActive ? 'var(--primary)' : 'var(--muted)',
                  background: isActive ? '#f0fdfa' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </Link>
            )
          })}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            fontSize: 13,
            padding: '6px 12px',
            background: 'none',
            border: '1px solid var(--border)',
            borderRadius: 6,
            cursor: 'pointer',
            color: 'var(--muted)',
            whiteSpace: 'nowrap',
            marginLeft: 12,
          }}
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
