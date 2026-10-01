import { useEffect, useState } from 'react'
import Modal from './Modal'
import { useModal } from './ModalContext'
import Button from './ui/Button'
import Cover from './ui/Cover'

export type SearchResult = {
  external_id: string
  title: string
  author: string | null
  publication_year: number | null
  cover_url: string | null
}

type Status = 'idle' | 'searching' | 'done' | 'unavailable'

const MIN_CHARS = 2
const DEBOUNCE_MS = 200
const MAX_RESULTS = 8

// TODO: replace with fetch(`/book_searches?q=${query}`) once the OpenLibrary backend exists
async function searchBooks(query: string): Promise<SearchResult[]> {
  const fake: SearchResult[] = [
    { external_id: '/works/OL893414W', title: 'Dune', author: 'Frank Herbert', publication_year: 1965, cover_url: null },
    { external_id: '/works/OL20893680W', title: 'Dungeon Crawler Carl', author: 'Matt Dinniman', publication_year: 2020, cover_url: null },
    { external_id: '/works/OL27448W', title: 'The Lord of the Rings', author: 'J.R.R. Tolkien', publication_year: 1954, cover_url: null },
  ]
  return fake.filter((book) => book.title.toLowerCase().includes(query.toLowerCase())).slice(0, MAX_RESULTS)
}

export default function AddBookModal() {
  const { closeModal } = useModal()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<SearchResult[]>([])

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
    <Modal title="Adicionar livro" onClose={closeModal} position="top">
      <input
        data-autofocus
        type="search"
        aria-label="Buscar livro pelo título"
        placeholder="Buscar pelo título…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-full border-2 border-ink px-3 py-2"
      />

      <div className="mt-3 text-sm text-muted" aria-live="polite">
        {status === 'idle' && `Digite pelo menos ${MIN_CHARS} letras para buscar.`}
        {status === 'searching' && 'Buscando…'}
        {status === 'unavailable' && <span role="alert">A busca está indisponível no momento. Tente novamente mais tarde.</span>}
        {status === 'done' && (results.length === 0
          ? 'Nenhum livro encontrado.'
          : `${results.length} ${results.length === 1 ? 'sugestão' : 'sugestões'}`)}
      </div>

      {status === 'done' && results.length > 0 && (
        <ul className="mt-2">
          {results.map((book) => (
            <li key={book.external_id} className="flex items-center gap-3 border-b border-dashed border-line py-3 last:border-0">
              <Cover url={book.cover_url} title={book.title} width={40} height={60} />
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm leading-tight"><Highlight text={book.title} query={query.trim()} /></p>
                <p className="text-xs text-muted">
                  {[book.author ?? 'Autor desconhecido', book.publication_year].filter(Boolean).join(' · ')}
                </p>
              </div>
              {/* TODO: router.post('/readings', { external_id }) once the OpenLibrary backend exists */}
              <Button variant="secondary" disabled className="shrink-0 px-2 py-1 text-xs">+ Adicionar leitura</Button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

// Underlines the part of the title that matches what was typed (case-insensitive)
function Highlight({ text, query }: { text: string; query: string }) {
  const start = text.toLowerCase().indexOf(query.toLowerCase())
  if (!query || start === -1) return <>{text}</>

  const end = start + query.length
  return <>{text.slice(0, start)}<span className="underline underline-offset-2">{text.slice(start, end)}</span>{text.slice(end)}</>
}
