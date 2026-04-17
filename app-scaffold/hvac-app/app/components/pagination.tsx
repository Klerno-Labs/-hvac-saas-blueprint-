import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface PaginationProps {
  currentPage: number
  totalPages: number
  basePath: string
  searchParams?: Record<string, string>
}

export function Pagination({ currentPage, totalPages, basePath, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null

  function buildHref(page: number) {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(page))
    return `${basePath}?${params.toString()}`
  }

  return (
    <div className="flex items-center justify-between mt-6">
      <p className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link href={buildHref(currentPage - 1) as never}>
            <Button variant="outline" size="sm">Previous</Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>Previous</Button>
        )}
        {currentPage < totalPages ? (
          <Link href={buildHref(currentPage + 1) as never}>
            <Button variant="outline" size="sm">Next</Button>
          </Link>
        ) : (
          <Button variant="outline" size="sm" disabled>Next</Button>
        )}
      </div>
    </div>
  )
}
