import { useNavigate, useRouteError, isRouteErrorResponse } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import hearthBg from '@/assets/img/SittingInTheHearth.webp'

export function ErrorPage() {
  const navigate = useNavigate()
  const error = useRouteError()

  const isNotFound = isRouteErrorResponse(error) && error.status === 404
  const code = isRouteErrorResponse(error) ? error.status : 500
  const message = isNotFound
    ? 'This shelf is empty. The page you\'re looking for doesn\'t exist or has been moved.'
    : 'Something went wrong. An unexpected error occurred while loading this page.'

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${hearthBg})` }}
      />
      <div className="absolute inset-0 bg-black/60" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center px-6">
        <p className="text-7xl font-bold text-[var(--brand-hearth)] leading-none">{code}</p>
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-[var(--brand-shelf)]">
            {isNotFound ? 'Page not found' : 'Something went wrong'}
          </h1>
          <p className="text-sm text-white/60 max-w-xs">{message}</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => navigate('/')}>Go home</Button>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}
