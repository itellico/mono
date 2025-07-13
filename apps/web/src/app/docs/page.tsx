import Link from 'next/link'

export default function DocsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-4">📚 itellico Mono Documentation</h1>
      <p className="text-lg text-gray-600 mb-8">
        Multi-tenant SaaS platform documentation
      </p>

      <div className="space-y-6">
        <section>
          <h2 className="text-2xl font-semibold mb-4">🚀 Getting Started</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/docs/claude" className="text-blue-600 hover:underline">
                📚 CLAUDE.md - Essential development guidelines and workflow rules
              </Link>
            </li>
            <li>
              <Link href="/docs/README" className="text-blue-600 hover:underline">
                🎯 Quick Start Guide - Get up and running in 5 minutes
              </Link>
            </li>
            <li>
              <Link href="/docs/UNIFIED_PROJECT_STATUS" className="text-blue-600 hover:underline">
                📊 Project Status - Current implementation progress (85% complete)
              </Link>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">🏗️ Architecture</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/docs/architecture/README" className="text-blue-600 hover:underline">
                Architecture Overview
              </Link>
            </li>
            <li>
              <Link href="/docs/architecture/4-TIER-API-ARCHITECTURE" className="text-blue-600 hover:underline">
                4-Tier API Architecture
              </Link>
            </li>
            <li>
              <Link href="/docs/architecture/THREE_LAYER_CACHING_STRATEGY" className="text-blue-600 hover:underline">
                Three-Layer Caching Strategy
              </Link>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">⭐ Features</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/docs/features/AUDIT_SYSTEM_GUIDE" className="text-blue-600 hover:underline">
                Audit System Guide
              </Link>
            </li>
            <li>
              <Link href="/docs/features/PERMISSION_SYSTEM_IMPLEMENTATION" className="text-blue-600 hover:underline">
                Permission System
              </Link>
            </li>
            <li>
              <Link href="/docs/features/OPTION_SETS_AND_MODEL_SCHEMAS" className="text-blue-600 hover:underline">
                Option Sets & Model Schemas
              </Link>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">🛠️ Development</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/docs/development/README" className="text-blue-600 hover:underline">
                Development Setup
              </Link>
            </li>
            <li>
              <Link href="/docs/development/DOCKER_SERVICES_GUIDE" className="text-blue-600 hover:underline">
                Docker Services Guide
              </Link>
            </li>
            <li>
              <Link href="/docs/development/COMPONENT_LIBRARY_GUIDE" className="text-blue-600 hover:underline">
                Component Library Guide
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <div className="mt-12 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          📁 All documentation files are available as markdown in the{' '}
          <code className="bg-gray-200 px-1 py-0.5 rounded">/docs</code> folder
        </p>
      </div>
    </div>
  )
}