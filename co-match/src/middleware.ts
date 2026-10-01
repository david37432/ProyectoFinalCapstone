import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  const isAuthRoute = pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api')
  const isStaticAsset = pathname.startsWith('/_next') || pathname.startsWith('/favicon.ico')

  const isAuthNoRedirectRoute = pathname === '/auth/login' || pathname === '/auth/register'

  const isAuthExceptionRoute = pathname === '/auth/reset-password' || pathname === '/auth/callback'

  if (isApiRoute || isStaticAsset) {
    return supabaseResponse
  }

  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    return NextResponse.redirect(url)
  }

  if (isAuthExceptionRoute) {
    return supabaseResponse
  }

  if (user) {
    if (isAuthNoRedirectRoute) {
      return supabaseResponse
    }

    let profile: { role: string; is_active?: boolean } | null = null;
    let profileError: Error | null = null;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, is_active')
        .eq('id', user.id)
        .maybeSingle();
      profileError = error;
      if (data) {
        profile = {
          role: data.role ?? 'estudiante',
          is_active: data.is_active ?? true,
        };
      }
    } catch (err) {
      profileError = err as Error;
    }

    if (profileError || !profile) {
      return supabaseResponse;
    }

    if (profile.is_active === false) {
      await supabase.auth.signOut()
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      return NextResponse.redirect(url)
    }

    if (isAuthRoute) {
      const url = request.nextUrl.clone()
      if (profile.role === 'estudiante') {
        url.pathname = '/dashboard/estudiante/explorar'
      } else {
        url.pathname = '/dashboard/dependencia'
      }
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}