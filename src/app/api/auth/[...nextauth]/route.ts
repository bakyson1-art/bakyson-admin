import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.trim().toLowerCase();

        let user;
        try {
          const res = await query(
            'SELECT id, email, password_hash, role FROM users WHERE lower(email) = $1',
            [email]
          );
          user = res.rows[0];
        } catch (error) {
          console.error('[auth] database error during sign-in:', error);
          return null;
        }

        if (!user) {
          console.error('[auth] sign-in failed: no user row for', email);
          return null;
        }

        const isValid = await bcrypt.compare(credentials.password, user.password_hash);
        if (!isValid) {
          console.error('[auth] sign-in failed: password mismatch for', email);
          return null;
        }

        return { id: user.id, email: user.email, role: user.role };
      }
    })
  ],
  session: { strategy: 'jwt' as const },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) token.role = user.role;
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) (session.user as any).role = token.role;
      return session;
    },
  },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
