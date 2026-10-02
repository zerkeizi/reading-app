import { usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'
import { useModal } from './ModalContext'

// Floating 60×60 "+" in the bottom-right corner, only for signed-in users (as in the design)
export default function AddBookButton() {
  const { current_user } = usePage<SharedProps>().props
  const { openModal } = useModal()

  const modal  = !current_user ? 'auth' : 'addBook';

  return (
    <button
      type="button"
      aria-label="Adicionar livro"
      onClick={() => openModal(modal)}
      className="cursor-pointer fixed right-6 bottom-6 z-10 flex size-[60px] items-center justify-center border-2 border-ink bg-accent font-heading text-3xl text-ink hover:brightness-95"
    >
      +
    </button>
  )
}
