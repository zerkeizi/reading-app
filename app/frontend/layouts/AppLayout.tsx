import { usePage } from '@inertiajs/react'
import type { ReactNode } from 'react'
import type { SharedProps } from '@/types'
import AddBookButton from '@/components/AddBookButton'
import AddBookModal from '@/components/AddBookModal'
import AuthModal from '@/components/AuthModal'
import Header from '@/components/Header'
import { ModalProvider, useModal } from '@/components/ModalContext'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ModalProvider>
      <Frame>{children}</Frame>
    </ModalProvider>
  )
}

function Frame({ children }: { children: ReactNode }) {
  const { props, flash } = usePage<SharedProps>()
  const { modal } = useModal()

  return (
    <>
      <Header user={props.current_user} />
      {flash.notice && <p role="status">{flash.notice}</p>}
      {flash.alert && <p role="alert">{flash.alert}</p>}

      <main className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8">{children}</main>

      <AddBookButton />
      {modal === 'auth' && <AuthModal />}
      {modal === 'addBook' && <AddBookModal />}
    </>
  )
}
