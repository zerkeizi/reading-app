import type { ButtonHTMLAttributes } from 'react'

// primary: blue highlight (always with ink text) · secondary: outlined · dark: ink fill with cream text
type Variant = 'primary' | 'secondary' | 'dark'

const VARIANTS: Record<Variant, string> = {
  primary: 'border-2 border-ink bg-accent text-ink hover:brightness-95',
  secondary: 'border-2 border-ink bg-transparent text-ink hover:bg-placeholder',
  dark: 'border-2 border-ink bg-ink text-paper hover:bg-muted',
}

export const buttonClasses = (variant: Variant = 'primary', extra = '') =>
  `inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${extra}`

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export default function Button({ variant = 'primary', className = '', type = 'button', ...props }: Props) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />
}
