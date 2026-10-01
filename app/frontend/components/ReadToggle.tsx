import { router, usePage } from '@inertiajs/react'
import { useState } from 'react'
import type { SharedProps } from '@/types'
import { useModal } from './ModalContext'
import Button from './ui/Button'

type Props = {
  bookId: number
  readingId: number | null
}

// One button, two states: "Lido" (filled) / "Não lido" (outlined). Guests are asked to sign in first.
export default function ReadToggle({ bookId, readingId }: Props) {
  const { current_user } = usePage<SharedProps>().props
  const { openModal } = useModal()
  const [processing, setProcessing] = useState(false)
  const read = readingId !== null

  const toggle = () => {
    if (!current_user) return openModal('auth')

    const options = { preserveScroll: true, onStart: () => setProcessing(true), onFinish: () => setProcessing(false) }
    if (read) router.delete(`/readings/${readingId}`, options)
    else router.post('/readings', { book_id: bookId }, options)
  }

  return (
    <Button variant={read ? 'primary' : 'secondary'} aria-pressed={read} disabled={processing} onClick={toggle}
      className="min-w-24 px-3 py-1">
      {read ? 'Lido' : 'Não lido'}
    </Button>
  )
}
