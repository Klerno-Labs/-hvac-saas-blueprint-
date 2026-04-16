type JobContext = {
  title: string
  notes: string | null
  status: string
  scheduledFor: Date | null
}

type CustomerContext = {
  firstName: string
  lastName: string | null
  companyName: string | null
  addressLine1: string | null
  city: string | null
  state: string | null
}

type EstimateDraft = {
  scopeOfWork: string
  lineItems: { name: string; description: string; quantity: number; unitPriceCents: number }[]
  notes: string
}

/**
 * Generate a draft estimate from job and customer context.
 *
 * If OPENAI_API_KEY is configured, uses the OpenAI API for a smarter draft.
 * Otherwise, returns a deterministic template-based draft so the feature
 * works without a paid API key.
 *
 * All context is scoped to the current organization. No cross-tenant data
 * is ever included.
 */
export async function generateEstimateDraft(
  job: JobContext,
  customer: CustomerContext,
): Promise<EstimateDraft> {
  const apiKey = process.env.OPENAI_API_KEY

  if (apiKey) {
    return generateWithOpenAI(apiKey, job, customer)
  }

  return generateTemplateDraft(job, customer)
}

async function generateWithOpenAI(
  apiKey: string,
  job: JobContext,
  customer: CustomerContext,
): Promise<EstimateDraft> {
  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ')
  const customerLocation = [customer.city, customer.state].filter(Boolean).join(', ')

  const prompt = `You are an assistant helping a residential HVAC business create a professional estimate.

Job title: ${job.title}
Job notes: ${job.notes || 'None provided'}
Customer: ${customerName}${customer.companyName ? ` (${customer.companyName})` : ''}
Location: ${customerLocation || 'Not specified'}

Generate a brief, professional estimate draft with:
1. A scope of work paragraph (2-4 sentences describing the work)
2. 2-4 line items with name, brief description, quantity, and estimated price in cents (realistic HVAC pricing)
3. A short note to the customer

Respond in JSON format only:
{
  "scopeOfWork": "...",
  "lineItems": [{ "name": "...", "description": "...", "quantity": 1, "unitPriceCents": 15000 }],
  "notes": "..."
}

Keep pricing realistic for residential HVAC. This is a draft for human review, not a final quote.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    })

    if (!response.ok) {
      console.error('OpenAI API error:', response.status)
      return generateTemplateDraft(job, customer)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) {
      return generateTemplateDraft(job, customer)
    }

    const parsed = JSON.parse(content)

    // Validate structure minimally before returning
    if (!parsed.scopeOfWork || !Array.isArray(parsed.lineItems) || parsed.lineItems.length === 0) {
      return generateTemplateDraft(job, customer)
    }

    return {
      scopeOfWork: String(parsed.scopeOfWork).slice(0, 5000),
      lineItems: parsed.lineItems.slice(0, 10).map((item: Record<string, unknown>) => ({
        name: String(item.name || 'Service').slice(0, 200),
        description: String(item.description || '').slice(0, 500),
        quantity: Math.max(1, Math.floor(Number(item.quantity) || 1)),
        unitPriceCents: Math.max(0, Math.floor(Number(item.unitPriceCents) || 0)),
      })),
      notes: String(parsed.notes || '').slice(0, 2000),
    }
  } catch (error) {
    console.error('AI draft generation failed:', error)
    return generateTemplateDraft(job, customer)
  }
}

function generateTemplateDraft(
  job: JobContext,
  customer: CustomerContext,
): EstimateDraft {
  const customerName = [customer.firstName, customer.lastName].filter(Boolean).join(' ')

  return {
    scopeOfWork: `Perform ${job.title.toLowerCase()} for ${customerName}. ${job.notes ? `Additional details: ${job.notes}` : 'Work includes standard residential HVAC service as discussed.'}`,
    lineItems: [
      {
        name: job.title,
        description: 'Labor and service as described in scope of work',
        quantity: 1,
        unitPriceCents: 15000,
      },
      {
        name: 'Parts and materials',
        description: 'Required parts and materials for service',
        quantity: 1,
        unitPriceCents: 5000,
      },
    ],
    notes: `Thank you for choosing our services, ${customerName}. This estimate is valid for 30 days. Please review and let us know if you have any questions.`,
  }
}
