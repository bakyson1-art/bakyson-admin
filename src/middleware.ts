import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
  callbacks: {
    async authorized({ token, req }) {
      const { pathname } = req.nextUrl;

      // Login page and root are public (handled by client-side redirect)
      if (pathname === '/login' || pathname === '/') {
        return true;
      }

      // All other routes require a valid session
      return !!token;
    },
  },
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
