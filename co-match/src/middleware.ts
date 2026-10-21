import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers }
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  // Si hay usuario autenticado intentando entrar a /dashboard/dependencia
  if (user && url.pathname.startsWith('/dashboard/dependencia')) {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .single()

    console.log(`[Middleware] 👤 Usuario: ${user.email} | Rol detectado: "${profile?.role}" | Error Profile:`, profileError?.message || 'Ninguno')

    // Si la consulta falla o el rol no es autorizado
    const allowedRoles = ['dependencia', 'pat', 'admin']
    if (!profile || !allowedRoles.includes(profile.role)) {
      console.warn(`[Middleware] ⚠️ Acceso denegado a ${url.pathname} para el rol "${profile?.role}". Redirigiendo...`)
      
      if (profile?.role === 'estudiante') {
        url.pathname = '/dashboard/estudiante/explorar'
        return NextResponse.redirect(url)
      }
      
      // Si el perfil no existe aun pero el usuario está autenticado, no redirigir a login para evitar bucles
      if (!profile) {
        console.log("[Middleware] Perfil aún no creado en profiles. Permitiendo paso temporal.")
        return response
      }

      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*'],
}