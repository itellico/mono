"use client";

import { useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { useTranslations } from '@/lib/translations-mock';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";
import { browserLogger } from "@/lib/browser-logger";

interface LoginFormContentProps {
  callbackUrl: string;
}

function LoginFormContent({ callbackUrl }: LoginFormContentProps) {
  const router = useRouter();
  const { login } = useAuth();
  const t = useTranslations('auth');

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleCredentialsSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      browserLogger.info('Starting credentials sign-in', { callbackUrl });
      
      await login(formData.email, formData.password, callbackUrl);
      
      browserLogger.info('Sign-in successful, redirecting to callback URL', { callbackUrl });
      router.push(callbackUrl || '/admin');
    } catch (err: any) {
      const errorMessage = err?.message || err?.toString() || t('invalidCredentials');
      setError(errorMessage);
      
      console.error('Login error details:', err);
      
      browserLogger.error("Sign-in error", { 
        error: errorMessage, 
        errorType: err?.constructor?.name || 'Unknown',
        stack: err?.stack,
        name: err?.name,
        provider: 'credentials',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthSignIn = async (provider: string) => {
    if (provider === "google") {
      setIsGoogleLoading(true);
    }

    try {
      setError("OAuth authentication is being migrated. Please use email sign-in.");
    } catch (err) {
      setError(t('errors.oauthError', { provider }));
      browserLogger.error(`${provider} sign-in error`, { 
        error: err instanceof Error ? err.message : String(err), 
        provider 
      });
    } finally {
      if (provider === "google") {
        setIsGoogleLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Full screen banner */}
      <div className="hidden lg:flex lg:w-1/3 relative">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url(/mono.jpg)' }}
        />
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 flex items-end p-12">
          <div className="text-white">
            <h1 className="text-4xl font-bold mb-4">itellico Mono</h1>
            <p className="text-lg opacity-90">Multi-tenant SaaS Platform</p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 lg:w-2/3 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-muted">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile header - only shown on small screens */}
          <div className="text-center lg:hidden">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
              itellico Mono
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Multi-tenant SaaS Platform
            </p>
          </div>
          
          <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              {t('welcomeBack')}
            </CardTitle>
            <CardDescription className="text-center">
              {t('signInToAccount')}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* OAuth Providers */}
            <div className="space-y-3">
              <Button
                variant="outline"
                type="button"
                disabled={isGoogleLoading || isLoading}
                onClick={() => handleOAuthSignIn("google")}
                className="w-full"
              >
                {isGoogleLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Icons.google className="mr-2 h-4 w-4" />
                )}
                {t('continueWithGoogle')}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  {t('orContinueWithEmail')}
                </span>
              </div>
            </div>

            {/* Credentials Form */}
            <form onSubmit={handleCredentialsSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                  disabled={isLoading || isGoogleLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">{t('password')}</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={t('passwordPlaceholder')}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  disabled={isLoading || isGoogleLoading}
                />
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full"
              >
                {isLoading ? (
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                {t('signIn')}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3">
            <div className="text-sm text-center text-muted-foreground">
              {t('dontHaveAccount')}{" "}
              <Link
                href="/auth/register"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                {t('signUp')}
              </Link>
            </div>
          </CardFooter>
        </Card>
        </div>
      </div>
    </div>
  );
}

interface LoginFormProps {
  callbackUrl?: string;
}

export function LoginForm({ callbackUrl = "/" }: LoginFormProps) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex">
        {/* Left side - Full screen banner */}
        <div className="hidden lg:flex lg:w-1/3 relative">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: 'url(/mono.jpg)' }}
          />
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10 flex items-end p-12">
            <div className="text-white">
              <h1 className="text-4xl font-bold mb-4">itellico Mono</h1>
              <p className="text-lg opacity-90">Multi-tenant SaaS Platform</p>
            </div>
          </div>
        </div>

        {/* Right side - Loading */}
        <div className="flex-1 lg:w-2/3 flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-br from-background to-muted">
          <div className="w-full max-w-md space-y-8">
            <div className="text-center lg:hidden">
              <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">
                itellico Mono
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Multi-tenant SaaS Platform
              </p>
            </div>
            <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    }>
      <LoginFormContent callbackUrl={callbackUrl} />
    </Suspense>
  );
}