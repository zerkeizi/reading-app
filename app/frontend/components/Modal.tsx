import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  title: string
  onClose: () => void
  children: ReactNode
}

// Native <dialog> opened with showModal(): the browser provides the backdrop,
// closes on Esc and keeps keyboard focus inside the dialog.
export default function Modal({ title, onClose, children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      // The close event is async: ignore a stale one when the dialog was reopened (React StrictMode remounts)
      onClose={() => { if (!dialogRef.current?.open) onClose() }}
      onClick={(event) => {
        // A click on the dialog element itself (not its content) is a click on the backdrop
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div>
        <header>
          <h2>{title}</h2>
          <button type="button" aria-label="Fechar" onClick={onClose}>×</button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
