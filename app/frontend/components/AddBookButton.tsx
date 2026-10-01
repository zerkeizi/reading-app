import { usePage } from '@inertiajs/react'
import type { SharedProps } from '@/types'
import { useModal } from './ModalContext'

// Floating "+" in the bottom-right corner: guests are asked to sign in first
export default function AddBookButton() {
  const { current_user } = usePage<SharedProps>().props
  const { openModal } = useModal()

  return (
    <button
      type="button"
      aria-label="Adicionar livro"
      style={{ position: 'fixed', right: '1.5rem', bottom: '1.5rem' }}
      onClick={() => openModal(current_user ? 'addBook' : 'auth')}
    >
      +
    </button>
  )
}
