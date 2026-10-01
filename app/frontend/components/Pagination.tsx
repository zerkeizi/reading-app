import { Link } from '@inertiajs/react'
import type { Pagination as PaginationData } from '@/types'

type Props = PaginationData & {
  // Current filters, kept in every page link
  params: Record<string, string>
}

export default function Pagination({ page, total_pages, params }: Props) {
  if (total_pages <= 1) return null

  const href = (target: number) => {
    const search = new URLSearchParams({ ...params, page: String(target) })
    return `/?${search}`
  }
  const cell = 'flex size-9 items-center justify-center border-2 border-ink text-sm font-bold'

  return (
    <nav aria-label="Paginação" className="mt-8 flex justify-center gap-2">
      {page > 1 ? <Link href={href(page - 1)} className={`${cell} hover:bg-placeholder`} aria-label="Página anterior">‹</Link>
        : <span className={`${cell} opacity-30`} aria-hidden="true">‹</span>}

      {Array.from({ length: total_pages }, (_, index) => index + 1).map((number) => (
        <Link key={number} href={href(number)} aria-current={number === page ? 'page' : undefined}
          className={`${cell} ${number === page ? 'bg-ink text-paper' : 'hover:bg-placeholder'}`}>
          {number}
        </Link>
      ))}

      {page < total_pages ? <Link href={href(page + 1)} className={`${cell} hover:bg-placeholder`} aria-label="Próxima página">›</Link>
        : <span className={`${cell} opacity-30`} aria-hidden="true">›</span>}
    </nav>
  )
}
