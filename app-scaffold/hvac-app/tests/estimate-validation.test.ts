import { describe, it, expect } from 'vitest'
import { createEstimateSchema, updateEstimateStatusSchema } from '@/lib/validations/estimate'

describe('createEstimateSchema', () => {
  const validInput = {
    jobId: 'job-123',
    scopeOfWork: 'Replace AC unit',
    lineItems: [{ name: 'AC Unit', quantity: 1, unitPriceCents: 350000 }],
  }

  it('accepts valid estimate', () => {
    expect(createEstimateSchema.safeParse(validInput).success).toBe(true)
  })

  it('requires at least one line item', () => {
    const result = createEstimateSchema.safeParse({ ...validInput, lineItems: [] })
    expect(result.success).toBe(false)
  })

  it('requires scope of work', () => {
    const result = createEstimateSchema.safeParse({ ...validInput, scopeOfWork: '' })
    expect(result.success).toBe(false)
  })

  it('rejects negative line item price', () => {
    const result = createEstimateSchema.safeParse({
      ...validInput,
      lineItems: [{ name: 'Discount', quantity: 1, unitPriceCents: -100 }],
    })
    expect(result.success).toBe(false)
  })

  it('rejects zero quantity', () => {
    const result = createEstimateSchema.safeParse({
      ...validInput,
      lineItems: [{ name: 'Part', quantity: 0, unitPriceCents: 1000 }],
    })
    expect(result.success).toBe(false)
  })
})

describe('updateEstimateStatusSchema', () => {
  it('accepts valid statuses', () => {
    for (const status of ['draft', 'sent', 'accepted', 'declined']) {
      expect(updateEstimateStatusSchema.safeParse({ status }).success).toBe(true)
    }
  })

  it('rejects invalid status', () => {
    expect(updateEstimateStatusSchema.safeParse({ status: 'cancelled' }).success).toBe(false)
  })
})
