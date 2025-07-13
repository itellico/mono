import fs from 'fs/promises';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Clock, ExternalLink, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface MarkdownViewerSimpleProps {
  docPath: string;
}

async function loadDocument(docPath: string) {
  try {
    // Clean up the path
    const cleanPath = docPath.startsWith('/') ? docPath.slice(1) : docPath;
    
    // Try to read the file
    const fullPath = path.join(process.cwd(), cleanPath);
    const content = await fs.readFile(fullPath, 'utf-8');
    
    // Parse frontmatter
    const { data: frontmatter, content: markdown } = matter(content);
    
    // Extract title
    let title = frontmatter.title;
    if (!title) {
      const titleMatch = markdown.match(/^#\s+(.+)$/m);
      title = titleMatch ? titleMatch[1] : path.basename(docPath, '.md');
    }
    
    return {
      title,
      frontmatter,
      content: markdown,
      path: docPath,
    };
  } catch (error) {
    console.error('Error loading document:', error);
    return null;
  }
}

export async function MarkdownViewerSimple({ docPath }: MarkdownViewerSimpleProps) {
  const document = await loadDocument(docPath);
  
  if (!document) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Document Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              The requested document could not be found.
            </p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href="/docs">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back to Documentation
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{document.title}</CardTitle>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {document.path}
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
            
            <Button variant="outline" size="sm" asChild>
              <Link href="/docs">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Link>
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="prose prose-neutral dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
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
                // Enhanced code blocks
                pre: ({ children, ...props }) => (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto" {...props}>
                    {children}
                  </pre>
                ),
                // Enhanced tables
                table: ({ children, ...props }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="w-full border-collapse" {...props}>
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children, ...props }) => (
                  <th className="border border-border bg-muted px-4 py-2 text-left font-semibold" {...props}>
                    {children}
                  </th>
                ),
                td: ({ children, ...props }) => (
                  <td className="border border-border px-4 py-2" {...props}>
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
  );
}