import { Link } from '@inertiajs/react'
import type { Book, Reading } from '@/types'

type ProfileReading = Reading & {
  book: Pick<Book, 'id' | 'title' | 'author' | 'cover_url'>
}

type Props = {
  user: { id: number; name: string; email_address: string }
  readings: ProfileReading[]
}

export default function Show({ user, readings }: Props) {
  return (
    <>
      <h1>{user.name}</h1>
      <p>{user.email_address}</p>

      <h2>Minhas leituras</h2>
      {readings.length === 0 ? (
        <p>Você ainda não adicionou nenhum livro.</p>
      ) : (
        <ul>
          {readings.map((reading) => (
            <li key={reading.id}>
              <Link href={`/books/${reading.book.id}`}>{reading.book.title}</Link>
              {reading.book.author && ` — ${reading.book.author}`}
              {reading.rate !== null && ` — ${reading.rate}/5`}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
