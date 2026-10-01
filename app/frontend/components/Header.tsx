import { Link, router } from '@inertiajs/react'
import type { User } from '@/types'
import { useModal } from './ModalContext'

export default function Header({ user }: { user: User | null }) {
  const { openModal } = useModal()

  return (
    <header>
      <Link href="/">Reading App</Link>

      {user ? (
        <nav>
          <span>{user.name}</span>
          <Link href="/profile">Perfil</Link>
          <button type="button" onClick={() => router.delete('/session')}>Sair</button>
        </nav>
      ) : (
        <nav>
          <button type="button" onClick={() => openModal('auth')}>Entrar</button>
        </nav>
      )}
    </header>
  )
}
