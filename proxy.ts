import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data } = await supabase.auth.getClaims()
  const isLoggedIn = Boolean(data?.claims)
  const { pathname } = request.nextUrl

  if (!isLoggedIn && pathname.startsWith('/painel')) {
    // Guarda onde ela estava: depois de entrar, volta para a mesma tela.
    const login = new URL('/login', request.url)
    if (pathname !== '/painel' || request.nextUrl.search) {
      login.searchParams.set('voltar', pathname + request.nextUrl.search)
    }
    return NextResponse.redirect(login)
  }

  if (isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/painel', request.url))
  }

  return response
}

export const config = {
  matcher: ['/painel/:path*', '/login'],
}
