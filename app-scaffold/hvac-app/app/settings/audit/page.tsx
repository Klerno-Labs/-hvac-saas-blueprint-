import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { organizationId, role } = await requireAuth()
  const { type: filterType } = await searchParams

  // Only owners can view audit logs
  if (role !== 'owner') {
    return (
      <main>
        <div className="card" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
          <h1>Access denied</h1>
          <p className="muted">Only organization owners can view the audit log.</p>
          <Link href="/dashboard" className="button" style={{ marginTop: 16, display: 'inline-block' }}>
            Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  const where: { organizationId: string; eventType?: string } = { organizationId }
  if (filterType) {
    where.eventType = filterType
  }

  const [logs, eventTypes] = await Promise.all([
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    db.auditLog.groupBy({
      by: ['eventType'],
      where: { organizationId },
      _count: true,
      orderBy: { eventType: 'asc' },
    }),
  ])

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1>Audit log</h1>
      </div>

      {/* Filter by event type */}
      {eventTypes.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
          <Link
            href="/settings/audit"
            style={{
              fontSize: 12,
              padding: '4px 10px',
              borderRadius: 6,
              textDecoration: 'none',
              background: !filterType ? 'var(--primary)' : '#f3f4f6',
              color: !filterType ? 'white' : 'var(--text)',
            }}
          >
            All ({logs.length})
          </Link>
          {eventTypes.map((et) => (
            <Link
              key={et.eventType}
              href={`/settings/audit?type=${et.eventType}` as never}
              style={{
                fontSize: 12,
                padding: '4px 10px',
                borderRadius: 6,
                textDecoration: 'none',
                background: filterType === et.eventType ? 'var(--primary)' : '#f3f4f6',
                color: filterType === et.eventType ? 'white' : 'var(--text)',
              }}
            >
              {formatEventType(et.eventType)} ({et._count})
            </Link>
          ))}
        </div>
      )}

      {logs.length === 0 ? (
        <div className="card">
          <p className="muted">No audit log entries yet.</p>
        </div>
      ) : (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)' }}>
                <th style={thStyle}>Time</th>
                <th style={thStyle}>Event</th>
                <th style={thStyle}>Actor</th>
                <th style={thStyle}>Target</th>
                <th style={thStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={tdStyle}>
                    <span style={{ whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleDateString()}{' '}
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: eventCategoryColor(log.eventType),
                      color: 'white',
                      whiteSpace: 'nowrap',
                    }}>
                      {formatEventType(log.eventType)}
                    </span>
                  </td>
                  <td style={tdStyle}>
                    <span className="muted">{log.actorEmail || log.actorId?.slice(0, 8) || 'system'}</span>
                  </td>
                  <td style={tdStyle}>
                    {log.targetType && (
                      <span className="muted">
                        {log.targetType}{log.targetId ? `:${log.targetId.slice(0, 8)}` : ''}
                      </span>
                    )}
                  </td>
                  <td style={tdStyle}>
                    {log.metadata && typeof log.metadata === 'object' && (
                      <span className="muted" style={{ fontSize: 11 }}>
                        {summarizeMetadata(log.metadata as Record<string, unknown>)}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <Link href="/settings" className="muted" style={{ fontSize: 13 }}>Back to settings</Link>
      </div>
    </main>
  )
}

function formatEventType(type: string): string {
  return type.replace(/_/g, ' ')
}

function eventCategoryColor(type: string): string {
  if (type.includes('stripe') || type.includes('payment')) return '#2563eb'
  if (type.includes('portal')) return '#7c3aed'
  if (type.includes('collections')) return '#d97706'
  if (type.includes('accounting')) return '#0891b2'
  if (type.includes('invoice')) return '#059669'
  return '#6b7280'
}

function summarizeMetadata(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj).slice(0, 3)
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ')
}

const thStyle: React.CSSProperties = { padding: '8px 6px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)' }
const tdStyle: React.CSSProperties = { padding: '6px', verticalAlign: 'top' }
