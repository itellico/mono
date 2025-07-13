/**
 * Tenant Blog Page
 * 
 * Blog listing page for tenant public websites.
 * Accessible at tenant-domain.com/blog
 */

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function TenantBlogPage() {
  // Get tenant information from headers (set by middleware)
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const tenantSlug = headersList.get('x-tenant-slug');

  if (!tenantId || !tenantSlug) {
    notFound();
  }

  // TODO: Fetch tenant blog posts using TanStack Query on client side
  // For now, showing placeholder content

  return (
    <div className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {tenantSlug} Blog
          </h2>
          <p className="mt-2 text-lg leading-8 text-gray-600">
            Learn from our expert insights and industry knowledge.
          </p>
        </div>
        
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {/* Blog post cards would go here */}
          {[1, 2, 3].map((i) => (
            <article key={i} className="flex flex-col items-start justify-between">
              <div className="relative w-full">
                <div className="aspect-[16/9] w-full rounded-2xl bg-gray-200" />
              </div>
              <div className="max-w-xl">
                <div className="mt-8 flex items-center gap-x-4 text-xs">
                  <time className="text-gray-500">Mar {i}, 2024</time>
                  <span className="relative z-10 rounded-full bg-gray-50 px-3 py-1.5 font-medium text-gray-600">
                    Category
                  </span>
                </div>
                <div className="group relative">
                  <h3 className="mt-3 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
                    <a href={`/blog/post-${i}`}>
                      <span className="absolute inset-0" />
                      Blog Post Title {i}
                    </a>
                  </h3>
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-600">
                    This is a placeholder blog post description for tenant {tenantSlug}. 
                    Real content would be loaded from the database.
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}