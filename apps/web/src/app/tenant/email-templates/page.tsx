import { Suspense } from 'react';
import { LoadingState } from '@/components/ui/loading-state';
import { EmailTemplatesClientPage } from '@/components/tenant/email-templates/EmailTemplatesClientPage';

export default function EmailTemplatesPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingState />}>
        <EmailTemplatesClientPage />
      </Suspense>
    </div>
  );
}