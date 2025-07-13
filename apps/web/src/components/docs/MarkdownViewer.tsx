'use client';

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import 'highlight.js/styles/github.css'; // Code highlighting theme

interface TableOfContentsItem {
  level: number;
  text: string;
  id: string;
}

interface DocumentData {
  path: string;
  title: string;
  frontmatter: Record<string, any>;
  content: string;
  toc: TableOfContentsItem[];
  lastModified: string;
}

interface MarkdownViewerProps {
  docPath: string;
  className?: string;
}

export function MarkdownViewer({ docPath, className }: MarkdownViewerProps) {
  const [document, setDocument] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDocument() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/docs/${docPath}`);
        if (!response.ok) {
          throw new Error(`Failed to load document: ${response.statusText}`);
        }
        
        const data = await response.json();
        setDocument(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load document');
      } finally {
        setLoading(false);
      }
    }

    if (docPath) {
      loadDocument();
    }
  }, [docPath]);

  if (loading) {
    return <DocumentSkeleton />;
  }

  if (error) {
    return (
      <Alert className="mx-auto max-w-2xl">
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Document not found</strong>
          <br />
          {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className={`max-w-7xl mx-auto ${className}`}>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Table of Contents */}
        {document.toc.length > 0 && (
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-sm">Table of Contents</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <nav className="space-y-1">
                    {document.toc.map((item, index) => (
                      <a
                        key={index}
                        href={`#${item.id}`}
                        className={`block text-sm hover:text-primary transition-colors ${
                          item.level === 1 ? 'font-medium' :
                          item.level === 2 ? 'ml-4 text-muted-foreground' :
                          'ml-8 text-muted-foreground'
                        }`}
                      >
                        {item.text}
                      </a>
                    ))}
                  </nav>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <div className={document.toc.length > 0 ? 'lg:col-span-3' : 'lg:col-span-4'}>
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{document.title}</CardTitle>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {document.path}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(document.lastModified).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Frontmatter badges */}
                  {document.frontmatter && Object.keys(document.frontmatter).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {document.frontmatter.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary">{tag}</Badge>
                      ))}
                      {document.frontmatter.status && (
                        <Badge variant={
                          document.frontmatter.status === 'complete' ? 'default' :
                          document.frontmatter.status === 'draft' ? 'secondary' : 'outline'
                        }>
                          {document.frontmatter.status}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a 
                      href={`https://github.com/your-repo/edit/main/${document.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Edit
                    </a>
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="prose prose-neutral dark:prose-invert max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  rehypePlugins={[rehypeHighlight, rehypeRaw]}
                  components={{
                    // Custom link component to handle internal links
                    a: ({ href, children, ...props }) => {
                      if (href?.startsWith('/') || href?.startsWith('#')) {
                        return (
                          <Link href={href} {...props}>
                            {children}
                          </Link>
                        );
                      }
                      return (
                        <a 
                          href={href} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          {...props}
                        >
                          {children}
                          <ExternalLink className="inline h-3 w-3 ml-1" />
                        </a>
                      );
                    },
                    // Add IDs to headings for TOC navigation
                    h1: ({ children, ...props }) => (
                      <h1 id={String(children).toLowerCase().replace(/[^\w]+/g, '-')} {...props}>
                        {children}
                      </h1>
                    ),
                    h2: ({ children, ...props }) => (
                      <h2 id={String(children).toLowerCase().replace(/[^\w]+/g, '-')} {...props}>
                        {children}
                      </h2>
                    ),
                    h3: ({ children, ...props }) => (
                      <h3 id={String(children).toLowerCase().replace(/[^\w]+/g, '-')} {...props}>
                        {children}
                      </h3>
                    ),
                    // Enhanced code blocks
                    pre: ({ children, ...props }) => (
                      <pre className="bg-muted p-4 rounded-lg overflow-x-auto" {...props}>
                        {children}
                      </pre>
                    ),
                    // Enhanced tables
                    table: ({ children, ...props }) => (
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse border border-border" {...props}>
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children, ...props }) => (
                      <th className="border border-border bg-muted p-2 text-left font-semibold" {...props}>
                        {children}
                      </th>
                    ),
                    td: ({ children, ...props }) => (
                      <td className="border border-border p-2" {...props}>
                        {children}
                      </td>
                    ),
                  }}
                >
                  {document.content}
                </ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <div className="flex gap-4 mt-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className={`h-4 ${i % 3 === 0 ? 'w-3/4' : 'w-full'}`} />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}