import { useId, useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import { DROPDOWN_ITEM, DROPDOWN_PANEL, TRIGGER_OPEN } from './dropdown'

type Option<T extends string> = { value: T; label: string }

type Props<T extends string> = {
  label: string
  value: T
  options: Option<T>[]
  onChange: (value: T) => void
  className?: string
}

// Custom listbox instead of <select>: a native select's open list is drawn by the operating system and
// can't follow the design (ink trigger while open, bordered cream panel, selected option in blue).
// Keyboard support follows the ARIA listbox pattern: ↑/↓ move, Home/End jump, Enter/Space pick, Esc/Tab close.
export default function Select<T extends string>({ label, value, options, onChange, className = '' }: Props<T>) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const button = useRef<HTMLButtonElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))

  const show = () => {
    setActive(selectedIndex)
    setOpen(true)
    // Focus the list after it renders so the arrow keys go to it
    requestAnimationFrame(() => list.current?.focus())
  }

  const close = (refocus = true) => {
    setOpen(false)
    if (refocus) button.current?.focus()
  }

  const pick = (index: number) => {
    onChange(options[index].value)
    close()
  }

  const onButtonKeyDown = (event: KeyboardEvent) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
      event.preventDefault()
      show()
    }
  }

  const onListKeyDown = (event: KeyboardEvent) => {
    const last = options.length - 1
    const moves: Record<string, () => void> = {
      ArrowDown: () => setActive((index) => Math.min(last, index + 1)),
      ArrowUp: () => setActive((index) => Math.max(0, index - 1)),
      Home: () => setActive(0),
      End: () => setActive(last),
      Enter: () => pick(active),
      ' ': () => pick(active),
      Escape: () => close(),
    }
    if (event.key === 'Tab') return close(false)
    if (moves[event.key]) {
      event.preventDefault()
      moves[event.key]()
    }
  }

  // Close when focus leaves the whole control (click outside, Tab away)
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (open && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }

  return (
    <div className={`relative flex ${className}`} onBlur={onBlur}>
      <button
        ref={button}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={`${label}: ${options[selectedIndex].label}`}
        onClick={() => (open ? close() : show())}
        onKeyDown={onButtonKeyDown}
        className={`flex h-full items-center gap-1.5 px-3 text-[15px] md:px-[18px] md:text-base ${open ? TRIGGER_OPEN : ''}`}
      >
        {options[selectedIndex].label}
        <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          aria-label={label}
          tabIndex={-1}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKeyDown}
          className={`${DROPDOWN_PANEL} top-[calc(100%+2px)] -right-0.5 outline-none`}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${id}-${index}`}
              role="option"
              aria-selected={option.value === value}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => pick(index)}
              className={`${DROPDOWN_ITEM} cursor-pointer ${
                option.value === value ? 'bg-accent' : index === active ? 'bg-placeholder' : ''}`}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
