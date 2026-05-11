import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isPublicRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/cron') ||
    pathname === '/favicon.ico'

  if (isPublicRoute) return NextResponse.next()

  // Llegir cookie de sessió de Supabase directament
  // Supabase guarda la sessió en cookies amb prefix sb-
  const cookies = request.cookies.getAll()
  const sessionCookie = cookies.find(c =>
    c.name.includes('-auth-token') || c.name.startsWith('sb-')
  )

  if (!sessionCookie) {
    const url = new URL('/login', request.url)
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/cron).*)'],
}
