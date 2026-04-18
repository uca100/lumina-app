'use client'

interface TagBadgeProps {
  tag: string
  onClick?: () => void
}

export function TagBadge({ tag, onClick }: TagBadgeProps) {
  return (
    <span
      onClick={onClick}
      className={`inline-block px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 border border-amber-200 ${onClick ? 'cursor-pointer hover:bg-amber-200 transition-colors' : ''}`}
    >
      {tag}
    </span>
  )
}
