/**
 * Tenant Promo Page (Homepage)
 * 
 * This is the main entry point for tenant public websites.
 * Routes here when accessing tenant domains (e.g., modelagency.com)
 */

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { tenantDomainService } from '@/lib/services/tenant-domain.service';

export default async function TenantPromoPage() {
  // Get tenant information from headers (set by middleware)
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const tenantSlug = headersList.get('x-tenant-slug');
  const domainType = headersList.get('x-tenant-domain-type');

  if (!tenantId || !tenantSlug) {
    notFound();
  }

  // TODO: Fetch tenant-specific promo page data
  // This would typically load from a CMS or database

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Welcome to {tenantSlug}
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              This is a placeholder promo page for tenant: {tenantSlug}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/blog"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Visit Blog
              </a>
              <a
                href="/academy"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Learn More <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Tenant Information
            </h2>
            <dl className="mt-10 space-y-4 text-base leading-7 text-gray-600">
              <div className="flex gap-x-4">
                <dt className="font-semibold text-gray-900">Tenant ID:</dt>
                <dd>{tenantId}</dd>
              </div>
              <div className="flex gap-x-4">
                <dt className="font-semibold text-gray-900">Tenant Slug:</dt>
                <dd>{tenantSlug}</dd>
              </div>
              <div className="flex gap-x-4">
                <dt className="font-semibold text-gray-900">Domain Type:</dt>
                <dd>{domainType}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-indigo-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to get started?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-200">
              This section would contain tenant-specific call-to-action content.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a
                href="/contact"
                className="rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-50"
              >
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}