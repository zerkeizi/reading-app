import { Link, router } from '@inertiajs/react'
import { useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'
import type { User } from '@/types'
import { useModal } from './ModalContext'
import Avatar from './ui/Avatar'
import Button from './ui/Button'

// Black bar on every page: logo on the left; "Entrar" or the account menu on the right (desktop),
// the same options behind a ☰ button on mobile.
export default function Header({ user }: { user: User | null }) {
  return (
    <header className="bg-ink text-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg">
          <span aria-hidden="true" className="size-7 border-2 border-paper" />
          Catálogo coletivo
        </Link>

        <div className="hidden md:block">
          {user ? <AccountMenu user={user} /> : <SignInButton />}
        </div>

        <MobileMenu user={user} />
      </div>
    </header>
  )
}

function SignInButton() {
  const { openModal } = useModal()
  return <Button variant="inverse" onClick={() => openModal('auth')}>Entrar</Button>
}

const signOut = () => router.delete('/session')

// "{name} ▾": dropdown with Perfil / Sair; closes on Esc or when focus leaves it
function AccountMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false)

  return (
    <Dropdown open={open} onClose={() => setOpen(false)}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-1 py-1 font-bold hover:underline">
        <Avatar name={user.name} size={32} />
        {user.name} <span aria-hidden="true">▾</span>
      </button>
      {open && (
        <MenuPanel>
          <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={MENU_ITEM}>Perfil</Link>
          <button type="button" role="menuitem" onClick={() => { setOpen(false); signOut() }} className={MENU_ITEM}>Sair</button>
        </MenuPanel>
      )}
    </Dropdown>
  )
}

function MobileMenu({ user }: { user: User | null }) {
  const [open, setOpen] = useState(false)
  const { openModal } = useModal()

  return (
    <Dropdown open={open} onClose={() => setOpen(false)} className="md:hidden">
      <button type="button" aria-label="Menu" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        className="px-2 py-1 text-2xl leading-none">
        ☰
      </button>
      {open && (
        <MenuPanel>
          {user ? (
            <>
              <span className="block border-b-2 border-ink px-4 py-2 text-sm font-bold">{user.name}</span>
              <Link href="/profile" role="menuitem" onClick={() => setOpen(false)} className={MENU_ITEM}>Perfil</Link>
              <button type="button" role="menuitem" onClick={() => { setOpen(false); signOut() }} className={MENU_ITEM}>Sair</button>
            </>
          ) : (
            <button type="button" role="menuitem" className={MENU_ITEM}
              onClick={() => { setOpen(false); openModal('auth') }}>
              Entrar
            </button>
          )}
        </MenuPanel>
      )}
    </Dropdown>
  )
}

const MENU_ITEM = 'block w-full px-4 py-2 text-left text-sm hover:bg-placeholder'

function Dropdown({ open, onClose, className = '', children }:
  { open: boolean; onClose: () => void; className?: string; children: ReactNode }) {
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (open && !event.currentTarget.contains(event.relatedTarget)) onClose()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (open && event.key === 'Escape') onClose()
  }

  return <div className={`relative ${className}`} onBlur={onBlur} onKeyDown={onKeyDown}>{children}</div>
}

function MenuPanel({ children }: { children: ReactNode }) {
  return (
    <div role="menu" className="absolute right-0 z-20 mt-2 min-w-44 border-2 border-ink bg-paper text-ink">
      {children}
    </div>
  )
}
