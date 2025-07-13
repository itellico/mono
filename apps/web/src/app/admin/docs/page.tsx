import { Suspense } from 'react';
import { AdminListLayout } from '@/components/layouts/AdminListLayout';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { FileText, Clock, Tag, AlertCircle } from 'lucide-react';

// This would come from your MCP server or file system
const docCategories = [
  {
    name: 'Architecture',
    slug: 'architecture',
    count: 29,
    icon: '🏗️',
    description: 'API design, authentication, caching, state management'
  },
  {
    name: 'Features',
    slug: 'features',
    count: 27,
    icon: '✨',
    description: 'Audit, RBAC, blog, marketplace, messaging systems'
  },
  {
    name: 'Guides',
    slug: 'guides',
    count: 4,
    icon: '📚',
    description: 'Quick start guides, integration patterns'
  },
  {
    name: 'Roadmap',
    slug: 'roadmap',
    count: 5,
    icon: '🗺️',
    description: 'Implementation status and planning'
  }
];

const recentDocs = [
  {
    title: 'Multi-Tenant Inheritance System',
    category: 'architecture',
    updatedAt: '2025-07-08',
    priority: 'critical',
    tags: ['multi-tenancy', 'inheritance', 'hierarchy']
  },
  {
    title: 'Unified Subscription Builder',
    category: 'features',
    updatedAt: '2025-07-08',
    priority: 'high',
    tags: ['subscriptions', 'plans', 'visual-builder']
  },
  {
    title: 'Visual Schema Builder',
    category: 'features',
    updatedAt: '2025-07-08',
    priority: 'high',
    tags: ['schema-builder', 'forms', 'drag-drop']
  }
];

export default function DocsPage() {
  return (
    <AdminListLayout
      title="Documentation Hub"
      description="Platform documentation and guides"
      actions={
        <div className="flex gap-2">
          <Link
            href="http://localhost:3001/docs"
            target="_blank"
            className="btn btn-outline-primary"
          >
            <FileText className="w-4 h-4 mr-2" />
            API Docs
          </Link>
        </div>
      }
    >
      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Docs</p>
              <p className="text-2xl font-bold">92</p>
            </div>
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Categories</p>
              <p className="text-2xl font-bold">13</p>
            </div>
            <Tag className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Updated This Week</p>
              <p className="text-2xl font-bold">5</p>
            </div>
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">High Priority</p>
              <p className="text-2xl font-bold">12</p>
            </div>
            <AlertCircle className="w-8 h-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Categories */}
        <div className="col-span-2">
          <h2 className="text-lg font-semibold mb-4">Documentation Categories</h2>
          <div className="grid grid-cols-2 gap-4">
            {docCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/admin/docs/${category.slug}`}
                className="block"
              >
                <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-2xl">{category.icon}</span>
                    <span className="text-sm text-muted-foreground">
                      {category.count} docs
                    </span>
                  </div>
                  <h3 className="font-semibold mb-1">{category.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {category.description}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Updates */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Updates</h2>
          <div className="space-y-3">
            {recentDocs.map((doc, idx) => (
              <Link
                key={idx}
                href={`/admin/docs/${doc.category}/${doc.title.toLowerCase().replace(/ /g, '-')}`}
                className="block"
              >
                <Card className="p-3 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="font-medium text-sm">{doc.title}</h4>
                    {doc.priority === 'critical' && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {doc.category} • Updated {doc.updatedAt}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {doc.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">Quick Links</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-medium mb-1">Development</h4>
            <ul className="space-y-1">
              <li>
                <Link href="/admin/docs/guides/development-guide-concise" className="text-blue-600 hover:underline">
                  Development Guide
                </Link>
              </li>
              <li>
                <Link href="/admin/docs/architecture/5-tier-api-architecture" className="text-blue-600 hover:underline">
                  API Architecture
                </Link>
              </li>
              <li>
                <Link href="/admin/docs/architecture/multi-tenant-inheritance" className="text-blue-600 hover:underline">
                  Inheritance System
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">Features</h4>
            <ul className="space-y-1">
              <li>
                <Link href="/admin/docs/features/audit-system-guide" className="text-blue-600 hover:underline">
                  Audit System
                </Link>
              </li>
              <li>
                <Link href="/admin/docs/features/rbac-permissions" className="text-blue-600 hover:underline">
                  RBAC & Permissions
                </Link>
              </li>
              <li>
                <Link href="/admin/docs/features/subscription-system" className="text-blue-600 hover:underline">
                  Subscriptions
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-1">External</h4>
            <ul className="space-y-1">
              <li>
                <a href="http://localhost:3001/docs" target="_blank" className="text-blue-600 hover:underline">
                  API Documentation ↗
                </a>
              </li>
              <li>
                <Link href="/dev/components" className="text-blue-600 hover:underline">
                  Component Library
                </Link>
              </li>
              <li>
                <a href="http://localhost:5005" target="_blank" className="text-blue-600 hover:underline">
                  Grafana Dashboard ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminListLayout>
  );
}