import { Head } from '@inertiajs/react'
import BookCard from '@/components/BookCard'
import Pagination from '@/components/Pagination'
import SearchBar from '@/components/SearchBar'
import type { CatalogBook, FilterField, Pagination as PaginationData } from '@/types'

type Props = {
  books: CatalogBook[]
  filters: { q: string; field: FilterField }
  pagination: PaginationData
}

export default function Index({ books, filters, pagination }: Props) {
  const searching = filters.q !== ''
  const params: Record<string, string> = searching ? { q: filters.q, field: filters.field } : {}

  return (
    <>
      <Head title="Explorar" />
      <h1 className="mb-3.5 text-lg tracking-[-0.5px] md:text-[22px]">Explorar</h1>

      <SearchBar q={filters.q} field={filters.field} />

      {searching && (
        <p className="mt-3 text-sm text-subtle">
          {pagination.total_count} {pagination.total_count === 1 ? 'resultado' : 'resultados'} para "{filters.q}"
        </p>
      )}

      {books.length === 0 ? (
        <p className="mt-8 text-muted">{searching ? 'Nenhum livro encontrado.' : 'Nenhum livro cadastrado ainda.'}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:mt-5 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => <BookCard key={book.id} book={book} />)}
        </div>
      )}

      <Pagination {...pagination} params={params} />
    </>
  )
}
