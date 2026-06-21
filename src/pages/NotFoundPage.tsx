import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import hearthBg from '@/assets/img/SittingInTheHearth.webp'

export function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${hearthBg})` }}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6">
        <p className="text-7xl font-bold text-[var(--brand-hearth)] leading-none">404</p>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--brand-shelf)]">Page not found</h1>
          <p className="text-sm text-white/60 max-w-xs">
            This shelf is empty. The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/')}>Go home</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go back
          </Button>
        </div>
      </div>
    </div>
  )
}
