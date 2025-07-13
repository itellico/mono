/**
 * Tenant Layout
 * 
 * Shared layout for all tenant public pages.
 * Includes tenant-specific navigation and footer.
 */

import { headers } from 'next/headers';
import Link from 'next/link';

export default function TenantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get tenant information from headers
  const headersList = headers();
  const tenantSlug = headersList.get('x-tenant-slug') || 'Tenant';

  return (
    <>
      {/* Tenant Navigation */}
      <nav className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <h1 className="text-xl font-bold text-gray-900">{tenantSlug}</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/tenant/promo"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Home
                </Link>
                <Link
                  href="/tenant/castings"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Castings
                </Link>
                <Link
                  href="/tenant/models"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Models
                </Link>
                <Link
                  href="/tenant/applications"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Applications
                </Link>
                <Link
                  href="/tenant/categories"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Categories
                </Link>
                <Link
                  href="/tenant/tags"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Tags
                </Link>
                <Link
                  href="/tenant/analytics"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Analytics
                </Link>
                <Link
                  href="/tenant/features"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Features
                </Link>
                <Link
                  href="/tenant/industry-templates"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Templates
                </Link>
                <Link
                  href="/tenant/subscriptions/plans"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Plans
                </Link>
                <Link
                  href="/tenant/settings"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Settings
                </Link>
                <Link
                  href="/marketplace"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Marketplace
                </Link>
                <Link
                  href="/tenant/blog"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Blog
                </Link>
                <Link
                  href="/tenant/academy"
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  Academy
                </Link>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <a
                href={`${process.env.NEXT_PUBLIC_ADMIN_DOMAIN || 'https://app.monoplatform.com'}/auth/signin`}
                className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Admin Login
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Tenant Footer */}
      <footer className="bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="/privacy" className="text-gray-400 hover:text-gray-300">
              Privacy
            </a>
            <a href="/terms" className="text-gray-400 hover:text-gray-300">
              Terms
            </a>
            <a href="/contact" className="text-gray-400 hover:text-gray-300">
              Contact
            </a>
          </div>
          <div className="mt-8 md:order-1 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-400">
              &copy; {new Date().getFullYear()} {tenantSlug}. All rights reserved.
              Powered by itellico Mono.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}