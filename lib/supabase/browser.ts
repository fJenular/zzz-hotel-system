import { createBrowserClient } from '@supabase/ssr'

// Singleton pattern - hanya dibuat sekali
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null

export function createBrowserSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return supabaseInstance
}

/**
 * Gets the current authenticated user client-side.
 * Falls back to local session if getUser fails due to network/offline status.
 */
export async function getBrowserUser(supabase: any) {
  try {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (user) return user
  } catch (e) {
    // Fail silently, proceed to check session
  }

  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.user || null
  } catch (e) {
    return null
  }
}