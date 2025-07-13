import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import { ModelProfileBuilder } from '@/components/profile/ModelProfileBuilder';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Settings, Shield, Award } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { browserLogger } from '@/lib/browser-logger';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: `${t('profile.title')} | mono`,
    description: t('profile.metadata.description'),
  };
}

interface ProfilePageProps {
  searchParams: Promise<{
    tab?: string;
    wizard?: string;
    userId?: string;
  }>;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const t = await getTranslations();
  const session = await auth();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  const params = await searchParams;
  const activeTab = params.tab || 'overview';
  const showWizard = params.wizard === 'true';
  const userId = params.userId; // For admins viewing other profiles

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('profile.title')}</h1>
          <p className="text-muted-foreground">
            {t('profile.subtitle')}
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {showWizard && (
            <Button variant="outline" asChild>
              <a href="/dashboard/profile">
                {t('profile.buttons.exitWizard')}
              </a>
            </Button>
          )}

          {!showWizard && (
            <Button asChild>
              <a href="/dashboard/profile?wizard=true">
                {t('profile.buttons.setupWizard')}
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats Cards */}
      {!showWizard && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.stats.profile')}</p>
                  <p className="text-xl font-semibold">85%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.stats.verified')}</p>
                  <Badge variant="secondary" className="text-xs">
                    {t('profile.stats.verificationSteps', { current: 3, total: 4 })}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.stats.portfolio')}</p>
                  <p className="text-xl font-semibold">12</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Settings className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">{t('profile.stats.bookings')}</p>
                  <Badge variant="default" className="text-xs">
                    {t('profile.stats.available')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Profile Builder Component */}
      <ModelProfileBuilder
        userId={userId}
        className="space-y-6"
        showWizard={showWizard}
        defaultTab={activeTab}
        onProfileUpdate={(profile) => {
          browserLogger.info('Profile updated on client', { profile });
        }}
      />

      {/* Help & Support Section */}
      {!showWizard && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>{t('profile.help.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <h3 className="font-medium mb-2">{t('profile.help.optimization.title')}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('profile.help.optimization.description')}
                </p>
                <Button variant="outline" size="sm">
                  {t('profile.help.buttons.viewGuide')}
                </Button>
              </div>

              <div className="text-center">
                <h3 className="font-medium mb-2">{t('profile.help.verification.title')}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('profile.help.verification.description')}
                </p>
                <Button variant="outline" size="sm">
                  {t('profile.help.buttons.learnMore')}
                </Button>
              </div>

              <div className="text-center">
                <h3 className="font-medium mb-2">{t('profile.help.portfolio.title')}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('profile.help.portfolio.description')}
                </p>
                <Button variant="outline" size="sm">
                  {t('profile.help.buttons.getTips')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 