import { useForm } from '@inertiajs/react'
import { useState, type FormEvent } from 'react'
import Modal from './Modal'
import { useModal } from './ModalContext'

type Tab = 'signIn' | 'signUp'

export default function AuthModal() {
  const { closeModal } = useModal()
  const [tab, setTab] = useState<Tab>('signIn')

  return (
    <Modal title={tab === 'signIn' ? 'Entrar' : 'Criar conta'} onClose={closeModal}>
      <div role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'signIn'} onClick={() => setTab('signIn')}>
          Entrar
        </button>
        <button type="button" role="tab" aria-selected={tab === 'signUp'} onClick={() => setTab('signUp')}>
          Criar conta
        </button>
      </div>

      {tab === 'signIn' ? <SignInForm onSuccess={closeModal} /> : <SignUpForm onSuccess={closeModal} />}
    </Modal>
  )
}

function SignInForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm({ email_address: '', password: '' })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    form.post('/session', { onSuccess, onFinish: () => form.reset('password') })
  }

  return (
    <form onSubmit={submit}>
      <label>
        E-mail
        <input type="email" autoComplete="username" required
          value={form.data.email_address} onChange={(e) => form.setData('email_address', e.target.value)} />
      </label>
      {form.errors.email_address && <p role="alert">{form.errors.email_address}</p>}

      <label>
        Senha
        <input type="password" autoComplete="current-password" required
          value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
      </label>

      <button type="submit" disabled={form.processing}>Entrar</button>
    </form>
  )
}

function SignUpForm({ onSuccess }: { onSuccess: () => void }) {
  const form = useForm({ name: '', email_address: '', password: '' })

  const submit = (event: FormEvent) => {
    event.preventDefault()
    form.post('/registration', { onSuccess, onFinish: () => form.reset('password') })
  }

  return (
    <form onSubmit={submit}>
      <label>
        Nome
        <input autoComplete="name" required
          value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
      </label>
      {form.errors.name && <p role="alert">{form.errors.name}</p>}

      <label>
        E-mail
        <input type="email" autoComplete="email" required
          value={form.data.email_address} onChange={(e) => form.setData('email_address', e.target.value)} />
      </label>
      {form.errors.email_address && <p role="alert">{form.errors.email_address}</p>}

      <label>
        Senha
        <input type="password" autoComplete="new-password" required
          value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
      </label>
      {form.errors.password && <p role="alert">{form.errors.password}</p>}

      <button type="submit" disabled={form.processing}>Criar conta</button>
    </form>
  )
}
