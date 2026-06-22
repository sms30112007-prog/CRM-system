import { NextResponse, NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'crm-default-super-secret-key-1234567890'
);

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Paths that do not require auth
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (!token) {
    if (isAuthPage) {
      return NextResponse.next();
    }
    // If not logged in and accessing protected pages, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If token exists, verify it
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const userRole = payload.role as string;

    if (isAuthPage || pathname === '/') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // Role-based route protection
    if (pathname.startsWith('/admin') && userRole !== 'ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  } catch (error) {
    // If JWT verification fails, clear cookie and redirect to login
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
    '/customers/:path*',
    '/leads/:path*',
    '/pipeline/:path*',
    '/tasks/:path*',
    '/admin/:path*',
  ],
};
