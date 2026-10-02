import { Link } from '@inertiajs/react'
import { useState } from 'react'
import type { CatalogBook } from '@/types'
import ReadToggle from './ReadToggle'
import Cover from './ui/Cover'

// Cover beside the text on every size (design board 1c). Mobile: list row with a divider.
// Desktop (md+): bordered card in the 3×3 grid, with a smaller cover.
export default function BookCard({ book }: { book: CatalogBook }) {
  const href = `/books/${book.id}`

  return (
    <article className="flex gap-4 border-b border-line pb-4 sm:gap-3 sm:border-2 sm:border-ink sm:p-3">
      <Link href={href} className="shrink-0" tabIndex={-1} aria-hidden="true">
        {/* <Cover url={book.cover_url} title={book.title} className="h-[138px] w-[92px] md:h-[117px] md:w-[78px]" /> */}
        <Cover url={book.cover_url} title={book.title} className="h-[138px] w-[92px] sm:aspect-[2/3] sm:h-auto sm:w-full" />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-0.5">
        <Link href={href} className="font-heading text-[15px] leading-tight hover:underline sm:text-sm">{book.title}</Link>
        {book.author && <p className="text-sm text-muted">{book.author}</p>}
        {book.publication_year && <p className="text-[13px] text-subtle sm:text-xs">{book.publication_year}</p>}
        {book.genre && (
          <p><span className="inline-block border border-ink px-2 py-0.5 text-xs sm:px-1.5 sm:py-0 sm:text-[11px] sm:text-muted">{book.genre}</span></p>
        )}

        <div className="flex-1 content-end items-center gap-2 pt-2 sm:gap-1.5">
          <ReadToggle bookId={book.id} readingId={book.reading_id} />
          {/* <BookMenu href={href} /> */}
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
        className="flex px-2 py-1 font-heading hover:bg-placeholder sm:size-[22px] sm:items-center sm:justify-center sm:border-2 sm:border-ink sm:p-0 sm:text-[13px]">
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
