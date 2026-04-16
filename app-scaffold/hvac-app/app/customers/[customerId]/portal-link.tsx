'use client'

import { useState } from 'react'
import { generatePortalLink, revokePortalTokens } from './portal-actions'
import { Button } from '@/components/ui/button'

export function PortalLinkSection({ customerId }: { customerId: string }) {
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGenerate() {
    setError(null)
    setLoading(true)

    const result = await generatePortalLink(customerId)

    if (result.success) {
      setPortalUrl(result.portalUrl)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  async function handleRevoke() {
    setError(null)
    setLoading(true)
    await revokePortalTokens(customerId)
    setPortalUrl(null)
    setLoading(false)
  }

  return (
    <div>
      {error && (
        <div className="text-destructive mb-3 text-sm">{error}</div>
      )}

      {portalUrl ? (
        <div>
          <p className="text-xs mb-2">Share this link with your customer:</p>
          <div className="rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-xs break-all mb-3">
            {portalUrl}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => navigator.clipboard.writeText(portalUrl)}
              variant="outline"
              size="sm"
            >
              Copy link
            </Button>
            <Button
              onClick={handleRevoke}
              disabled={loading}
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
            >
              Revoke all links
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Link expires in 30 days. Revoking invalidates all active links for this customer.
          </p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            Generate a portal link so your customer can view their estimates, invoices, and pay online.
          </p>
          <Button
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate portal link'}
          </Button>
        </div>
      )}
    </div>
  )
}
