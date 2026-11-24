'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState<'email' | 'sent'>('email');
  const router = useRouter();

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset code');
      }

      // Redirect to reset password page with email pre-filled
      router.push(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset code');
    } finally {
      setIsLoading(false);
    }
  }

  if (stage === 'sent') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Check your email</CardTitle>
            <CardDescription>
              A one-time code has been sent to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <p className="mt-4 text-sm">{message}</p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center text-xs font-medium text-primary underline-offset-4 hover:underline"
            >
              ← Back to sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Forgot password?</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a one-time code to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email">Email address</Label>
              </div>
              <Input id="email" name="email" type="email" placeholder="you@company.com" required />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Sending...' : 'Send reset code'}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground text-center mt-4">
            Remember your password?{' '}
            <Link href="/login" className="text-primary font-medium underline">
              Sign in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
