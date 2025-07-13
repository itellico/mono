'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, LogOut } from 'lucide-react';
import { browserLogger } from '@/lib/browser-logger';
import { SignoutManager } from '@/lib/auth/signout-manager';
import Link from 'next/link';

/**
 * Sign Out Page Component
 * 
 * @description Shows a confirmation dialog before signing out the user
 */
export default function SignOutPage() {
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      browserLogger.info('User confirmed signout');
      await SignoutManager.signOut({ 
        callbackUrl: '/',
        reason: 'user_initiated'
      });
    } catch (error) {
      browserLogger.error('Signout confirmation error', { error });
      setIsSigningOut(false);
    }
  };

  if (isSigningOut) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing Out
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Please wait while we sign you out...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <LogOut className="h-5 w-5" />
            Sign Out
          </CardTitle>
          <CardDescription>
            Are you sure you want to sign out?
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            You will be signed out of your account and redirected to the home page.
          </p>
        </CardContent>
        <CardFooter className="flex gap-3 justify-center">
          <Button
            variant="outline"
            asChild
          >
            <Link href="/dashboard">
              Cancel
            </Link>
          </Button>
          <Button
            onClick={handleSignOut}
            disabled={isSigningOut}
            variant="destructive"
          >
            {isSigningOut ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="mr-2 h-4 w-4" />
            )}
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 