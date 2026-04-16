import Link from 'next/link'
import { getOptionalSession } from '@/lib/session'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const session = await getOptionalSession()

  if (session?.membership) {
    redirect('/dashboard')
  }

  return (
    <main>
      <div className="card" style={{ marginBottom: 20 }}>
        <h1>Get paid faster on every HVAC job</h1>
        <p className="muted">
          Quote, complete, invoice, and collect payment in one workflow built for small residential HVAC shops.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <Link href="/signup" className="button">Start setup</Link>
          <Link href="/login" className="button" style={{ background: '#374151' }}>Log in</Link>
        </div>
      </div>
      <div className="grid grid-3">
        <div className="card"><h3>Create quotes fast</h3><p className="muted">Generate estimates and line items quickly.</p></div>
        <div className="card"><h3>Capture proof of work</h3><p className="muted">Record job completion before invoicing.</p></div>
        <div className="card"><h3>Collect payment</h3><p className="muted">Use connected-account payments tied to invoices.</p></div>
      </div>
    </main>
  )
}
