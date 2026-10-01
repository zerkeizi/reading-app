import { useEffect, useState } from 'react'
import Modal from './Modal'
import { useModal } from './ModalContext'

export type SearchResult = {
  external_id: string
  title: string
  author: string | null
  publication_year: number | null
  cover_url: string | null
}

type Status = 'idle' | 'searching' | 'done' | 'unavailable'

const MIN_CHARS = 3
const DEBOUNCE_MS = 400

// TODO: replace with fetch(`/book_searches?q=${query}`) once the OpenLibrary backend exists
async function searchBooks(query: string): Promise<SearchResult[]> {
  const fake: SearchResult[] = [
    { external_id: '/works/OL893414W', title: 'Dune', author: 'Frank Herbert', publication_year: 1965, cover_url: null },
    { external_id: '/works/OL27448W', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', publication_year: 1954, cover_url: null },
  ]
  return fake.filter((book) => book.title.toLowerCase().includes(query.toLowerCase()))
}

export default function AddBookModal() {
  const { closeModal } = useModal()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selected, setSelected] = useState<SearchResult | null>(null)

  useEffect(() => {
    if (query.trim().length < MIN_CHARS) {
      setStatus('idle')
      setResults([])
      return
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setStatus('searching')
      try {
        const books = await searchBooks(query.trim())
        if (!cancelled) {
          setResults(books)
          setStatus('done')
        }
      } catch {
        if (!cancelled) setStatus('unavailable')
      }
    }, DEBOUNCE_MS)

    // Typing again before the delay cancels the pending search
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  return (
    <Modal title="Adicionar livro" onClose={closeModal}>
      <label>
        Título
        <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Ex.: Dune" />
      </label>

      {status === 'idle' && <p>Digite pelo menos {MIN_CHARS} letras para buscar.</p>}
      {status === 'searching' && <p>Buscando…</p>}
      {status === 'unavailable' && <p role="alert">A busca está indisponível no momento. Tente novamente mais tarde.</p>}
      {status === 'done' && results.length === 0 && <p>Nenhum livro encontrado.</p>}

      {status === 'done' && results.length > 0 && (
        <ul>
          {results.map((book) => (
            <li key={book.external_id}>
              <label>
                <input type="radio" name="book" checked={selected?.external_id === book.external_id}
                  onChange={() => setSelected(book)} />
                {book.title} — {book.author ?? 'Autor desconhecido'} {book.publication_year && `(${book.publication_year})`}
              </label>
            </li>
          ))}
        </ul>
      )}

      {/* TODO: router.post('/readings', { external_id: selected.external_id }) once ReadingsController exists */}
      <button type="button" disabled>
        Adicionar
      </button>
    </Modal>
  )
}
