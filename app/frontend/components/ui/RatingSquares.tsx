import { useRef, type KeyboardEvent } from 'react'

// Rates go from 0.5 to 5 in half steps: each of the five squares is split into two halves
const SQUARES = [1, 2, 3, 4, 5] as const
const STEP = 0.5
const MIN = 0.5
const MAX = 5

type Fill = 'full' | 'half' | 'empty'

const fillFor = (square: number, rate: number | null): Fill => {
  if (rate === null) return 'empty'
  if (rate >= square) return 'full'
  if (rate >= square - STEP) return 'half'
  return 'empty'
}

const FILL_STYLE: Record<Fill, string> = {
  full: 'var(--color-accent)',
  half: 'linear-gradient(to right, var(--color-accent) 50%, var(--color-paper) 50%)',
  empty: 'var(--color-paper)',
}

const formatRate = (rate: number) => rate.toLocaleString('pt-BR')

// Read-only rating: five small squares, the last one half filled for x.5 rates
export function RatingDisplay({ rate }: { rate: number | null }) {
  return (
    <span className="inline-flex gap-1" aria-label={rate ? `Nota ${formatRate(rate)} de 5` : 'Sem nota'}>
      {SQUARES.map((square) => (
        <span key={square} className="size-3 border-2 border-ink" style={{ background: FILL_STYLE[fillFor(square, rate)] }} />
      ))}
    </span>
  )
}

type InputProps = {
  value: number | null
  onChange: (value: number | null) => void
}

// Rating input: five 44×44 squares, each with a left half (x - 0.5) and a right half (x).
// One radio group with ten options; arrow keys move by 0.5, clicking the selected value clears it.
export function RatingInput({ value, onChange }: InputProps) {
  const halves = useRef(new Map<number, HTMLButtonElement>())

  const select = (next: number) => {
    onChange(next)
    halves.current.get(next)?.focus()
  }

  const onKeyDown = (event: KeyboardEvent) => {
    const current = value ?? 0
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') select(Math.min(MAX, current + STEP))
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') select(Math.max(MIN, current - STEP))
    else return
    event.preventDefault()
  }

  // Roving tabindex: only the selected half (or the first one) is reachable with Tab
  const focusable = value ?? MIN

  return (
    <div role="radiogroup" aria-label="Nota" className="flex gap-2" onKeyDown={onKeyDown}>
      {SQUARES.map((square) => (
        <div key={square} className="relative flex size-11 border-2 border-ink"
          style={{ background: FILL_STYLE[fillFor(square, value)] }}>
          {[square - STEP, square].map((option) => (
            <button
              key={option}
              ref={(el) => { if (el) halves.current.set(option, el) }}
              type="button"
              role="radio"
              aria-checked={value === option}
              aria-label={`${formatRate(option)} de 5`}
              tabIndex={option === focusable ? 0 : -1}
              onClick={() => onChange(value === option ? null : option)}
              className="h-full w-1/2 bg-transparent hover:bg-ink/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            />
          ))}
        </div>
      ))}
      <span className="self-center font-heading text-sm" aria-hidden="true">
        {value ? formatRate(value) : '–'}
      </span>
    </div>
  )
}
