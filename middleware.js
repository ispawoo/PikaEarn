import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Protect /admin routes, except /admin/login
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production');
      await jwtVerify(token, secret);
      // Valid token, proceed
      return NextResponse.next();
    } catch (err) {
      // Invalid or expired token
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Also protect API routes (return 401 instead of redirecting)
  if (pathname.startsWith('/api/admin') && pathname !== '/api/admin/login' && pathname !== '/api/admin/logout') {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'super_secret_jwt_key_change_me_in_production');
      await jwtVerify(token, secret);
      return NextResponse.next();
    } catch (err) {
      return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
