import { Link } from '@inertiajs/react'
import { useState } from 'react'
import type { CatalogBook } from '@/types'
import ReadToggle from './ReadToggle'
import Cover from './ui/Cover'

// Mobile: list row with the cover beside the text. Desktop (md+): grid tile with the cover on top.
export default function BookCard({ book }: { book: CatalogBook }) {
  const href = `/books/${book.id}`

  return (
    <article className="flex gap-4 border-b border-dashed border-line pb-4 md:flex-col md:border-0 md:pb-0">
      <Link href={href} className="shrink-0" tabIndex={-1} aria-hidden="true">
        <Cover url={book.cover_url} title={book.title} className="h-[138px] w-[92px] md:aspect-[2/3] md:h-auto md:w-full" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <Link href={href} className="font-heading text-base leading-tight hover:underline">{book.title}</Link>
        {book.author && <p className="text-sm">{book.author}</p>}
        {book.publication_year && <p className="text-sm text-muted">{book.publication_year}</p>}
        {book.genre && (
          <p><span className="inline-block border border-line px-2 py-0.5 text-xs text-muted">{book.genre}</span></p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2">
          <ReadToggle bookId={book.id} readingId={book.reading_id} />
          <BookMenu href={href} />
        </div>
      </div>
    </article>
  )
}

function BookMenu({ href }: { href: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="relative" onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
    }}>
      <button type="button" aria-label="Mais opções" aria-expanded={open} onClick={() => setOpen(!open)}
        className="px-2 py-1 font-heading hover:bg-placeholder">
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 min-w-32 border-2 border-ink bg-paper">
          <Link href={href} className="block px-3 py-2 text-sm hover:bg-placeholder">Ver livro</Link>
        </div>
      )}
    </div>
  )
}
