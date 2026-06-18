import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  className?: string
  label?: string
}

export function LoadingSpinner({ className, label }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center gap-2 text-muted-foreground',
        className
      )}
      role="status"
    >
      <Loader2 className="size-5 animate-spin" />
      {label && <span className="text-sm">{label}</span>}
    </div>
  )
}
