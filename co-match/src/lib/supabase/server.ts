import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createFallbackSupabaseClient, getSupabaseConfig } from '@/lib/supabase/config'

export async function createClient() {
  const cookieStore = await cookies()
  const { isConfigured, url, publishableKey } = getSupabaseConfig()

  if (!isConfigured || !url || !publishableKey) {
    return createFallbackSupabaseClient()
  }

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}