import { router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import type { FilterField } from '@/types'
import Select from './ui/Select'

const FIELDS: { value: FilterField; label: string }[] = [
  { value: 'author', label: 'Autor' },
  { value: 'genre', label: 'Gênero' },
  { value: 'year', label: 'Ano' },
]

const DEBOUNCE_MS = 300

type Props = {
  q: string
  field: FilterField
}

// Joined control: text input + attached select picking which field the text filters by.
// Each change reloads the home through Inertia, so filters live in the URL (?q=...&field=...).
export default function SearchBar({ q, field }: Props) {
  const [query, setQuery] = useState(q)
  const [currentField, setCurrentField] = useState<FilterField>(field)

  useEffect(() => {
    // Only visit when the input differs from the filters the page was rendered with. A "first render"
    // flag is not enough: React StrictMode runs effects twice, and a stray visit cancels other
    // in-flight Inertia requests (e.g. the login form).
    // With an empty query the field doesn't matter (the server falls back to "author").
    const trimmed = query.trim()
    if (trimmed === q && (trimmed === '' || currentField === field)) return

    const timer = setTimeout(() => {
      const params = trimmed ? { q: trimmed, field: currentField } : {}
      router.get('/', params, { preserveState: true, preserveScroll: true, replace: true })
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [query, currentField, q, field])

  return (
    <div className="flex h-[46px] border-2 border-ink md:h-[50px]">
      <input
        type="search"
        aria-label="Buscar livros"
        placeholder="Buscar livros…"
        inputMode={currentField === 'year' ? 'numeric' : 'search'}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="min-w-0 flex-1 border-0 bg-transparent px-3 text-base placeholder:text-avatar focus:ring-0 md:px-4 md:text-[17px]"
      />
      <Select label="Buscar por" value={currentField} options={FIELDS} onChange={setCurrentField}
        className="border-l-2 border-ink cursor-pointer" />
    </div>
  )
}
