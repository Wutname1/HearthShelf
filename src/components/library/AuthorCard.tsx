import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { tintFor } from '@/components/common/Cover'
import type { ABSLibraryAuthor } from '@/api/types'

export function initialsOf(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (
      (parts[0].match(/[A-Za-z]/)?.[0] ?? '') +
      (parts[parts.length - 1].match(/[A-Za-z]/)?.[0] ?? '')
    ).toUpperCase()
  }
  return (name.match(/[A-Za-z]/g) ?? []).slice(0, 2).join('').toUpperCase()
}

interface AuthorCardProps {
  author: ABSLibraryAuthor
  onOpen: (id: string) => void
}

// Author grid card: real author photo when ABS has one, else a gradient circle
// with initials. Carries data-cv for the cover-glow hover.
export function AuthorCard({ author, onOpen }: AuthorCardProps) {
  const token = useAuthStore((s) => s.token)
  const [imgOk, setImgOk] = useState(Boolean(author.imagePath))
  const cv = tintFor(author.name)
  const params = token ? `?token=${encodeURIComponent(token)}` : ''

  return (
    <div className="author-card" data-cv={cv} onClick={() => onOpen(author.id)}>
      <div
        className="author-av"
        style={{
          background: `linear-gradient(150deg, ${cv}, color-mix(in oklab, ${cv} 45%, #000))`,
          overflow: 'hidden',
        }}
      >
        {imgOk ? (
          <img
            src={`/abs-api/api/authors/${author.id}/image${params}`}
            alt={author.name}
            onError={() => setImgOk(false)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          initialsOf(author.name)
        )}
      </div>
      <div className="author-name">{author.name}</div>
      <div className="author-books">
        {author.numBooks} {author.numBooks === 1 ? 'book' : 'books'}
      </div>
    </div>
  )
}
