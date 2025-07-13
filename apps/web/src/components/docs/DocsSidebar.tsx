'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Rocket, 
  Database, 
  Star, 
  Wrench, 
  BarChart,
  Settings,
  Shield,
  BookOpen,
  Zap,
  Users
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  title: string
  href: string
  icon?: React.ComponentType<{ className?: string }>
  badge?: string
  items?: NavItem[]
}

const navigationItems: NavItem[] = [
  {
    title: '🎯 Essential Information',
    href: '#',
    items: [
      {
        title: 'CLAUDE.md - Central Hub',
        href: '/docs/CLAUDE',
        icon: Rocket,
        badge: 'START HERE'
      },
      {
        title: 'Unified Project Status',
        href: '/docs/UNIFIED_PROJECT_STATUS',
        icon: BarChart,
        badge: '85% DONE'
      },
    ]
  },
  {
    title: '🚀 Getting Started',
    href: '#',
    items: [
      {
        title: 'Audit Quick Start',
        href: '/docs/getting-started/AUDIT_QUICK_START',
        icon: Zap
      },
      {
        title: 'For New Developers',
        href: '/docs/for-new-developers/README',
        icon: Users
      },
    ]
  },
  {
    title: '🏗️ Architecture',
    href: '#',
    items: [
      {
        title: 'Architecture Overview',
        href: '/docs/architecture/README',
        icon: Database
      },
      {
        title: 'Complete Platform Specification',
        href: '/docs/architecture/MONO_PLATFORM_COMPLETE_SPECIFICATION',
        icon: FileText
      },
      {
        title: 'Three-Layer Caching Strategy',
        href: '/docs/architecture/THREE_LAYER_CACHING_STRATEGY',
        icon: Database
      },
      {
        title: 'Authentication Best Practices',
        href: '/docs/architecture/AUTHENTICATION_BEST_PRACTICES',
        icon: Shield
      },
      {
        title: 'User Display Preferences',
        href: '/docs/architecture/USER_DISPLAY_PREFERENCES',
        icon: Settings
      },
      {
        title: 'UUID Best Practices',
        href: '/docs/architecture/UUID_BEST_PRACTICES',
        icon: Settings
      },
      {
        title: 'Temporal Integration',
        href: '/docs/architecture/TEMPORAL_INTEGRATION',
        icon: Database
      },
      {
        title: 'Workflows Comprehensive Guide',
        href: '/docs/architecture/WORKFLOWS_COMPREHENSIVE_GUIDE',
        icon: Wrench
      }
    ]
  },
  {
    title: '⭐ Features',
    href: '#',
    items: [
      {
        title: 'Audit System Guide',
        href: '/docs/features/AUDIT_SYSTEM_GUIDE',
        icon: Shield,
        badge: 'COMPLETE'
      },
      {
        title: 'Permission System',
        href: '/docs/features/PERMISSION_SYSTEM_IMPLEMENTATION',
        icon: Shield
      },
      {
        title: 'Option Sets & Model Schemas',
        href: '/docs/features/OPTION_SETS_AND_MODEL_SCHEMAS',
        icon: Database
      },
      {
        title: 'Subscription System Seeder',
        href: '/docs/features/SUBSCRIPTION_SYSTEM_SEEDER',
        icon: Star
      }
    ]
  },
  {
    title: '🛠️ Development',
    href: '#',
    items: [
      {
        title: 'Development Setup',
        href: '/docs/development/README',
        icon: Wrench
      },
      {
        title: 'Docker Services Guide',
        href: '/docs/development/DOCKER_SERVICES_GUIDE',
        icon: Wrench
      },
      {
        title: 'Database Seeders',
        href: '/docs/DATABASE_SEEDERS',
        icon: Database
      }
    ]
  },
  {
    title: '📊 Project Status & Roadmap',
    href: '#',
    items: [
      {
        title: 'Implementation Status Tracker',
        href: '/docs/roadmap/IMPLEMENTATION_STATUS_TRACKER',
        icon: BarChart
      },
      {
        title: 'Roadmap Overview',
        href: '/docs/roadmap/README',
        icon: BookOpen
      }
    ]
  }
]

interface DocsSidebarProps {
  className?: string
}

export function DocsSidebar({ className }: DocsSidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn('w-64 border-r bg-background', className)}>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-4">📚 Documentation</h2>
        <ScrollArea className="h-[calc(100vh-120px)]">
          <nav className="space-y-4">
            {navigationItems.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                  {section.title}
                </h3>
                {section.items && (
                  <div className="space-y-1">
                    {section.items.map((item, itemIndex) => {
                      const isActive = pathname === item.href
                      const Icon = item.icon
                      
                      return (
                        <Link
                          key={itemIndex}
                          href={item.href}
                          className={cn(
                            'flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground',
                            isActive && 'bg-accent text-accent-foreground font-medium'
                          )}
                        >
                          {Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
                          <span className="flex-1 truncate">{item.title}</span>
                          {item.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      )
                    })}
                  </div>
                )}
                {sectionIndex < navigationItems.length - 1 && (
                  <Separator className="my-3" />
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>
      </div>
    </div>
  )
}