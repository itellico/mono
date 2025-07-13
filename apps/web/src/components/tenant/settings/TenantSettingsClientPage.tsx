'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Settings, 
  Palette, 
  Globe, 
  CreditCard, 
  Users, 
  Shield, 
  Bell,
  Database,
  Key,
  Mail,
  Code,
  BarChart3,
  ChevronRight,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Clock
} from 'lucide-react';

interface SettingsSection {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  status: 'complete' | 'incomplete' | 'warning';
  badge?: string;
}

const settingsSections: SettingsSection[] = [
  {
    title: 'Branding & White Label',
    description: 'Customize your marketplace appearance, colors, and logos',
    icon: Palette,
    href: '/tenant/settings/branding',
    status: 'incomplete',
    badge: 'Important'
  },
  {
    title: 'Domain Settings',
    description: 'Configure custom domains and SSL certificates',
    icon: Globe,
    href: '/tenant/settings/domains',
    status: 'warning',
    badge: 'SSL Required'
  },
  {
    title: 'User Management',
    description: 'Manage accounts, roles, and permissions',
    icon: Users,
    href: '/tenant/settings/users',
    status: 'complete'
  },
  {
    title: 'Subscription Plans',
    description: 'Create and manage subscription plans for your customers',
    icon: CreditCard,
    href: '/tenant/subscriptions/plans',
    status: 'incomplete'
  },
  {
    title: 'Security Settings',
    description: 'Configure security policies and authentication',
    icon: Shield,
    href: '/tenant/settings/security',
    status: 'complete'
  },
  {
    title: 'Notifications',
    description: 'Email templates and notification preferences',
    icon: Bell,
    href: '/tenant/settings/notifications',
    status: 'incomplete'
  },
  {
    title: 'Data & Storage',
    description: 'Backup, export, and data retention settings',
    icon: Database,
    href: '/tenant/settings/data',
    status: 'complete'
  },
  {
    title: 'API & Integrations',
    description: 'Manage API keys, webhooks, and third-party integrations',
    icon: Key,
    href: '/tenant/settings/integrations',
    status: 'incomplete'
  },
  {
    title: 'Email Configuration',
    description: 'SMTP settings and email delivery configuration',
    icon: Mail,
    href: '/tenant/settings/email',
    status: 'warning',
    badge: 'Setup Required'
  },
  {
    title: 'Custom Code',
    description: 'Custom CSS, JavaScript, and advanced customizations',
    icon: Code,
    href: '/tenant/settings/custom-code',
    status: 'incomplete'
  },
  {
    title: 'Analytics Settings',
    description: 'Configure tracking, reports, and analytics integrations',
    icon: BarChart3,
    href: '/tenant/settings/analytics',
    status: 'complete'
  }
];

const quickActions = [
  {
    title: 'Setup Custom Domain',
    description: 'Connect your own domain',
    href: '/tenant/settings/domains',
    icon: Globe
  },
  {
    title: 'Customize Branding',
    description: 'Upload logo and set colors',
    href: '/tenant/settings/branding',
    icon: Palette
  },
  {
    title: 'Create Subscription Plan',
    description: 'Monetize your marketplace',
    href: '/tenant/subscriptions/plans',
    icon: CreditCard
  },
  {
    title: 'Add Team Members',
    description: 'Invite users to your workspace',
    href: '/tenant/settings/users',
    icon: Users
  }
];

function getStatusIcon(status: string) {
  switch (status) {
    case 'complete':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'warning':
      return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'incomplete':
      return <Clock className="h-4 w-4 text-gray-400" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'complete':
      return 'default';
    case 'warning':
      return 'destructive';
    case 'incomplete':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export function TenantSettingsClientPage() {
  const completedSections = settingsSections.filter(s => s.status === 'complete').length;
  const totalSections = settingsSections.length;
  const completionPercentage = Math.round((completedSections / totalSections) * 100);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Configure and customize your marketplace settings
        </p>
      </div>

      {/* Setup Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Setup Progress</CardTitle>
              <CardDescription>
                Complete your marketplace configuration
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">
                {completedSections} of {totalSections} completed
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm">{action.title}</h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Settings Sections */}
      <div>
        <h2 className="text-xl font-semibold mb-4">All Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsSections.map((section) => {
            const Icon = section.icon;
            return (
              <Link key={section.href} href={section.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{section.title}</h3>
                          {section.badge && (
                            <Badge 
                              variant={getStatusBadgeVariant(section.status)}
                              className="mt-1"
                            >
                              {section.badge}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(section.status)}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {section.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle>System Information</CardTitle>
          <CardDescription>
            Your marketplace configuration details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h4 className="font-medium">Tenant Details</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tenant ID:</span>
                  <span className="font-mono">clickdami</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan:</span>
                  <Badge variant="outline">Professional</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>January 1, 2024</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated:</span>
                  <span>2 hours ago</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Usage Statistics</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Storage Used:</span>
                  <span>2.4 GB / 50 GB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">API Calls:</span>
                  <span>1,247 / 10,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Users:</span>
                  <span>8 / 25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domains:</span>
                  <span>1 configured</span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">Need Help?</h4>
              <p className="text-sm text-muted-foreground">
                Contact support or view documentation
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                Documentation
              </Button>
              <Button variant="outline" size="sm">
                Contact Support
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}