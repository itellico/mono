import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getTranslations } from '@/lib/translations-mock';

import { CheckCircle2, User, Settings, ArrowRight, AlertTriangle, Camera, ImageIcon } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const t = await getTranslations('dashboard');

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Handle error messages from admin access attempts
  const resolvedSearchParams = await searchParams;
  const errorMessage = resolvedSearchParams.error;
  const getErrorMessage = (error: string | undefined) => {
    switch (error) {
      case 'access_denied':
        return 'Access denied. You do not have admin privileges.';
      case 'permission_error':
        return 'Permission check failed. Please contact support if you should have admin access.';
      case 'insufficient_permissions':
        return 'Insufficient permissions for the requested admin function.';
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Error Message */}
          {errorMessage && getErrorMessage(errorMessage) && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="text-red-800 font-medium">
                    {getErrorMessage(errorMessage)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Welcome Section */}
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {t('welcomeMessage')}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Your profile setup is complete and you&apos;re ready to start your modeling journey. 
              Your application is now under review by our team.
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge className="bg-green-100 text-green-800">Complete</Badge>
                  <p className="text-sm text-gray-600">
                    Your profile has been successfully created and submitted for review.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Application Review</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="secondary">Under Review</Badge>
                  <p className="text-sm text-gray-600">
                    Our team will review your application within 2-5 business days.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Next Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge variant="outline">Pending</Badge>
                  <p className="text-sm text-gray-600">
                    You&apos;ll receive an email once your profile is approved and goes live.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>What You Can Do While You Wait</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mt-0.5">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Review Your Profile</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Make sure all your information is accurate and complete.
                    </p>
                    <Button variant="outline" size="sm">
                      View Profile
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
                    <ImageIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Create COMPCARD</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Build your professional composite card with 6 photos.
                    </p>
                    <Link href="/dashboard/compcard">
                      <Button variant="outline" size="sm">
                        Open Editor
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
                    <Settings className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">shadcn/ui Demo</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Explore the beautiful component library and styling system.
                    </p>
                    <Link href="/demo/shadcn">
                      <Button variant="outline" size="sm">
                        View Components
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Support Section */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800">{t('needHelp')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-700 mb-4">
                {t('helpDescription')}
              </p>
              <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100">
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 