import { useState } from 'react'
import { ImageOff } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

interface CoverImageProps {
  itemId: string
  alt: string
  className?: string
}

// Cover images flow through the /abs-api proxy. The <img> element can't send an
// Authorization header, so the token rides as a query param per the ABS spec.
export function CoverImage({ itemId, alt, className }: CoverImageProps) {
  const token = useAuthStore((s) => s.token)
  const [failed, setFailed] = useState(false)

  const params = token ? `?token=${encodeURIComponent(token)}` : ''
  const src = `/abs-api/api/items/${itemId}/cover${params}`

  if (failed) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted text-muted-foreground',
          className
        )}
        aria-label={alt}
      >
        <ImageOff className="size-8" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn('object-cover', className)}
    />
  )
}
