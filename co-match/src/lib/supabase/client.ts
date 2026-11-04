import { createBrowserClient } from '@supabase/ssr'
import { createFallbackSupabaseClient, getSupabaseConfig } from '@/lib/supabase/config'

export function createClient() {
  const { isConfigured, url, publishableKey } = getSupabaseConfig()

  if (!isConfigured || !url || !publishableKey) {
    return createFallbackSupabaseClient()
  }

  return createBrowserClient(url, publishableKey)
}