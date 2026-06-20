import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'

// Audplexus connection status. Audplexus is an admin-facing library-sync
// diagnostics service; when configured, HearthShelf surfaces a "Buy on Audible"
// affordance on catalog results that aren't requestable through RMAB.
//
// The backend integration (a JSON sync-status endpoint + /hs/audplexus proxy)
// is not built yet, so this currently resolves to not-configured. The hook
// exists now so the gate is in place; wiring it later is a one-file change.
interface AudplexusConfig {
  configured: boolean
}

async function getAudplexusConfig(): Promise<AudplexusConfig> {
  const token = useAuthStore.getState().token
  try {
    const res = await fetch('/hs/audplexus/config', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) return { configured: false }
    return (await res.json()) as AudplexusConfig
  } catch {
    return { configured: false }
  }
}

export function useAudplexusEnabled(): boolean {
  const { data } = useQuery({
    queryKey: ['audplexus', 'config'],
    queryFn: getAudplexusConfig,
    staleTime: 5 * 60 * 1000,
  })
  return data?.configured === true
}
