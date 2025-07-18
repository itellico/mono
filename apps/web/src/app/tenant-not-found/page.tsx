/**
 * Tenant Not Found Page
 * 
 * Shown when accessing an unknown tenant domain
 */

export default function TenantNotFoundPage() {
  return (
    <div className="min-h-screen bg-white px-4 py-16 sm:px-6 sm:py-24 md:grid md:place-items-center lg:px-8">
      <div className="mx-auto max-w-max">
        <main className="sm:flex">
          <p className="text-4xl font-bold tracking-tight text-indigo-600 sm:text-5xl">404</p>
          <div className="sm:ml-6">
            <div className="sm:border-l sm:border-gray-200 sm:pl-6">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
                Tenant not found
              </h1>
              <p className="mt-1 text-base text-gray-500">
                The website you're looking for doesn't exist or has been moved.
              </p>
            </div>
            <div className="mt-10 flex space-x-3 sm:border-l sm:border-transparent sm:pl-6">
              <a
                href="https://app.monoplatform.com"
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
              >
                Go to Admin Portal
              </a>
              <a
                href="https://monoplatform.com"
                className="inline-flex items-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
              >
                Visit Main Site
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}