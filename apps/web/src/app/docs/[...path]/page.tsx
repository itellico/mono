import { notFound } from 'next/navigation'
import { promises as fs } from 'fs'
import path from 'path'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface DocPageProps {
  params: Promise<{
    path?: string[]
  }>
}

export default async function DocPage({ params }: DocPageProps) {
  const resolvedParams = await params;
  
  // Handle special case for CLAUDE.md
  if (resolvedParams.path && resolvedParams.path.length === 1 && resolvedParams.path[0] === 'claude') {
    try {
      const claudePath = path.join(process.cwd(), 'CLAUDE.md')
      const content = await fs.readFile(claudePath, 'utf8')
      
      return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {content}
            </ReactMarkdown>
          </div>
        </div>
      )
    } catch {
      notFound()
    }
  }

  // Handle regular docs
  if (!resolvedParams.path) {
    notFound()
  }

  const docPath = resolvedParams.path.join('/')
  
  let content: string
  let isHtml = false
  
  try {
    // First try to read as markdown
    const mdFilePath = path.join(process.cwd(), 'docs', `${docPath}.md`)
    content = await fs.readFile(mdFilePath, 'utf8')
  } catch {
    try {
      // Then try as HTML file
      const htmlFilePath = path.join(process.cwd(), 'docs', `${docPath}.html`)
      content = await fs.readFile(htmlFilePath, 'utf8')
      isHtml = true
    } catch {
      // Try without extension
      try {
        const altFilePath = path.join(process.cwd(), 'docs', docPath)
        content = await fs.readFile(altFilePath, 'utf8')
        // Check if it's HTML based on content
        isHtml = content.trim().startsWith('<!DOCTYPE html') || content.trim().startsWith('<html')
      } catch {
        notFound()
      }
    }
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-lg dark:prose-invert max-w-none">
        {isHtml ? (
          <div dangerouslySetInnerHTML={{ __html: content }} />
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}