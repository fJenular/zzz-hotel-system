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