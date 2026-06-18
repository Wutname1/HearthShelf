import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/common/Wordmark'

export function LibraryPage() {
  const { user, signOut } = useAuth()
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <Wordmark className="text-4xl" />
      <p className="text-muted-foreground">
        Signed in as {user?.username}. Library grid lands in the next phase.
      </p>
      <Button variant="outline" onClick={signOut}>
        Sign out
      </Button>
    </div>
  )
}
