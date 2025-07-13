'use client'

import { useEffect, useState } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface TocItem {
  id: string
  title: string
  level: number
}

interface TableOfContentsProps {
  content: string
  className?: string
}

export function TableOfContents({ content, className }: TableOfContentsProps) {
  const [toc, setToc] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    // Extract headings from markdown content
    const headingRegex = /^(#{1,6})\s+(.+)$/gm
    const headings: TocItem[] = []
    const seenIds = new Set<string>()
    let match

    while ((match = headingRegex.exec(content)) !== null) {
      const level = match[1].length
      const title = match[2].trim()
      let id = title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()

      // Ensure unique IDs
      if (seenIds.has(id)) {
        let counter = 1
        while (seenIds.has(`${id}-${counter}`)) {
          counter++
        }
        id = `${id}-${counter}`
      }
      seenIds.add(id)

      headings.push({ id, title, level })
    }

    setToc(headings)
  }, [content])

  useEffect(() => {
    // Track active heading based on scroll position
    const handleScroll = () => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const scrollTop = window.scrollY

      for (let i = headings.length - 1; i >= 0; i--) {
        const heading = headings[i] as HTMLElement
        const offsetTop = heading.offsetTop - 100 // Offset for better UX

        if (scrollTop >= offsetTop) {
          const id = heading.textContent
            ?.toLowerCase()
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim()
          
          if (id) {
            setActiveId(id)
          }
          break
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Initial call

    return () => window.removeEventListener('scroll', handleScroll)
  }, [toc])

  const scrollToHeading = (id: string) => {
    const element = document.querySelector(`h1, h2, h3, h4, h5, h6`)
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
    
    const targetHeading = headings.find(heading => {
      const headingId = heading.textContent
        ?.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim()
      return headingId === id
    })

    if (targetHeading) {
      targetHeading.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  if (toc.length === 0) {
    return null
  }

  return (
    <div className={cn('w-64 border-l bg-background', className)}>
      <div className="p-4">
        <h3 className="text-sm font-semibold mb-3">📑 Table of Contents</h3>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <nav className="space-y-1">
            {toc.map((item, index) => (
              <button
                key={`${item.id}-${index}`}
                onClick={() => scrollToHeading(item.id)}
                className={cn(
                  'block w-full text-left text-sm py-1 px-2 rounded hover:bg-accent hover:text-accent-foreground transition-colors',
                  `ml-${(item.level - 1) * 3}`,
                  activeId === item.id && 'bg-accent text-accent-foreground font-medium'
                )}
                style={{ 
                  marginLeft: `${(item.level - 1) * 12}px`,
                  fontSize: item.level === 1 ? '0.875rem' : '0.8rem'
                }}
              >
                {item.title}
              </button>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </div>
  )
}