'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle,
  XCircle,
  Eye,
  Users,
  Lock,
  Unlock,
  Download,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface SecurityMetrics {
  totalPermissions: number;
  activePermissions: number;
  failedAuthorizations: number;
  successfulAuthorizations: number;
  riskScore: number;
  lastAuditDate: string;
  criticalIssues: number;
  warningIssues: number;
}

interface PermissionUsage {
  permission: string;
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  uniqueUsers: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUsed: string;
  trends: { date: string; attempts: number; failures: number }[];
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  eventType: 'permission_denied' | 'privilege_escalation' | 'suspicious_activity' | 'failed_login';
  userId: number;
  userName: string;
  attemptedPermission: string;
  sourceIp: string;
  userAgent: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
}

interface PermissionInheritanceIssue {
  id: string;
  type: 'orphaned_permission' | 'conflicting_inheritance' | 'missing_hierarchy' | 'circular_dependency';
  description: string;
  affectedUsers: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendation: string;
  autoFixable: boolean;
}

/**
 * PermissionAuditor - Comprehensive security monitoring and permission system
 * auditing with real-time threat detection and compliance reporting
 * 
 * @component
 * @example
 * ```tsx
 * <PermissionAuditor />
 * ```
 */
export function PermissionAuditor() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedRiskLevel, setSelectedRiskLevel] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch security metrics
  const { data: securityMetrics, isLoading: metricsLoading } = useQuery<SecurityMetrics>({
    queryKey: ['security-metrics', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return {
        totalPermissions: 112,
        activePermissions: 98,
        failedAuthorizations: 23,
        successfulAuthorizations: 8945,
        riskScore: 15,
        lastAuditDate: '2025-01-19T10:30:00Z',
        criticalIssues: 1,
        warningIssues: 3
      };
    },
    staleTime: autoRefresh ? 30 * 1000 : 5 * 60 * 1000, // 30s if auto-refresh, 5min otherwise
    refetchInterval: autoRefresh ? 30 * 1000 : false,
  });

  // Fetch permission usage data
  const { data: permissionUsage, isLoading: usageLoading } = useQuery<PermissionUsage[]>({
    queryKey: ['permission-usage', selectedTimeRange, selectedRiskLevel],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          permission: 'admin.access.global',
          totalAttempts: 1247,
          successfulAttempts: 1245,
          failedAttempts: 2,
          uniqueUsers: 3,
          riskLevel: 'high',
          lastUsed: '2025-01-19T14:30:00Z',
          trends: [
            { date: '2025-01-19', attempts: 89, failures: 1 },
            { date: '2025-01-18', attempts: 95, failures: 0 },
            { date: '2025-01-17', attempts: 87, failures: 1 }
          ]
        },
        {
          permission: 'users.manage.tenant',
          totalAttempts: 634,
          successfulAttempts: 629,
          failedAttempts: 5,
          uniqueUsers: 12,
          riskLevel: 'medium',
          lastUsed: '2025-01-19T14:15:00Z',
          trends: [
            { date: '2025-01-19', attempts: 45, failures: 2 },
            { date: '2025-01-18', attempts: 52, failures: 1 },
            { date: '2025-01-17', attempts: 48, failures: 2 }
          ]
        },
        {
          permission: 'profiles.read.self',
          totalAttempts: 5894,
          successfulAttempts: 5892,
          failedAttempts: 2,
          uniqueUsers: 1847,
          riskLevel: 'low',
          lastUsed: '2025-01-19T14:35:00Z',
          trends: [
            { date: '2025-01-19', attempts: 423, failures: 0 },
            { date: '2025-01-18', attempts: 456, failures: 1 },
            { date: '2025-01-17', attempts: 398, failures: 1 }
          ]
        },
        {
          permission: 'billing.read.account',
          totalAttempts: 156,
          successfulAttempts: 142,
          failedAttempts: 14,
          uniqueUsers: 89,
          riskLevel: 'critical',
          lastUsed: '2025-01-19T13:45:00Z',
          trends: [
            { date: '2025-01-19', attempts: 12, failures: 4 },
            { date: '2025-01-18', attempts: 15, failures: 5 },
            { date: '2025-01-17', attempts: 13, failures: 5 }
          ]
        }
      ];
    },
    staleTime: autoRefresh ? 30 * 1000 : 5 * 60 * 1000,
    refetchInterval: autoRefresh ? 30 * 1000 : false,
  });

  // Fetch security events
  const { data: securityEvents, isLoading: eventsLoading } = useQuery<SecurityEvent[]>({
    queryKey: ['security-events', selectedTimeRange],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          id: 'evt_001',
          timestamp: '2025-01-19T14:25:00Z',
          eventType: 'permission_denied',
          userId: 1,
          userName: 'Super Admin',
          attemptedPermission: 'billing.update.account',
          sourceIp: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          riskLevel: 'high',
          resolved: false
        },
        {
          id: 'evt_002',
          timestamp: '2025-01-19T14:10:00Z',
          eventType: 'suspicious_activity',
          userId: 234,
          userName: 'john.doe@example.com',
          attemptedPermission: 'admin.access.global',
          sourceIp: '10.0.0.15',
          userAgent: 'curl/7.68.0',
          riskLevel: 'critical',
          resolved: false
        },
        {
          id: 'evt_003',
          timestamp: '2025-01-19T13:55:00Z',
          eventType: 'failed_login',
          userId: 456,
          userName: 'jane.smith@example.com',
          attemptedPermission: 'authentication',
          sourceIp: '203.0.113.45',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
          riskLevel: 'medium',
          resolved: true
        }
      ];
    },
    staleTime: autoRefresh ? 15 * 1000 : 2 * 60 * 1000, // 15s if auto-refresh, 2min otherwise
    refetchInterval: autoRefresh ? 15 * 1000 : false,
  });

  // Fetch inheritance issues
  const { data: inheritanceIssues, isLoading: issuesLoading } = useQuery<PermissionInheritanceIssue[]>({
    queryKey: ['inheritance-issues'],
    queryFn: async () => {
      // Mock data for demonstration
      return [
        {
          id: 'issue_001',
          type: 'orphaned_permission',
          description: 'Permission "legacy.admin.access" exists but is not assigned to any role',
          affectedUsers: 0,
          severity: 'medium',
          recommendation: 'Remove unused permission or assign to appropriate role',
          autoFixable: true
        },
        {
          id: 'issue_002',
          type: 'conflicting_inheritance',
          description: 'Users in "Marketing Team" have conflicting permissions for "analytics.read.tenant"',
          affectedUsers: 12,
          severity: 'high',
          recommendation: 'Review role hierarchy and resolve conflicting permissions',
          autoFixable: false
        },
        {
          id: 'issue_003',
          type: 'missing_hierarchy',
          description: 'Role "Content Editor" lacks parent role definition in hierarchy',
          affectedUsers: 34,
          severity: 'low',
          recommendation: 'Define proper role hierarchy for "Content Editor"',
          autoFixable: false
        }
      ];
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <AlertCircle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'permission_denied': return <Lock className="h-4 w-4" />;
      case 'privilege_escalation': return <TrendingUp className="h-4 w-4" />;
      case 'suspicious_activity': return <AlertTriangle className="h-4 w-4" />;
      case 'failed_login': return <XCircle className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  if (metricsLoading || usageLoading || eventsLoading || issuesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Permission Auditor</h1>
          <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  const successRate = securityMetrics ? 
    (securityMetrics.successfulAuthorizations / (securityMetrics.successfulAuthorizations + securityMetrics.failedAuthorizations)) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Permission Auditor</h1>
          <p className="text-muted-foreground mt-1">
            Security monitoring, permission analytics, and compliance auditing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 text-green-600' : ''}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last hour</SelectItem>
              <SelectItem value="24h">Last 24 hours</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Security Status Alerts */}
      {securityMetrics && securityMetrics.criticalIssues > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical Security Issues Detected:</strong> {securityMetrics.criticalIssues} critical issue(s) require immediate attention.
            {securityMetrics.warningIssues > 0 && ` Additionally, ${securityMetrics.warningIssues} warning(s) need review.`}
          </AlertDescription>
        </Alert>
      )}

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{100 - (securityMetrics?.riskScore || 0)}%</div>
            <p className="text-xs text-muted-foreground">
              Risk score: {securityMetrics?.riskScore}%
            </p>
            <Progress value={100 - (securityMetrics?.riskScore || 0)} className="mt-2" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auth Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {securityMetrics?.successfulAuthorizations.toLocaleString()} successful
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{securityMetrics?.failedAuthorizations}</div>
            <p className="text-xs text-muted-foreground">
              Last 24 hours
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Permissions</CardTitle>
            <Unlock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{securityMetrics?.activePermissions}</div>
            <p className="text-xs text-muted-foreground">
              of {securityMetrics?.totalPermissions} total
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="permissions" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permissions">Permission Usage</TabsTrigger>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="issues">System Issues</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Permission Usage Tab */}
        <TabsContent value="permissions" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedRiskLevel} onValueChange={setSelectedRiskLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by risk level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {permissionUsage?.map((usage) => (
              <Card key={usage.permission}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{usage.permission}</h3>
                      <p className="text-sm text-muted-foreground">
                        Last used: {new Date(usage.lastUsed).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskColor(usage.riskLevel)}>
                        {getRiskIcon(usage.riskLevel)}
                        {usage.riskLevel}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Total Attempts</div>
                      <div className="text-xl font-bold">{usage.totalAttempts.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Successful</div>
                      <div className="text-xl font-bold text-green-600">{usage.successfulAttempts.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Failed</div>
                      <div className="text-xl font-bold text-red-600">{usage.failedAttempts}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Unique Users</div>
                      <div className="text-xl font-bold">{usage.uniqueUsers}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">Success Rate</div>
                    <Progress value={(usage.successfulAttempts / usage.totalAttempts) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <div className="space-y-4">
            {securityEvents?.map((event) => (
              <Card key={event.id} className={`border-l-4 ${
                event.riskLevel === 'critical' ? 'border-l-red-500' :
                event.riskLevel === 'high' ? 'border-l-orange-500' :
                event.riskLevel === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getEventTypeIcon(event.eventType)}
                      <div>
                        <h3 className="font-semibold capitalize">{event.eventType.replace('_', ' ')}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskColor(event.riskLevel)}>
                        {event.riskLevel}
                      </Badge>
                      {event.resolved ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          Open
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">User</div>
                      <div className="font-medium">{event.userName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Permission</div>
                      <div className="font-medium">{event.attemptedPermission}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Source IP</div>
                      <div className="font-medium">{event.sourceIp}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">User Agent</div>
                      <div className="font-medium truncate" title={event.userAgent}>
                        {event.userAgent.split(' ')[0]}
                      </div>
                    </div>
                  </div>
                  
                  {!event.resolved && (
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" variant="outline">
                        Investigate
                      </Button>
                      <Button size="sm" variant="outline">
                        Mark Resolved
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* System Issues Tab */}
        <TabsContent value="issues" className="space-y-6">
          <div className="space-y-4">
            {inheritanceIssues?.map((issue) => (
              <Card key={issue.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold capitalize">{issue.type.replace('_', ' ')}</h3>
                      <p className="text-sm text-muted-foreground">
                        Affects {issue.affectedUsers} user(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getRiskColor(issue.severity)}>
                        {issue.severity}
                      </Badge>
                      {issue.autoFixable && (
                        <Badge variant="secondary">
                          Auto-fixable
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Description</div>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Recommendation</div>
                    <p className="text-sm text-muted-foreground">{issue.recommendation}</p>
                  </div>
                  
                  <div className="flex gap-2">
                    {issue.autoFixable ? (
                      <Button size="sm">
                        Auto-fix Issue
                      </Button>
                    ) : (
                      <Button size="sm" variant="outline">
                        Manual Resolution Required
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Compliance Tab */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Audit Compliance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Permission Documentation</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    98% Complete
                  </Badge>
                </div>
                <Progress value={98} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Role Hierarchy Validation</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    Complete
                  </Badge>
                </div>
                <Progress value={100} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Access Log Retention</span>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    365 days
                  </Badge>
                </div>
                <Progress value={100} className="h-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Last Audit Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {securityMetrics?.lastAuditDate && 
                      `Last audit: ${new Date(securityMetrics.lastAuditDate).toLocaleDateString()}`
                    }
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Permissions Reviewed</span>
                    <span className="font-bold">{securityMetrics?.totalPermissions}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Issues Found</span>
                    <span className="font-bold">{(securityMetrics?.criticalIssues || 0) + (securityMetrics?.warningIssues || 0)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Issues Resolved</span>
                    <span className="font-bold">12</span>
                  </div>
                </div>
                
                <Button className="w-full" variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Audit Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 