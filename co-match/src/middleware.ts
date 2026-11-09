import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseConfig } from '@/lib/supabase/config'
import { dashboardRedirectFor } from '@/lib/auth-roles'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers }
  })

  const { isConfigured, url: supabaseUrl, publishableKey } = getSupabaseConfig()

  if (!isConfigured || !supabaseUrl || !publishableKey) {
    return response
  }

  const supabase = createServerClient(
    supabaseUrl,
    publishableKey,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  const url = request.nextUrl.clone()

  // Si no hay usuario y quiere entrar a rutas protegidas
  if (!user && url.pathname.startsWith('/dashboard')) {
    console.log(`[Middleware] ❌ Usuario no autenticado intentando acceder a: ${url.pathname}`)
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  // Usuario autenticado: verificar que su rol corresponda a la sección
  if (user && (url.pathname.startsWith('/dashboard/dependencia') || url.pathname.startsWith('/dashboard/estudiante'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    // Si el perfil aún no existe se usa el rol de la metadata del registro
    const role = profile?.role ?? user.user_metadata?.role
    const target = dashboardRedirectFor(url.pathname, role)

    if (target) {
      console.warn(`[Middleware] Rol "${role}" no puede entrar a ${url.pathname}. Redirigiendo a ${target}`)
      url.pathname = target
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}