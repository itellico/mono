'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Mail,
  Settings,
  BookTemplate,
  Send,
  Users,
  BarChart3,
  Database,
  Globe,
  Zap,
  Shield,
  Workflow,
  MessageSquare,
  Eye,
  TestTube,
  Activity,
  Server,
  FileText,
  Palette,
  Code,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  Filter,
  Search,
  Download,
  Upload,
  RefreshCw,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmailNavItem {
  title: string;
  href: string;
  icon: any;
  description: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  category: 'setup' | 'templates' | 'delivery' | 'analytics' | 'settings';
}

const emailNavItems: EmailNavItem[] = [
  // Setup & Configuration
  {
    title: 'Overview',
    href: '/admin/email',
    icon: Mail,
    description: 'Email system overview and quick setup',
    category: 'setup',
  },
  {
    title: 'System Setup',
    href: '/admin/email/setup',
    icon: Settings,
    description: 'Configure SMTP, providers, and basic settings',
    category: 'setup',
  },
  {
    title: 'Provider Config',
    href: '/admin/email/providers',
    icon: Server,
    description: 'Manage email providers (Mailpit, SendGrid, etc.)',
    category: 'setup',
  },
  {
    title: 'Domain Setup',
    href: '/admin/email/domains',
    icon: Globe,
    description: 'Domain authentication, SPF, DKIM, DMARC',
    badge: 'Important',
    badgeVariant: 'destructive',
    category: 'setup',
  },

  // Template Management
  {
    title: 'Template Library',
    href: '/admin/email/templates',
    icon: BookTemplate,
    description: 'Manage all email templates',
    category: 'templates',
  },
  {
    title: 'React Templates',
    href: '/admin/email/react-templates',
    icon: Code,
    description: 'React Email templates with live preview',
    badge: 'New',
    badgeVariant: 'default',
    category: 'templates',
  },
  {
    title: 'Template Editor',
    href: '/admin/email/editor',
    icon: Palette,
    description: 'Visual email template editor',
    category: 'templates',
  },
  {
    title: 'Template Variables',
    href: '/admin/email/variables',
    icon: Database,
    description: 'Manage template variables and data mapping',
    category: 'templates',
  },
  {
    title: 'Preview & Test',
    href: '/admin/email/preview',
    icon: Eye,
    description: 'Preview templates and send test emails',
    category: 'templates',
  },

  // Delivery & Campaigns
  {
    title: 'Email Queue',
    href: '/admin/email/queue',
    icon: Clock,
    description: 'Monitor email delivery queue and status',
    category: 'delivery',
  },
  {
    title: 'Bulk Campaigns',
    href: '/admin/email/campaigns',
    icon: Send,
    description: 'Create and manage email campaigns',
    category: 'delivery',
  },
  {
    title: 'Automation',
    href: '/admin/email/automation',
    icon: Workflow,
    description: 'Automated email workflows and triggers',
    category: 'delivery',
  },
  {
    title: 'Notifications',
    href: '/admin/email/notifications',
    icon: MessageSquare,
    description: 'System notification settings',
    category: 'delivery',
  },

  // Analytics & Monitoring
  {
    title: 'Analytics',
    href: '/admin/email/analytics',
    icon: BarChart3,
    description: 'Email performance and engagement metrics',
    category: 'analytics',
  },
  {
    title: 'Delivery Reports',
    href: '/admin/email/reports',
    icon: FileText,
    description: 'Detailed delivery and bounce reports',
    category: 'analytics',
  },
  {
    title: 'A/B Testing',
    href: '/admin/email/ab-testing',
    icon: TestTube,
    description: 'Test different email variations',
    category: 'analytics',
  },
  {
    title: 'Real-time Monitor',
    href: '/admin/email/monitor',
    icon: Activity,
    description: 'Live email delivery monitoring',
    category: 'analytics',
  },

  // Settings & Preferences
  {
    title: 'User Preferences',
    href: '/admin/email/preferences',
    icon: Users,
    description: 'Manage user email preferences and opt-outs',
    category: 'settings',
  },
  {
    title: 'Compliance',
    href: '/admin/email/compliance',
    icon: Shield,
    description: 'GDPR, CAN-SPAM, and unsubscribe management',
    badge: 'Required',
    badgeVariant: 'destructive',
    category: 'settings',
  },
  {
    title: 'Rate Limiting',
    href: '/admin/email/rate-limits',
    icon: Zap,
    description: 'Configure sending limits and throttling',
    category: 'settings',
  },
  {
    title: 'Multi-Language',
    href: '/admin/email/i18n',
    icon: Globe,
    description: 'International email templates and localization',
    category: 'settings',
  },
];

const categories = [
  { key: 'setup', label: 'Setup & Configuration', icon: Settings },
  { key: 'templates', label: 'Template Management', icon: BookTemplate },
  { key: 'delivery', label: 'Delivery & Campaigns', icon: Send },
  { key: 'analytics', label: 'Analytics & Monitoring', icon: BarChart3 },
  { key: 'settings', label: 'Settings & Preferences', icon: Users },
] as const;

interface EmailLayoutProps {
  children: React.ReactNode;
}

export default function EmailLayout({ children }: EmailLayoutProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const filteredItems = emailNavItems.filter(
    item =>
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusIndicator = (href: string) => {
    // Mock implementation - in real app, check if setup is complete
    const setupItems = ['/admin/email/setup', '/admin/email/providers', '/admin/email/domains'];
    if (setupItems.includes(href)) {
      return href === '/admin/email/domains' 
        ? <AlertCircle className="h-3 w-3 text-red-500" />
        : <CheckCircle className="h-3 w-3 text-green-500" />;
    }
    return null;
  };

  return (
    <AdminOnly>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile menu button */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 z-40 w-80 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold">Email Management</h1>
                  <p className="text-sm text-gray-500">Super Admin Center</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search email features..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 border-b">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" className="justify-start">
                  <Send className="mr-2 h-4 w-4" />
                  Send Test
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Queue
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button variant="outline" size="sm" className="justify-start">
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </Button>
              </div>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-4">
              <div className="space-y-6 py-4">
                {categories.map((category) => {
                  const categoryItems = filteredItems.filter(item => item.category === category.key);

                  if (categoryItems.length === 0) return null;

                  return (
                    <div key={category.key}>
                      <div className="flex items-center space-x-2 mb-3">
                        <category.icon className="h-4 w-4 text-gray-500" />
                        <h3 className="text-sm font-medium text-gray-900">{category.label}</h3>
                      </div>

                      <div className="space-y-1">
                        {categoryItems.map((item) => {
                          const isActive = pathname === item.href;
                          const Icon = item.icon;

                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setIsSidebarOpen(false)}
                              className={cn(
                                "flex items-center justify-between w-full px-3 py-2 text-sm rounded-lg transition-colors",
                                isActive
                                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              )}
                            >
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium truncate">{item.title}</span>
                                    {getStatusIndicator(item.href)}
                                  </div>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">
                                    {item.description}
                                  </p>
                                </div>
                              </div>

                              {item.badge && (
                                <Badge 
                                  variant={item.badgeVariant || 'secondary'} 
                                  className="ml-2 text-xs flex-shrink-0"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Email System v2.0</span>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminOnly>
  );
} 