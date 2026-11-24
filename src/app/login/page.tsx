'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (!result || result.error) {
        const code = result?.error;
        const message =
          !code || code === 'CredentialsSignin'
            ? 'Invalid email or password'
            : `Sign-in failed on the server (${code}). Check the deployment logs.`;
        throw new Error(message);
      }

      router.push(result.url ?? '/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Bakyson Admin</CardTitle>
          <CardDescription>
            Sign in to manage your website and business operations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-800 text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email">Email address</Label>
              </div>
              <Input id="email" name="email" type="email" placeholder="you@company.com" required />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="text-center space-y-2">
            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Forgot password?
            </Link>
            <p className="text-xs text-muted-foreground">
              Only admin and employee accounts can access the admin dashboard.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
