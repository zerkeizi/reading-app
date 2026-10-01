const VALUES = [1, 2, 3, 4, 5] as const

// Read-only rating: five small squares, filled up to the rate
export function RatingDisplay({ rate }: { rate: number | null }) {
  return (
    <span className="inline-flex gap-1" aria-label={rate ? `Nota ${rate} de 5` : 'Sem nota'}>
      {VALUES.map((value) => (
        <span key={value} className={`size-3 border-2 border-ink ${rate && value <= rate ? 'bg-ink' : 'bg-paper'}`} />
      ))}
    </span>
  )
}

type InputProps = {
  value: number | null
  onChange: (value: number | null) => void
}

// Rating input: five 44×44 square buttons, single select; clicking the selected one clears it
export function RatingInput({ value, onChange }: InputProps) {
  return (
    <div role="radiogroup" aria-label="Nota" className="flex gap-2">
      {VALUES.map((option) => {
        const selected = value === option
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(selected ? null : option)}
            className={`size-11 border-2 border-ink font-heading ${selected ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-placeholder'}`}
          >
            {option}
          </button>
        )
      })}
    </div>
  )
}
