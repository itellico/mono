/**
 * Tenant Academy Page
 * 
 * Learning/Academy page for tenant public websites.
 * Accessible at tenant-domain.com/academy
 */

import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

export default async function TenantAcademyPage() {
  // Get tenant information from headers (set by middleware)
  const headersList = headers();
  const tenantId = headersList.get('x-tenant-id');
  const tenantSlug = headersList.get('x-tenant-slug');

  if (!tenantId || !tenantSlug) {
    notFound();
  }

  // TODO: Fetch tenant courses/learning content

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {tenantSlug} Academy
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Enhance your skills with our comprehensive learning programs.
          </p>
        </div>

        {/* Course Categories */}
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {['Beginner', 'Intermediate', 'Advanced'].map((level) => (
              <div key={level} className="flex flex-col">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
                    <span className="text-white text-sm font-bold">
                      {level[0]}
                    </span>
                  </div>
                  {level} Courses
                </dt>
                <dd className="mt-1 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Courses designed for {level.toLowerCase()} level students.
                  </p>
                  <p className="mt-6">
                    <a href={`/academy/${level.toLowerCase()}`} className="text-sm font-semibold leading-6 text-indigo-600">
                      Browse courses <span aria-hidden="true">→</span>
                    </a>
                  </p>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Featured Courses */}
        <div className="mt-32">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            Featured Courses
          </h3>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-gray-200">
                <div className="aspect-[16/9] bg-gray-200" />
                <div className="p-6">
                  <h4 className="text-lg font-semibold text-gray-900">
                    Course Title {i}
                  </h4>
                  <p className="mt-2 text-sm text-gray-600">
                    Learn the fundamentals and advanced concepts in this comprehensive course.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-gray-500">12 lessons</span>
                    <a
                      href={`/academy/course-${i}`}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
                    >
                      Start learning →
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}