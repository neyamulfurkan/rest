// src/middleware.ts

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Allow the request to proceed
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;

        // Protect admin routes
        if (pathname.startsWith('/admin')) {
          // Allow access to login page
          if (pathname === '/admin/login') {
            return true;
          }

          // Check if user has staff role
          const hasStaffRole = 
            token?.role === 'ADMIN' || 
            token?.role === 'KITCHEN' || 
            token?.role === 'WAITER';

          return !!token && hasStaffRole;
        }

        // Allow all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/admin/:path*',
  ],
};