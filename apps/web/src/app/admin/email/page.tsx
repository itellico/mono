'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  Send,
  Users,
  BarChart3,
  Settings,
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp,
  BookTemplate,
  Globe,
  Shield,
  Server,
  Zap,
  Activity,
  Download,
  RefreshCw,
  TestTube,
  Eye,
} from 'lucide-react';
import Link from 'next/link';

interface EmailSystemStatus {
  setupComplete: boolean;
  setupProgress: number;
  totalTemplates: number;
  activeTemplates: number;
  emailsSentToday: number;
  emailsSentMonth: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  queueSize: number;
  providersConnected: number;
  domainsVerified: number;
  complianceScore: number;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href: string;
  icon: any;
  priority: 'high' | 'medium' | 'low';
}

const mockEmailStatus: EmailSystemStatus = {
  setupComplete: false,
  setupProgress: 75,
  totalTemplates: 12,
  activeTemplates: 8,
  emailsSentToday: 1247,
  emailsSentMonth: 28394,
  deliveryRate: 98.2,
  openRate: 24.7,
  clickRate: 3.8,
  bounceRate: 1.8,
  queueSize: 23,
  providersConnected: 2,
  domainsVerified: 1,
  complianceScore: 85,
};

const setupSteps: SetupStep[] = [
  {
    id: 'providers',
    title: 'Email Providers',
    description: 'Configure SMTP and email service providers',
    completed: true,
    href: '/admin/email/providers',
    icon: Server,
    priority: 'high',
  },
  {
    id: 'domains',
    title: 'Domain Authentication',
    description: 'Set up SPF, DKIM, and DMARC records',
    completed: false,
    href: '/admin/email/domains',
    icon: Globe,
    priority: 'high',
  },
  {
    id: 'templates',
    title: 'Email Templates',
    description: 'Create and configure email templates',
    completed: true,
    href: '/admin/email/templates',
    icon: BookTemplate,
    priority: 'medium',
  },
  {
    id: 'compliance',
    title: 'Compliance Setup',
    description: 'Configure GDPR and CAN-SPAM compliance',
    completed: true,
    href: '/admin/email/compliance',
    icon: Shield,
    priority: 'high',
  },
  {
    id: 'rate-limits',
    title: 'Rate Limiting',
    description: 'Set up sending limits and throttling',
    completed: false,
    href: '/admin/email/rate-limits',
    icon: Zap,
    priority: 'medium',
  },
];

export default function EmailOverviewPage() {
  const { toast } = useToast();

  const { data: emailStatus, isLoading } = useQuery({
    queryKey: ['email-system-status'],
    queryFn: async (): Promise<EmailSystemStatus> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockEmailStatus;
    },
  });

  const handleTestEmail = async () => {
    try {
      // Simulate sending test email
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: 'Test email sent',
        description: 'Check your inbox for the test email.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email.',
        variant: 'destructive',
      });
    }
  };

  const handleSyncQueue = async () => {
    try {
      // Simulate queue sync
      await new Promise(resolve => setTimeout(resolve, 500));
      toast({
        title: 'Queue synchronized',
        description: 'Email queue has been refreshed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync email queue.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const status = emailStatus!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email System Overview</h1>
          <p className="text-muted-foreground mt-2">
            Manage your complete email infrastructure and monitor performance.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Button onClick={handleTestEmail} variant="outline">
            <Send className="mr-2 h-4 w-4" />
            Send Test Email
          </Button>
          <Button onClick={handleSyncQueue} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync Queue
          </Button>
          <Link href="/admin/email/analytics">
            <Button>
              <BarChart3 className="mr-2 h-4 w-4" />
              View Analytics
            </Button>
          </Link>
        </div>
      </div>

      {/* Setup Progress */}
      {!status.setupComplete && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800">Setup Required</CardTitle>
            </div>
            <CardDescription className="text-amber-700">
              Complete the setup process to fully activate your email system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-amber-800">
                    Setup Progress: {status.setupProgress}%
                  </span>
                </div>
                <Progress value={status.setupProgress} className="h-2" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {setupSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <Link key={step.id} href={step.href}>
                      <div className="flex items-center space-x-3 p-3 rounded-lg border bg-white hover:bg-gray-50 transition-colors">
                        <div className={`p-2 rounded-lg ${step.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                          {step.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <Icon className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-medium text-sm">{step.title}</h4>
                            <Badge 
                              variant={step.priority === 'high' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {step.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{step.description}</p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Today</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.emailsSentToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.emailsSentMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +18% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.deliveryRate}%</div>
            <p className="text-xs text-muted-foreground">
              Industry average: 95%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{status.queueSize}</div>
            <p className="text-xs text-muted-foreground">
              Processing normally
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Engagement Rates</CardTitle>
            <CardDescription>Email interaction metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Open Rate</span>
              <span className="font-bold">{status.openRate}%</span>
            </div>
            <Progress value={status.openRate} className="h-2" />

            <div className="flex items-center justify-between">
              <span className="text-sm">Click Rate</span>
              <span className="font-bold">{status.clickRate}%</span>
            </div>
            <Progress value={status.clickRate * 10} className="h-2" />

            <div className="flex items-center justify-between">
              <span className="text-sm">Bounce Rate</span>
              <span className="font-bold text-red-600">{status.bounceRate}%</span>
            </div>
            <Progress value={status.bounceRate * 10} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
            <CardDescription>Infrastructure health</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Providers Connected</span>
              <Badge variant="default">{status.providersConnected}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Domains Verified</span>
              <Badge variant={status.domainsVerified > 0 ? 'default' : 'destructive'}>
                {status.domainsVerified}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Templates Active</span>
              <Badge variant="default">{status.activeTemplates}/{status.totalTemplates}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Compliance Score</span>
              <Badge variant={status.complianceScore >= 90 ? 'default' : 'destructive'}>
                {status.complianceScore}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common email management tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/email/templates" className="block">
              <Button variant="outline" className="w-full justify-start">
                <BookTemplate className="mr-2 h-4 w-4" />
                Manage Templates
              </Button>
            </Link>
            <Link href="/admin/email/preview" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Eye className="mr-2 h-4 w-4" />
                Preview Templates
              </Button>
            </Link>
            <Link href="/admin/email/ab-testing" className="block">
              <Button variant="outline" className="w-full justify-start">
                <TestTube className="mr-2 h-4 w-4" />
                A/B Testing
              </Button>
            </Link>
            <Link href="/admin/email/monitor" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Activity className="mr-2 h-4 w-4" />
                Live Monitor
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
          <CardDescription>Latest email system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: '2 minutes ago', event: 'Welcome email template updated', type: 'template' },
              { time: '15 minutes ago', event: '247 emails delivered successfully', type: 'delivery' },
              { time: '1 hour ago', event: 'Domain verification completed for mono.com', type: 'setup' },
              { time: '3 hours ago', event: 'A/B test started for welcome email', type: 'testing' },
              { time: '5 hours ago', event: 'Rate limit increased to 1000/hour', type: 'settings' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-500">{activity.time}</span>
                <span>{activity.event}</span>
                <Badge variant="outline" className="text-xs">
                  {activity.type}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 