type Props = {
  name: string
  size?: number
  className?: string
}

// Square placeholder avatar with the user's initial
export default function Avatar({ name, size = 32, className = '' }: Props) {
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: size / 2.2 }}
      className={`inline-flex shrink-0 items-center justify-center bg-placeholder font-heading text-ink ${className}`}
    >
      {name.trim().charAt(0).toUpperCase()}
    </span>
  )
}
