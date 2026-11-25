import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { findValidResetToken } from '@/lib/password-reset';
import { ResetPasswordForm } from './reset-password-form';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Reset password | Bakyson Admin',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;
  const rawToken = Array.isArray(token) ? token[0] : token;

  let valid = false;
  try {
    valid = Boolean(rawToken && (await findValidResetToken(rawToken)));
  } catch (error) {
    console.error('[reset-password] could not validate token:', error);
  }

  if (!valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset link not valid</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Reset links can only be
              used once.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-3">
            <Link
              href="/forgot-password"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-orange-700"
            >
              Request a new link
            </Link>
            <p className="text-xs text-muted-foreground">
              Or{' '}
              <Link href="/login" className="text-primary font-medium underline">
                back to sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ResetPasswordForm token={rawToken as string} />;
}
