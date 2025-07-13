import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { getTranslations } from 'next-intl/server';

export default async function OnboardingPage() {
  const session = await auth();
  const t = await getTranslations();

  if (!session?.user) {
    redirect('/auth/signin');
  }

  // Check if user has already completed onboarding
  // This would typically check a database flag
  // For now, we'll assume they haven't completed it

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            {t('onboarding.welcome')}
          </h1>
          <p className="text-lg text-muted-foreground">
            {t('onboarding.setupProfile')}
          </p>
        </div>

        <OnboardingFlow user={session.user} />
      </div>
    </div>
  );
} 