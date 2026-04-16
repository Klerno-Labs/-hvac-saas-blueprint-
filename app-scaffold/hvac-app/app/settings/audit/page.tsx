import { requireAuth } from '@/lib/session'
import { db } from '@/lib/db'
import Link from 'next/link'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { organizationId, role } = await requireAuth()
  const { type: filterType } = await searchParams

  // Only owners can view audit logs
  if (role !== 'owner') {
    return (
      <main>
        <Card className="mx-auto mt-16 max-w-120 text-center">
          <CardHeader>
            <CardTitle>Access denied</CardTitle>
            <CardDescription>Only organization owners can view the audit log.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard" className={cn(buttonVariants())}>
              Back to dashboard
            </Link>
          </CardContent>
        </Card>
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
      <div className="flex justify-between items-center mb-5">
        <h1 className="text-2xl font-bold">Audit log</h1>
      </div>

      {/* Filter by event type */}
      {eventTypes.length > 0 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <Link
            href="/settings/audit"
            className={cn(
              'text-xs px-2.5 py-1 rounded-md no-underline transition-colors',
              !filterType
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80',
            )}
          >
            All ({logs.length})
          </Link>
          {eventTypes.map((et) => (
            <Link
              key={et.eventType}
              href={`/settings/audit?type=${et.eventType}` as never}
              className={cn(
                'text-xs px-2.5 py-1 rounded-md no-underline transition-colors',
                filterType === et.eventType
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-foreground hover:bg-muted/80',
              )}
            >
              {formatEventType(et.eventType)} ({et._count})
            </Link>
          ))}
        </div>
      )}

      {logs.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-muted-foreground">No audit log entries yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-b-2">
                  <TableHead className="text-[11px] font-semibold">Time</TableHead>
                  <TableHead className="text-[11px] font-semibold">Event</TableHead>
                  <TableHead className="text-[11px] font-semibold">Actor</TableHead>
                  <TableHead className="text-[11px] font-semibold">Target</TableHead>
                  <TableHead className="text-[11px] font-semibold">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="align-top">
                      <span className="whitespace-nowrap text-xs">
                        {new Date(log.createdAt).toLocaleDateString()}{' '}
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <Badge
                        className={cn(
                          'text-[11px] whitespace-nowrap text-white',
                          eventCategoryClasses(log.eventType),
                        )}
                      >
                        {formatEventType(log.eventType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="align-top">
                      <span className="text-muted-foreground text-xs">{log.actorEmail || log.actorId?.slice(0, 8) || 'system'}</span>
                    </TableCell>
                    <TableCell className="align-top">
                      {log.targetType && (
                        <span className="text-muted-foreground text-xs">
                          {log.targetType}{log.targetId ? `:${log.targetId.slice(0, 8)}` : ''}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="align-top">
                      {log.metadata && typeof log.metadata === 'object' && (
                        <span className="text-muted-foreground text-[11px]">
                          {summarizeMetadata(log.metadata as Record<string, unknown>)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <div className="mt-4">
        <Link href="/settings" className="text-xs text-muted-foreground hover:underline">Back to settings</Link>
      </div>
    </main>
  )
}

function formatEventType(type: string): string {
  return type.replace(/_/g, ' ')
}

function eventCategoryClasses(type: string): string {
  if (type.includes('stripe') || type.includes('payment')) return 'bg-blue-600'
  if (type.includes('portal')) return 'bg-violet-600'
  if (type.includes('collections')) return 'bg-amber-600'
  if (type.includes('accounting')) return 'bg-cyan-600'
  if (type.includes('invoice')) return 'bg-emerald-600'
  return 'bg-gray-500'
}

function summarizeMetadata(obj: Record<string, unknown>): string {
  const entries = Object.entries(obj).slice(0, 3)
  return entries.map(([k, v]) => `${k}: ${String(v)}`).join(', ')
}
