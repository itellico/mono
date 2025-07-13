import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldAlert, ArrowLeft, Mail } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/lib/auth';

/**
 * Unauthorized Access Page
 * 
 * Displayed when users try to access admin areas without proper permissions
 */

export default async function UnauthorizedPage() {
  const session = await auth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md border-destructive/20 shadow-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-destructive/10">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">
            Access Denied
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-muted-foreground">
              You don&apos;t have permission to access the admin panel.
            </p>
            
            {session?.user?.email && (
              <p className="text-sm text-muted-foreground">
                Signed in as: <span className="font-medium">{session.user.email}</span>
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg text-left">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Need Admin Access?
              </h3>
              <p className="text-sm text-muted-foreground">
                Contact your system administrator to request admin permissions.
                Include your email address and reason for needing access.
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Return to Home
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link href="/dashboard">
                  Go to Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 