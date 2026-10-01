import { Head, Link } from '@inertiajs/react'
import Avatar from '@/components/ui/Avatar'
import Cover from '@/components/ui/Cover'
import { RatingDisplay } from '@/components/ui/RatingSquares'
import type { Book, Reading } from '@/types'

type ProfileReading = Reading & {
  book: Pick<Book, 'id' | 'title' | 'author' | 'cover_url'>
}

type Props = {
  user: { id: number; name: string; email_address: string; member_since: number }
  readings_count: number
  readings: ProfileReading[]
}

// read_on is a plain date ("2026-09-30"): format it without a time zone shift
const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('pt-BR')

export default function Show({ user, readings_count, readings }: Props) {
  return (
    <>
      <Head title="Perfil" />
      <section className="flex items-center gap-4">
        <Avatar name={user.name} size={64} />
        <div>
          <h1 className="text-xl">{user.name}</h1>
          <p className="text-sm text-muted">Membro desde {user.member_since}</p>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex items-baseline justify-between border-b-2 border-ink pb-2">
          <h2 className="text-lg">Livros lidos</h2>
          <span className="text-sm text-muted">{readings_count} {readings_count === 1 ? 'livro' : 'livros'}</span>
        </div>

        {readings.length === 0 ? (
          <p className="text-muted">Você ainda não marcou nenhum livro como lido.</p>
        ) : (
          <ul>
            {readings.map((reading) => (
              <li key={reading.id} className="border-b border-dashed border-line py-4 last:border-0">
                <Link href={`/books/${reading.book.id}`} className="flex gap-4 hover:bg-placeholder/40">
                  <Cover url={reading.book.cover_url} title={reading.book.title} width={54} height={81} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <span className="font-heading leading-tight">{reading.book.title}</span>
                    {reading.book.author && <span className="text-sm">{reading.book.author}</span>}
                    {reading.read_on && <span className="text-sm text-muted">Lido em {formatDate(reading.read_on)}</span>}
                    <RatingDisplay rate={reading.rate} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  )
}
