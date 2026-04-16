import { requireAuth } from '@/lib/session'
import Link from 'next/link'
import { StripeConnectSection } from './stripe-connect'
import { CollectionsSettingsSection } from './collections-settings'
import { AccountingSettingsSection } from './accounting-settings'

export default async function SettingsPage() {
  const { organization } = await requireAuth()

  return (
    <main>
      <h1>Settings</h1>
      <p className="muted" style={{ marginBottom: 24 }}>{organization.name}</p>

      <StripeConnectSection
        accountId={organization.stripeConnectedAccountId}
        chargesEnabled={organization.stripeChargesEnabled}
        payoutsEnabled={organization.stripePayoutsEnabled}
      />

      <CollectionsSettingsSection
        initialEnabled={organization.collectionsEnabled}
        initialOverdue1Days={organization.collectionsOverdue1Days}
        initialOverdue2Days={organization.collectionsOverdue2Days}
        initialFinalDays={organization.collectionsFinalDays}
      />

      <AccountingSettingsSection
        initialProvider={organization.accountingProvider}
        initialConnected={organization.accountingConnected}
        lastSyncAt={organization.accountingLastSyncAt}
      />

      <div className="card" style={{ marginTop: 24 }}>
        <h2>Administration</h2>
        <p className="muted" style={{ marginBottom: 16 }}>
          Security and audit tools for organization owners.
        </p>
        <Link href="/settings/audit" className="button" style={{ fontSize: 14 }}>
          View audit log
        </Link>
      </div>

      <div style={{ marginTop: 16 }}>
        <Link href="/dashboard" className="muted" style={{ fontSize: 13 }}>Back to dashboard</Link>
      </div>
    </main>
  )
}
