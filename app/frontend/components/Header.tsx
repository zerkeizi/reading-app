import { Link, router } from '@inertiajs/react'
import { useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react'
import type { User } from '@/types'
import { useModal } from './ModalContext'
import Avatar from './ui/Avatar'
import Button from './ui/Button'
import { DROPDOWN_ITEM, DROPDOWN_PANEL, TRIGGER_OPEN } from './ui/dropdown'

// Cream bar with a 3px bottom border on every page: logo on the left; "Entrar" or the account menu on
// the right, on every screen size (the design has no hamburger menu).
export default function Header({ user }: { user: User | null }) {
  return (
    <header className="border-b-[3px] border-ink bg-paper">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8 md:py-3.5">
        <Link href="/" className="flex min-w-0 items-center gap-2.5 font-heading text-[15px] whitespace-nowrap md:gap-4">
          <span aria-hidden="true" className="size-[30px] shrink-0 border-2 border-ink md:size-[34px]" />
          Catálogo coletivo
        </Link>

        {user ? <AccountMenu user={user} /> : <SignInButton />}
      </div>
    </header>
  )
}

function SignInButton() {
  const { openModal } = useModal()
  return <Button onClick={() => openModal('auth')} className="py-1.5 text-base">Entrar</Button>
}

const signOut = () => router.delete('/session')

// "{name} ▾": dropdown with Perfil / Sair; closes on Esc or when focus leaves it
function AccountMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false)

  return (
    <Dropdown open={open} onClose={() => setOpen(false)}>
      <button type="button" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}
        className={`flex min-w-0 items-center gap-1.5 px-1 py-1 text-sm whitespace-nowrap md:gap-2 md:text-base ${
          open ? TRIGGER_OPEN : 'hover:underline'}`}>
        <Avatar name={user.name} size={28} />
        <span className="truncate">{user.name}</span> <span aria-hidden="true">{open ? '▴' : '▾'}</span>
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

const MENU_ITEM = `${DROPDOWN_ITEM} hover:bg-accent focus-visible:bg-accent focus-visible:outline-none`

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
    <div role="menu" className={`${DROPDOWN_PANEL} mt-2`}>
      {children}
    </div>
  )
}
