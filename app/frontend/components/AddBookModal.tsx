import { router } from '@inertiajs/react'
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
  // The signed-in user already has a reading of this work
  read: boolean
}

type Status = 'idle' | 'searching' | 'done' | 'unavailable'

const MIN_CHARS = 2
const DEBOUNCE_MS = 200
const UNAVAILABLE_MESSAGE = 'A busca está indisponível no momento. Tente novamente mais tarde.'

class SearchError extends Error {}

// The backend queries OpenLibrary (BookSearchesController); the browser never calls it directly
async function searchBooks(query: string, signal: AbortSignal): Promise<SearchResult[]> {
  let response: Response
  try {
    response = await fetch(`/book_searches?q=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
      // A guest/expired session is redirected to the login page: stop there instead of parsing its HTML
      redirect: 'manual',
      signal,
    })
  } catch (error) {
    if (signal.aborted) throw error
    throw new SearchError(UNAVAILABLE_MESSAGE)
  }

  if (response.type === 'opaqueredirect') throw new SearchError('Sua sessão expirou. Entre novamente para buscar.')

  const body = await response.json().catch(() => null)
  if (!response.ok || !body) throw new SearchError(body?.error ?? UNAVAILABLE_MESSAGE)

  return body.results
}

export default function AddBookModal() {
  const { closeModal } = useModal()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [results, setResults] = useState<SearchResult[]>([])
  const [error, setError] = useState('')
  const [adding, setAdding] = useState<string | null>(null)
  const [addError, setAddError] = useState('')

  useEffect(() => {
    if (query.trim().length < MIN_CHARS) {
      setStatus('idle')
      setResults([])
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setStatus('searching')
      try {
        setResults(await searchBooks(query.trim(), controller.signal))
        setStatus('done')
      } catch (err) {
        if (controller.signal.aborted) return
        setError(err instanceof SearchError ? err.message : UNAVAILABLE_MESSAGE)
        setStatus('unavailable')
      }
    }, DEBOUNCE_MS)

    // Typing again cancels the pending search and aborts the request still in flight
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  // Only the work key goes to the server: it imports the book's data from OpenLibrary itself
  const add = (book: SearchResult) => {
    setAddError('')
    router.post('/readings', { external_id: book.external_id }, {
      onStart: () => setAdding(book.external_id),
      onFinish: () => setAdding(null),
      onSuccess: closeModal,
      onError: () => setAddError('Não foi possível adicionar este livro. Talvez você já o tenha lido.'),
    })
  }

  return (
    <Modal title="Adicionar livro" onClose={closeModal} position="top">
      <input
        data-autofocus
        type="search"
        aria-label="Buscar livro pelo título"
        placeholder="Buscar pelo título…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="h-[46px] w-full border-2 border-ink px-3 text-base"
      />

      <div className="mt-3 text-xs text-subtle" aria-live="polite">
        {status === 'idle' && `Digite pelo menos ${MIN_CHARS} letras para buscar.`}
        {status === 'searching' && 'Buscando…'}
        {status === 'unavailable' && <span role="alert">{error}</span>}
        {status === 'done' && (results.length === 0
          ? 'Nenhum livro encontrado.'
          : `${results.length} ${results.length === 1 ? 'sugestão' : 'sugestões'}`)}
      </div>
      {addError && <p role="alert" className="mt-2 text-sm font-bold">{addError}</p>}

      {status === 'done' && results.length > 0 && (
        <ul className="mt-2">
          {results.map((book) => (
            <li key={book.external_id} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
              <Cover url={book.cover_url} title={book.title} width={40} height={60} />
              <div className="min-w-0 flex-1">
                <p className="font-heading text-sm leading-tight"><Highlight text={book.title} query={query.trim()} /></p>
                <p className="text-xs text-subtle">
                  {[book.author ?? 'Autor desconhecido', book.publication_year].filter(Boolean).join(' · ')}
                </p>
              </div>
              {book.read ? (
                <Button disabled className="shrink-0 px-2 py-1 text-xs disabled:opacity-100">Lido</Button>
              ) : (
                <Button variant="secondary" disabled={adding !== null} onClick={() => add(book)}
                  className="shrink-0 px-2 py-1 text-xs">
                  {adding === book.external_id ? 'Adicionando…' : '+ Adicionar leitura'}
                </Button>
              )}
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
