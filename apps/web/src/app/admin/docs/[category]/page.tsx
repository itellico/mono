import { notFound } from 'next/navigation';
import { AdminListLayout } from '@/components/layouts/AdminListLayout';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, FileText, Tag, Clock } from 'lucide-react';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';

async function getDocsForCategory(category: string) {
  const docsPath = path.join(
    process.cwd(),
    'mcp-servers/docs-server/src/data',
    category
  );
  
  try {
    const files = await fs.readdir(docsPath);
    const docs = await Promise.all(
      files
        .filter(file => file.endsWith('.yaml'))
        .map(async (file) => {
          const content = await fs.readFile(path.join(docsPath, file), 'utf8');
          const { data } = matter(content);
          return {
            ...data,
            slug: file.replace('.yaml', ''),
            category
          };
        })
    );
    
    return docs.sort((a, b) => {
      // Sort by priority (critical > high > medium > low), then by title
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority = priorityOrder[a.priority] ?? 4;
      const bPriority = priorityOrder[b.priority] ?? 4;
      
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.title.localeCompare(b.title);
    });
  } catch (error) {
    return [];
  }
}

const categoryMeta = {
  architecture: {
    title: 'Architecture Documentation',
    icon: '🏗️',
    description: 'System design, API patterns, and technical architecture'
  },
  features: {
    title: 'Feature Documentation',
    icon: '✨',
    description: 'Detailed guides for platform features and capabilities'
  },
  guides: {
    title: 'Implementation Guides',
    icon: '📚',
    description: 'Step-by-step guides and tutorials'
  },
  roadmap: {
    title: 'Roadmap & Planning',
    icon: '🗺️',
    description: 'Project status, timelines, and future plans'
  },
  general: {
    title: 'General Documentation',
    icon: '📄',
    description: 'General platform documentation and references'
  },
  testing: {
    title: 'Testing Documentation',
    icon: '🧪',
    description: 'Testing strategies, methodologies, and guides'
  }
};

export default async function CategoryDocsPage({
  params
}: {
  params: { category: string }
}) {
  const docs = await getDocsForCategory(params.category);
  const meta = categoryMeta[params.category];
  
  if (!meta || docs.length === 0) {
    notFound();
  }
  
  const priorityColors = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-gray-100 text-gray-700'
  };
  
  return (
    <AdminListLayout
      title={meta.title}
      description={meta.description}
      actions={
        <Link
          href="/admin/docs"
          className="btn btn-outline-secondary"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Docs
        </Link>
      }
    >
      {/* Category Header */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{meta.icon}</span>
          <div>
            <h2 className="text-lg font-semibold">{params.category}</h2>
            <p className="text-sm text-muted-foreground">
              {docs.length} documents available
            </p>
          </div>
        </div>
      </div>
      
      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={`/admin/docs/${params.category}/${doc.slug}`}
            className="block"
          >
            <Card className="p-4 hover:shadow-lg transition-shadow cursor-pointer h-full">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg pr-2">{doc.title}</h3>
                {doc.priority && (
                  <span className={`text-xs px-2 py-1 rounded ${priorityColors[doc.priority]}`}>
                    {doc.priority}
                  </span>
                )}
              </div>
              
              {doc.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {doc.description}
                </p>
              )}
              
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span>Updated {doc.lastUpdated || 'Unknown'}</span>
                </div>
                
                {doc.tags && doc.tags.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>{doc.tags.length} tags</span>
                  </div>
                )}
              </div>
              
              {doc.tags && doc.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {doc.tags.slice(0, 4).map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {doc.tags.length > 4 && (
                    <span className="text-xs text-muted-foreground">
                      +{doc.tags.length - 4} more
                    </span>
                  )}
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>
    </AdminListLayout>
  );
}