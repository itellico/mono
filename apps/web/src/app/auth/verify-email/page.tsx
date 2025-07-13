"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import Link from "next/link";
import { CheckCircle, XCircle, Mail } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token) {
      verifyEmail();
    }
  }, [token]);

  const verifyEmail = async () => {
    try {
      // TODO: Implement email verification with API
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSuccess(true);
      setIsVerifying(false);
      
      // Redirect to signin after success
      setTimeout(() => {
        router.push("/auth/signin");
      }, 3000);
    } catch (err: any) {
      setError(err.message || "Failed to verify email");
      setIsVerifying(false);
    }
  };

  if (!token) {
    return (
      <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Invalid Verification Link
          </CardTitle>
          <CardDescription>
            This email verification link is invalid or has expired
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link href="/auth/register">
            <Button variant="outline">
              Back to registration
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  if (isVerifying) {
    return (
      <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <Icons.spinner className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Verifying your email...</p>
          <p className="text-sm text-muted-foreground">Please wait a moment</p>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            Email Verified Successfully!
          </CardTitle>
          <CardDescription>
            Your email has been verified. You will be redirected to sign in shortly.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link href="/auth/signin">
            <Button>
              Continue to Sign In
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
      <CardHeader className="space-y-4 text-center">
        <div className="flex justify-center">
          <div className="p-3 rounded-full bg-destructive/10">
            <XCircle className="h-8 w-8 text-destructive" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">
          Verification Failed
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <div className="text-center text-sm text-muted-foreground">
          <p>Unable to verify your email address.</p>
          <p>The link may have expired or been used already.</p>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-3">
        <Button className="w-full" variant="outline" asChild>
          <Link href="/auth/register">
            <Mail className="mr-2 h-4 w-4" />
            Request New Verification Email
          </Link>
        </Button>
        
        <Link
          href="/auth/signin"
          className="text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          Back to sign in
        </Link>
      </CardFooter>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <Card className="w-full shadow-lg border-0 bg-card/80 backdrop-blur-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
            </div>
          </CardContent>
        </Card>
      }>
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}