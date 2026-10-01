import { useState } from 'react'

type Props = {
  url: string | null
  title: string
  width: number
  height: number
  className?: string
}

// Fixed-size cover box: falls back to a placeholder when there is no URL or the image fails to load
export default function Cover({ url, title, width, height, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const style = { width, height }

  if (!url || failed) {
    return (
      <div
        style={style}
        className={`flex shrink-0 items-center justify-center bg-placeholder p-2 text-center text-xs text-subtle ${className}`}
        aria-label={`Sem capa: ${title}`}
      >
        {title}
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={`Capa de ${title}`}
      style={style}
      className={`shrink-0 bg-placeholder object-cover ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  )
}
