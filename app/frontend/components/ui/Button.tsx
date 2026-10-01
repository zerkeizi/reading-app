import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'inverse'

const VARIANTS: Record<Variant, string> = {
  primary: 'border-2 border-ink bg-ink text-paper hover:bg-muted hover:border-muted',
  secondary: 'border-2 border-ink bg-paper text-ink hover:bg-placeholder',
  inverse: 'border-2 border-paper bg-transparent text-paper hover:bg-paper hover:text-ink',
}

export const buttonClasses = (variant: Variant = 'primary', extra = '') =>
  `inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed ${VARIANTS[variant]} ${extra}`

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }

export default function Button({ variant = 'primary', className = '', type = 'button', ...props }: Props) {
  return <button type={type} className={buttonClasses(variant, className)} {...props} />
}
