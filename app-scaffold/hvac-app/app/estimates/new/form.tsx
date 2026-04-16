'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createEstimate, generateAiDraft } from './actions'

type LineItem = {
  name: string
  description: string
  quantity: number
  unitPriceCents: number
}

export function EstimateForm({ jobId, jobTitle }: { jobId: string; jobTitle: string }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiUsed, setAiUsed] = useState(false)

  const [scopeOfWork, setScopeOfWork] = useState('')
  const [terms, setTerms] = useState('')
  const [notes, setNotes] = useState('')
  const [taxCents, setTaxCents] = useState(0)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { name: '', description: '', quantity: 1, unitPriceCents: 0 },
  ])

  const subtotalCents = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0)
  const totalCents = subtotalCents + taxCents

  async function handleAiDraft() {
    setAiLoading(true)
    setError(null)

    const result = await generateAiDraft(jobId)

    if (result.success) {
      setScopeOfWork(result.draft.scopeOfWork)
      setNotes(result.draft.notes)
      setLineItems(result.draft.lineItems.map((li) => ({
        name: li.name,
        description: li.description,
        quantity: li.quantity,
        unitPriceCents: li.unitPriceCents,
      })))
      setAiUsed(true)
    } else {
      setError(result.error)
    }

    setAiLoading(false)
  }

  function addLineItem() {
    setLineItems([...lineItems, { name: '', description: '', quantity: 1, unitPriceCents: 0 }])
  }

  function removeLineItem(index: number) {
    if (lineItems.length <= 1) return
    setLineItems(lineItems.filter((_, i) => i !== index))
  }

  function updateLineItem(index: number, field: keyof LineItem, value: string | number) {
    const updated = [...lineItems]
    updated[index] = { ...updated[index], [field]: value }
    setLineItems(updated)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await createEstimate({
      jobId,
      scopeOfWork,
      terms: terms || undefined,
      notes: notes || undefined,
      taxCents,
      lineItems: lineItems.map((li) => ({
        name: li.name,
        description: li.description || undefined,
        quantity: li.quantity,
        unitPriceCents: li.unitPriceCents,
      })),
      aiDraftUsed: aiUsed,
    })

    if (result.success) {
      router.push(`/estimates/${result.estimateId}`)
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <>
      <div style={{ margin: '16px 0', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong style={{ fontSize: 14 }}>AI Draft Assist</strong>
            <p className="muted" style={{ fontSize: 13, margin: '4px 0 0' }}>
              Generate a starting draft from job context. You can review and edit everything before saving.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAiDraft}
            disabled={aiLoading}
            className="button"
            style={{ fontSize: 13, whiteSpace: 'nowrap' }}
          >
            {aiLoading ? 'Generating...' : 'Generate draft'}
          </button>
        </div>
        {aiUsed && (
          <p style={{ fontSize: 12, color: '#059669', marginTop: 8 }}>
            Draft generated. Review and edit before saving.
          </p>
        )}
      </div>

      {error && (
        <div style={{ color: '#dc2626', marginBottom: 16, fontSize: 14 }}>{error}</div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          <span style={labelStyle}>Scope of work *</span>
          <textarea
            value={scopeOfWork}
            onChange={(e) => setScopeOfWork(e.target.value)}
            required
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={labelStyle}>Line items *</span>
            <button type="button" onClick={addLineItem} style={{ fontSize: 13, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer' }}>
              + Add item
            </button>
          </div>

          {lineItems.map((li, i) => (
            <div key={i} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    placeholder="Item name"
                    value={li.name}
                    onChange={(e) => updateLineItem(i, 'name', e.target.value)}
                    required
                    style={inputStyle}
                  />
                  <input
                    placeholder="Description (optional)"
                    value={li.description}
                    onChange={(e) => updateLineItem(i, 'description', e.target.value)}
                    style={inputStyle}
                  />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <label>
                      <span style={{ fontSize: 12 }} className="muted">Qty</span>
                      <input
                        type="number"
                        min={1}
                        value={li.quantity}
                        onChange={(e) => updateLineItem(i, 'quantity', parseInt(e.target.value) || 1)}
                        style={inputStyle}
                      />
                    </label>
                    <label>
                      <span style={{ fontSize: 12 }} className="muted">Unit price ($)</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={(li.unitPriceCents / 100).toFixed(2)}
                        onChange={(e) => updateLineItem(i, 'unitPriceCents', Math.round(parseFloat(e.target.value || '0') * 100))}
                        style={inputStyle}
                      />
                    </label>
                    <label>
                      <span style={{ fontSize: 12 }} className="muted">Line total</span>
                      <input
                        type="text"
                        readOnly
                        value={formatCents(li.quantity * li.unitPriceCents)}
                        style={{ ...inputStyle, background: '#f9fafb' }}
                      />
                    </label>
                  </div>
                </div>
                {lineItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(i)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
                    title="Remove item"
                  >
                    &times;
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label>
            <span style={labelStyle}>Tax ($)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={(taxCents / 100).toFixed(2)}
              onChange={(e) => setTaxCents(Math.round(parseFloat(e.target.value || '0') * 100))}
              style={inputStyle}
            />
          </label>
          <div>
            <span style={labelStyle}>Total</span>
            <p style={{ fontSize: 20, fontWeight: 700, marginTop: 4 }}>{formatCents(totalCents)}</p>
          </div>
        </div>

        <label>
          <span style={labelStyle}>Terms</span>
          <textarea
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            rows={2}
            placeholder="Payment terms, warranty info, etc."
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <label>
          <span style={labelStyle}>Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Additional notes for the customer"
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button type="submit" className="button" disabled={loading} style={{ textAlign: 'center' }}>
            {loading ? 'Saving...' : 'Save estimate'}
          </button>
          <Link href={`/jobs/${jobId}` as never} style={{ padding: '10px 16px', fontSize: 14, color: 'var(--muted)', textDecoration: 'none' }}>
            Cancel
          </Link>
        </div>
      </form>
    </>
  )
}

const labelStyle: React.CSSProperties = { fontSize: 14, fontWeight: 500 }

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  marginTop: 4,
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 14,
}

function formatCents(cents: number): string {
  return '$' + (cents / 100).toFixed(2)
}
