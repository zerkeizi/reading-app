import type { Book, Reading } from '@/types'

type BookReading = Reading & {
  reader: string
  can_edit: boolean
}

type Props = {
  book: Book
  readings: BookReading[]
}

export default function Show({ book, readings }: Props) {
  return (
    <article>
      {book.cover_url && <img src={book.cover_url} alt={`Capa de ${book.title}`} />}
      <h1>{book.title}</h1>
      <p>
        {book.author ?? 'Autor desconhecido'}
        {book.publication_year && ` · ${book.publication_year}`}
        {book.genre && ` · ${book.genre}`}
      </p>

      <h2>Leituras</h2>
      {readings.length === 0 ? (
        <p>Ninguém marcou este livro como lido ainda.</p>
      ) : (
        <ul>
          {readings.map((reading) => (
            <li key={reading.id}>
              <strong>{reading.reader}</strong>
              {reading.rate !== null && ` — ${reading.rate}/5`}
              {reading.read_on && ` — lido em ${reading.read_on}`}
              {reading.review && <p>{reading.review}</p>}
              {/* Rails decides can_edit (ReadingPolicy); buttons get wired when ReadingsController exists */}
              {reading.can_edit && (
                <span>
                  <button type="button" disabled>Editar</button>
                  <button type="button" disabled>Remover</button>
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </article>
  )
}
