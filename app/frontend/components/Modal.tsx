import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  title: string
  onClose: () => void
  // "center" for dialogs like sign in; "top" leaves room below for results (Add Book)
  position?: 'center' | 'top'
  children: ReactNode
}

// Native <dialog> opened with showModal(): the browser provides the backdrop (styled in application.css),
// closes on Esc and keeps keyboard focus inside the dialog.
export default function Modal({ title, onClose, position = 'center', children }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    dialog?.showModal()
    // showModal() focuses the first focusable element (the × button); move focus to the field marked
    // with data-autofocus instead (React's autoFocus runs before showModal and is overridden)
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
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
      className={`mx-auto w-[calc(100%-2rem)] max-w-md border-2 border-ink bg-paper p-0 text-ink ${
        position === 'top' ? 'mt-16 mb-auto' : 'my-auto'}`}
    >
      <div className="p-5">
        <header className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base">{title}</h2>
          <button type="button" aria-label="Fechar" onClick={onClose}
            className="size-8 font-heading text-xl leading-none hover:bg-placeholder">×</button>
        </header>
        {children}
      </div>
    </dialog>
  )
}
