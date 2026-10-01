import { Head, Link, router, useForm, usePage } from '@inertiajs/react'
import type { FormEvent, MouseEvent } from 'react'
import { useModal } from '@/components/ModalContext'
import Button from '@/components/ui/Button'
import Cover from '@/components/ui/Cover'
import { RatingInput } from '@/components/ui/RatingSquares'
import type { Book, Reading, SharedProps } from '@/types'

type Props = {
  book: Book
  my_reading: Reading | null
}

export default function Show({ book, my_reading }: Props) {
  return (
    <article>
      <Head title={book.title} />
      <BackLink />

      <div className="mt-4 flex gap-5">
        <Cover url={book.cover_url} title={book.title} width={110} height={165} />
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl leading-tight md:text-2xl">{book.title}</h1>
          {book.author && <p>{book.author}</p>}
          {book.publication_year && <p className="text-sm text-muted">{book.publication_year}</p>}
          {book.genre && (
            <p><span className="inline-block border border-line px-2 py-0.5 text-xs text-muted">{book.genre}</span></p>
          )}
          {my_reading && (
            <p className="mt-2"><span className="inline-block bg-ink px-2 py-0.5 text-xs font-bold text-paper">Lido</span></p>
          )}
        </div>
      </div>

      {my_reading ? <YourReading reading={my_reading} /> : <AddReading bookId={book.id} />}
    </article>
  )
}

// "‹ Voltar": back in history when there is one, otherwise to the catalog
function BackLink() {
  const goBack = (event: MouseEvent) => {
    if (window.history.length > 1) {
      event.preventDefault()
      window.history.back()
    }
  }

  return <Link href="/" onClick={goBack} className="text-sm font-bold hover:underline">‹ Voltar</Link>
}

// Not read yet: one full-width primary action. Guests are asked to sign in first.
function AddReading({ bookId }: { bookId: number }) {
  const { current_user } = usePage<SharedProps>().props
  const { openModal } = useModal()

  const add = () => {
    if (!current_user) return openModal('auth')
    router.post('/readings', { book_id: bookId }, { preserveScroll: true })
  }

  return <Button className="mt-6 w-full py-3" onClick={add}>+ Adicionar leitura</Button>
}

// Read: editable read date, rating and review, saved on the user's own Reading
function YourReading({ reading }: { reading: Reading }) {
  const form = useForm({
    read_on: reading.read_on ?? '',
    rate: reading.rate,
    review: reading.review ?? '',
  })

  const save = (event: FormEvent) => {
    event.preventDefault()
    form.patch(`/readings/${reading.id}`, { preserveScroll: true })
  }

  const markNotRead = () => router.delete(`/readings/${reading.id}`, { preserveScroll: true })

  return (
    <section className="mt-8 border-t border-dashed border-line pt-6">
      <h2 className="mb-4 text-lg">Sua leitura</h2>

      <form onSubmit={save} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Lido em</span>
          <input type="date" value={form.data.read_on} onChange={(e) => form.setData('read_on', e.target.value)}
            className="w-48 border-2 border-ink" />
          {form.errors.read_on && <span role="alert" className="text-sm">{form.errors.read_on}</span>}
        </label>

        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold">Nota</span>
          <RatingInput value={form.data.rate} onChange={(rate) => form.setData('rate', rate)} />
          {form.errors.rate && <span role="alert" className="text-sm">{form.errors.rate}</span>}
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold">Resenha</span>
          <textarea rows={5} value={form.data.review} onChange={(e) => form.setData('review', e.target.value)}
            className="border-2 border-ink" />
          {form.errors.review && <span role="alert" className="text-sm">{form.errors.review}</span>}
        </label>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={form.processing}>Salvar</Button>
          <Button variant="secondary" onClick={markNotRead} disabled={form.processing}>Marcar como não lido</Button>
        </div>
      </form>
    </section>
  )
}
