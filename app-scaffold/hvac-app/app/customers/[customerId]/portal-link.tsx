'use client'

import { useState } from 'react'
import { generatePortalLink, revokePortalTokens } from './portal-actions'

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
        <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>
      )}

      {portalUrl ? (
        <div>
          <p style={{ fontSize: 13, marginBottom: 8 }}>Share this link with your customer:</p>
          <div style={{
            padding: '8px 12px',
            background: '#f9fafb',
            borderRadius: 8,
            border: '1px solid var(--border)',
            fontSize: 13,
            fontFamily: 'monospace',
            wordBreak: 'break-all',
            marginBottom: 12,
          }}>
            {portalUrl}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => navigator.clipboard.writeText(portalUrl)}
              style={{ fontSize: 13, padding: '6px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer' }}
            >
              Copy link
            </button>
            <button
              onClick={handleRevoke}
              disabled={loading}
              style={{ fontSize: 13, padding: '6px 12px', background: 'none', border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: '#dc2626' }}
            >
              Revoke all links
            </button>
          </div>
          <p className="muted" style={{ fontSize: 12, marginTop: 8 }}>
            Link expires in 30 days. Revoking invalidates all active links for this customer.
          </p>
        </div>
      ) : (
        <div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 8 }}>
            Generate a portal link so your customer can view their estimates, invoices, and pay online.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="button"
            style={{ fontSize: 14 }}
          >
            {loading ? 'Generating...' : 'Generate portal link'}
          </button>
        </div>
      )}
    </div>
  )
}
