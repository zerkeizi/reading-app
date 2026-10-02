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
  const { props, flash, component } = usePage<SharedProps>()
  // The floating "+" (add a book) only lives on the home catalog
  const onHome = component === 'books/index'
  const { modal } = useModal()
  
  return (
    <>
      <Header user={props.current_user} />
      {(flash.notice || flash.alert) && (
        <div className={`border-b-2 border-ink ${ flash.notice ? 'bg-accent' : 'text-paper bg-ink'}`}>
          <div className="mx-auto max-w-6xl px-4 py-2 text-sm font-bold md:px-8">
            {flash.notice && <p role="status">{flash.notice}</p>}
            {flash.alert && <p role="alert">{flash.alert}</p>}
          </div>
        </div>
      )}

      {/* On the home, pb-28 leaves room for the fixed 60px "+" button so it never covers the last element */}
      <main className={`mx-auto w-full max-w-6xl px-4 pt-6 md:px-8 ${onHome ? 'pb-28' : 'pb-10'}`}>{children}</main>

      {onHome && <AddBookButton />}
      {modal === 'auth' && <AuthModal />}
      {modal === 'addBook' && <AddBookModal />}
    </>
  )
}
