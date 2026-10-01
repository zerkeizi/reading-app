import { createContext, useContext, useState, type ReactNode } from 'react'

export type ModalName = 'auth' | 'addBook'

type ModalContextValue = {
  modal: ModalName | null
  openModal: (name: ModalName) => void
  closeModal: () => void
}

const ModalContext = createContext<ModalContextValue | null>(null)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [modal, setModal] = useState<ModalName | null>(null)

  return (
    <ModalContext.Provider value={{ modal, openModal: setModal, closeModal: () => setModal(null) }}>
      {children}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) throw new Error('useModal must be used inside <ModalProvider>')
  return context
}
