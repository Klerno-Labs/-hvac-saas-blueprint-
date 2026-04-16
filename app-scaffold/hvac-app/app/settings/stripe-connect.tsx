'use client'

import { useState } from 'react'
import { startStripeOnboarding, refreshStripeStatus } from './stripe/actions'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function StripeConnectSection({
  accountId,
  chargesEnabled,
  payoutsEnabled,
}: {
  accountId: string | null
  chargesEnabled: boolean
  payoutsEnabled: boolean
}) {
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localCharges, setLocalCharges] = useState(chargesEnabled)
  const [localPayouts, setLocalPayouts] = useState(payoutsEnabled)

  async function handleConnect() {
    setError(null)
    setLoading(true)

    const result = await startStripeOnboarding()

    if (result.success) {
      window.location.href = result.url
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  async function handleRefresh() {
    setError(null)
    setRefreshing(true)

    const result = await refreshStripeStatus()

    if (result.success) {
      setLocalCharges(result.chargesEnabled)
      setLocalPayouts(result.payoutsEnabled)
    } else {
      setError(result.error)
    }
    setRefreshing(false)
  }

  const isConnected = accountId && localCharges

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stripe Payments</CardTitle>
        <CardDescription>
          Connect your Stripe account to collect payments from customers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-destructive text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Connection status</p>
            <p className={cn('font-semibold', isConnected ? 'text-emerald-600' : 'text-amber-600')}>
              {isConnected ? 'Connected' : accountId ? 'Onboarding incomplete' : 'Not connected'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Charges enabled</p>
            <p className={cn('font-semibold', localCharges ? 'text-emerald-600' : 'text-gray-500')}>
              {localCharges ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Payouts enabled</p>
            <p className={cn('font-semibold', localPayouts ? 'text-emerald-600' : 'text-gray-500')}>
              {localPayouts ? 'Yes' : 'No'}
            </p>
          </div>
          {accountId && (
            <div>
              <p className="text-xs text-muted-foreground">Account ID</p>
              <p className="text-xs font-mono">{accountId}</p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {!isConnected && (
            <Button
              onClick={handleConnect}
              disabled={loading}
            >
              {loading ? 'Redirecting...' : accountId ? 'Continue onboarding' : 'Connect Stripe'}
            </Button>
          )}
          {accountId && (
            <Button
              onClick={handleRefresh}
              disabled={refreshing}
              variant="outline"
            >
              {refreshing ? 'Checking...' : 'Refresh status'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
