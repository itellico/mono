import { notFound } from 'next/navigation';
import { AdminEditLayout } from '@/components/layouts/AdminEditLayout';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ArrowLeft, Tag, Clock, FileText, Code2 } from 'lucide-react';
import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

interface DocumentData {
  title?: string;
  description?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  lastUpdated?: string;
  originalFile?: string;
  tags?: string[];
  content: string;
  category: string;
  slug: string;
}

async function getDocument(category: string, slug: string): Promise<DocumentData | null> {
  const filePath = path.join(
    process.cwd(),
    'mcp-servers/docs-server/src/data',
    category,
    `${slug}.yaml`
  );
  
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const { data, content: markdown } = matter(content);
    return {
      ...data,
      content: markdown,
      category,
      slug
    };
  } catch (error) {
    return null;
  }
}

const priorityColors = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200'
};

export default async function DocumentPage({
  params
}: {
  params: { category: string; slug: string }
}) {
  const doc = await getDocument(params.category, params.slug);
  
  if (!doc) {
    notFound();
  }
  
  return (
    <AdminEditLayout
      title={doc.title}
      breadcrumbs={[
        { label: 'Docs', href: '/admin/docs' },
        { label: params.category, href: `/admin/docs/${params.category}` },
        { label: doc.title }
      ]}
      actions={
        <div className="flex gap-2">
          <Link
            href={`/admin/docs/${params.category}`}
            className="btn btn-outline-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {params.category}
          </Link>
        </div>
      }
    >
      {/* Document Metadata */}
      <Card className="p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">{doc.title}</h1>
            {doc.description && (
              <p className="text-muted-foreground">{doc.description}</p>
            )}
          </div>
          {doc.priority && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${priorityColors[doc.priority]}`}>
              {doc.priority.charAt(0).toUpperCase() + doc.priority.slice(1)} Priority
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4" />
            <span>Category: {params.category}</span>
          </div>
          {doc.lastUpdated && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Updated: {doc.lastUpdated}</span>
            </div>
          )}
          {doc.originalFile && (
            <div className="flex items-center gap-1">
              <Code2 className="w-4 h-4" />
              <span>Source: {doc.originalFile}</span>
            </div>
          )}
        </div>
        
        {doc.tags && doc.tags.length > 0 && (
          <div className="flex items-center gap-2 mt-4">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {doc.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </Card>
      
      {/* Document Content */}
      <Card className="p-8">
        <div className="prose prose-gray max-w-none">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({node, inline, className, children, ...props}) {
                const match = /language-(\w+)/.exec(className || '');
                const language = match ? match[1] : '';
                
                return !inline && match ? (
                  <div className="my-4">
                    {language && (
                      <div className="bg-gray-800 text-gray-400 px-4 py-2 text-xs rounded-t-md">
                        {language}
                      </div>
                    )}
                    <SyntaxHighlighter
                      style={oneDark}
                      language={language}
                      PreTag="div"
                      customStyle={{
                        margin: 0,
                        borderRadius: language ? '0 0 0.375rem 0.375rem' : '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                ) : (
                  <code className={className}>
                    {children}
                  </code>
                )
              },
              // Style tables
              table: ({children}) => (
                <div className="overflow-x-auto my-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    {children}
                  </table>
                </div>
              ),
              thead: ({children}) => (
                <thead className="bg-gray-50">{children}</thead>
              ),
              th: ({children}) => (
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {children}
                </th>
              ),
              td: ({children}) => (
                <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                  {children}
                </td>
              ),
              // Style blockquotes
              blockquote: ({children}) => (
                <blockquote className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 rounded-r">
                  {children}
                </blockquote>
              ),
              // Style headers
              h1: ({children}) => (
                <h1 className="text-3xl font-bold mb-4 mt-8 first:mt-0">{children}</h1>
              ),
              h2: ({children}) => (
                <h2 className="text-2xl font-semibold mb-3 mt-6">{children}</h2>
              ),
              h3: ({children}) => (
                <h3 className="text-xl font-semibold mb-2 mt-4">{children}</h3>
              ),
              // Style lists
              ul: ({children}) => (
                <ul className="list-disc list-inside space-y-1 my-4">{children}</ul>
              ),
              ol: ({children}) => (
                <ol className="list-decimal list-inside space-y-1 my-4">{children}</ol>
              ),
              // Style links
              a: ({href, children}) => (
                <a 
                  href={href} 
                  className="text-blue-600 hover:text-blue-800 underline"
                  target={href?.startsWith('http') ? '_blank' : undefined}
                  rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {children}
                </a>
              )
            }}
          >
            {doc.content}
          </ReactMarkdown>
        </div>
      </Card>
      
      {/* Related Documents */}
      {doc.related && doc.related.length > 0 && (
        <Card className="p-6 mt-6">
          <h3 className="font-semibold mb-4">Related Documentation</h3>
          <div className="grid grid-cols-2 gap-4">
            {doc.related.map((relatedSlug) => (
              <Link
                key={relatedSlug}
                href={`/admin/docs/${params.category}/${relatedSlug}`}
                className="text-blue-600 hover:underline"
              >
                {relatedSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Link>
            ))}
          </div>
        </Card>
      )}
    </AdminEditLayout>
  );
}