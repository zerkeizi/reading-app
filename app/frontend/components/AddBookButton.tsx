import { usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'
import { useModal } from './ModalContext'

// Floating 60×60 "+" in the bottom-right corner, only for signed-in users (as in the design)
export default function AddBookButton() {
  const { current_user } = usePage<SharedProps>().props
  const { openModal } = useModal()

  if (!current_user) return null

  return (
    <button
      type="button"
      aria-label="Adicionar livro"
      onClick={() => openModal('addBook')}
      className="fixed right-6 bottom-6 z-10 flex size-[60px] items-center justify-center bg-ink font-heading text-3xl text-paper hover:bg-muted"
    >
      +
    </button>
  )
}
