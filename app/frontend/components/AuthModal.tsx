import { useForm } from '@inertiajs/react'
import { useEffect, useRef, useState, type FormEvent, type InputHTMLAttributes } from 'react'
import Modal from './Modal'
import { useModal } from './ModalContext'
import Button from './ui/Button'

type Tab = 'signIn' | 'signUp'

const TABS: { value: Tab; label: string }[] = [
  { value: 'signIn', label: 'Entrar' },
  { value: 'signUp', label: 'Criar conta' },
]

export default function AuthModal() {
  const { closeModal } = useModal()
  const [tab, setTab] = useState<Tab>('signIn')
  const formRef = useRef<HTMLDivElement>(null)

  // After switching tabs, focus the new form's first field
  useEffect(() => { formRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus() }, [tab])

  return (
    <Modal title={tab === 'signIn' ? 'Entrar' : 'Criar conta'} onClose={closeModal}>
      {/* Segmented switch: the active tab is filled */}
      <div role="tablist" className="mb-5 grid grid-cols-2 border-2 border-ink">
        {TABS.map(({ value, label }) => (
          <button key={value} type="button" role="tab" aria-selected={tab === value} onClick={() => setTab(value)}
            className={`py-2 text-sm font-bold ${tab === value ? 'bg-ink text-paper' : 'bg-paper text-ink hover:bg-placeholder'}`}>
            {label}
          </button>
        ))}
      </div>

      <div ref={formRef}>
        {tab === 'signIn' ? <SignInForm onSuccess={closeModal} /> : <SignUpForm onSuccess={closeModal} />}
      </div>
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
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="E-mail" error={form.errors.email_address} type="email" autoComplete="username" required data-autofocus
        value={form.data.email_address} onChange={(e) => form.setData('email_address', e.target.value)} />
      <Field label="Senha" type="password" autoComplete="current-password" required
        value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
      <Button type="submit" disabled={form.processing} className="mt-1 w-full py-3">Entrar</Button>
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
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field label="Nome" error={form.errors.name} autoComplete="name" required data-autofocus
        value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} />
      <Field label="E-mail" error={form.errors.email_address} type="email" autoComplete="email" required
        value={form.data.email_address} onChange={(e) => form.setData('email_address', e.target.value)} />
      <Field label="Senha" error={form.errors.password} type="password" autoComplete="new-password" required
        value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} />
      <Button type="submit" disabled={form.processing} className="mt-1 w-full py-3">Criar conta</Button>
    </form>
  )
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  // Inertia is configured with withAllErrors, so a field can have several messages
  error?: string | string[]
}

function Field({ label, error, ...input }: FieldProps) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-bold">{label}</span>
      <input {...input} aria-invalid={error ? true : undefined} className="border-2 border-ink px-3 py-2" />
      {[error ?? []].flat().map((message) => <span key={message} role="alert" className="text-sm">{message}</span>)}
    </label>
  )
}
