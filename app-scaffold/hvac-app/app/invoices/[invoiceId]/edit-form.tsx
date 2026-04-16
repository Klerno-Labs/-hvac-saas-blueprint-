'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoice } from './actions'

type LineItem = {
  name: string
  description: string
  quantity: number
  unitPriceCents: number
}

type InitialData = {
  descriptionOfWork: string
  notes: string
  taxCents: number
  dueDate: string
  lineItems: LineItem[]
}

export function InvoiceEditForm({ invoiceId, initialData }: { invoiceId: string; initialData: InitialData }) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const [descriptionOfWork, setDescriptionOfWork] = useState(initialData.descriptionOfWork)
  const [notes, setNotes] = useState(initialData.notes)
  const [taxCents, setTaxCents] = useState(initialData.taxCents)
  const [dueDate, setDueDate] = useState(initialData.dueDate)
  const [lineItems, setLineItems] = useState<LineItem[]>(initialData.lineItems)

  const subtotalCents = lineItems.reduce((sum, li) => sum + li.quantity * li.unitPriceCents, 0)
  const totalCents = subtotalCents + taxCents

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

    const result = await updateInvoice(invoiceId, {
      descriptionOfWork,
      notes: notes || undefined,
      taxCents,
      dueDate: dueDate || undefined,
      lineItems: lineItems.map((li) => ({
        name: li.name,
        description: li.description || undefined,
        quantity: li.quantity,
        unitPriceCents: li.unitPriceCents,
      })),
    })

    if (result.success) {
      router.refresh()
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <>
      {error && (
        <div style={{ color: '#dc2626', marginBottom: 12, fontSize: 14 }}>{error}</div>
      )}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <label>
          <span style={labelStyle}>Description of work *</span>
          <textarea
            value={descriptionOfWork}
            onChange={(e) => setDescriptionOfWork(e.target.value)}
            required
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <div>
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
          <span style={labelStyle}>Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label>
          <span style={labelStyle}>Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>

        <button type="submit" className="button" disabled={loading} style={{ textAlign: 'center', marginTop: 8 }}>
          {loading ? 'Saving...' : 'Save changes'}
        </button>
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
