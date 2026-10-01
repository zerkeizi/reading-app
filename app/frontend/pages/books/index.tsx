import { Link } from '@inertiajs/react'
import type { Book } from '@/types'

export default function Index({ books }: { books: Book[] }) {
  return (
    <>
      <h1>Livros</h1>

      {books.length === 0 ? (
        <p>Nenhum livro cadastrado ainda.</p>
      ) : (
        <ul>
          {books.map((book) => (
            <li key={book.id}>
              <Link href={`/books/${book.id}`}>{book.title}</Link>
              {book.author && ` — ${book.author}`}
              {book.publication_year && ` (${book.publication_year})`}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
