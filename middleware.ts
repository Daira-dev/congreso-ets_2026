import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const payload = await verifyToken(token);

  if (!payload) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Si intentan entrar a /admin/usuarios y no son SUPER_ADMIN
  if (request.nextUrl.pathname.startsWith('/admin/usuarios')) {
    if (payload.rol !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
