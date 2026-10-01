import { useState } from 'react'

type Props = {
  url: string | null
  title: string
  // Fixed size in px; leave both out to size the cover with className (e.g. responsive tiles)
  width?: number
  height?: number
  className?: string
}

// Cover box: falls back to a placeholder when there is no URL or the image fails to load
export default function Cover({ url, title, width, height, className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const style = width && height ? { width, height } : undefined
  // Thumbnails are too small for readable text: keep the title only in aria-label
  const showTitle = !width || width >= 60

  if (!url || failed) {
    return (
      <div
        role="img"
        style={style}
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-placeholder p-2 text-center text-xs break-words text-subtle ${className}`}
        aria-label={`Sem capa: ${title}`}
      >
        {showTitle && title}
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
