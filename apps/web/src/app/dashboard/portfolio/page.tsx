import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { PortfolioGallery } from '@/components/portfolio/PortfolioGallery';

export const metadata: Metadata = {
  title: 'Model Portfolio | mono',
  description: 'Manage your professional modeling portfolio',
};

export default async function ModelPortfolioPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/dashboard/portfolio');
  }

  return (
    <div className="container max-w-7xl mx-auto py-6 px-4">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Model Portfolio</h1>
        <p className="text-muted-foreground mt-2">
          Showcase your professional modeling work with advanced portfolio management
        </p>
      </div>

      {/* Advanced Portfolio Gallery */}
      <PortfolioGallery
        userId={session.user.id}
        showUpload={true}
        showFilters={true}
        showStats={true}
        viewMode="masonry"
        isEditable={true}
        className="space-y-6"
      />
    </div>
  );
} 