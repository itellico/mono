'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminOnly } from '@/components/admin/AdminOnly';
import { PermissionGate } from '@/components/reusable/PermissionGate';
import {
  Search,
  Filter,
  Mail,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send,
  Copy,
  Globe,
  Settings,
  BarChart3,
  Download,
  Upload,
  TestTube,
  Languages,
  Workflow,
  MessageSquare,
  Users,
  Calendar,
  Activity
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

// Mock data for development - replace with actual API calls
const mockTemplates = [
  {
    id: 1,
    key: 'welcome',
    name: 'Welcome Email',
    type: 'welcome',
    language: 'en',
    subject: 'Welcome to {{tenant.name}}!',
    isActive: true,
    isDefault: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    variables: ['user.firstName', 'user.email', 'tenant.name'],
    deliveryCount: 1250,
    openRate: 85.2,
    clickRate: 12.4
  },
  {
    id: 2,
    key: 'verification',
    name: 'Email Verification',
    type: 'verification',
    language: 'en',
    subject: 'Verify your email address',
    isActive: true,
    isDefault: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-18T09:15:00Z',
    variables: ['user.firstName', 'verification.url'],
    deliveryCount: 890,
    openRate: 92.1,
    clickRate: 78.5
  },
  {
    id: 3,
    key: 'password_reset',
    name: 'Password Reset',
    type: 'password_reset',
    language: 'en',
    subject: 'Reset your password',
    isActive: true,
    isDefault: true,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-19T16:45:00Z',
    variables: ['user.firstName', 'reset.url', 'reset.expiresAt'],
    deliveryCount: 156,
    openRate: 88.9,
    clickRate: 65.2
  },
  {
    id: 4,
    key: 'notification',
    name: 'General Notification',
    type: 'notification',
    language: 'en',
    subject: 'You have a new notification',
    isActive: true,
    isDefault: false,
    createdAt: '2024-01-16T11:30:00Z',
    updatedAt: '2024-01-21T13:20:00Z',
    variables: ['user.firstName', 'notification.message', 'notification.actionUrl'],
    deliveryCount: 2340,
    openRate: 76.8,
    clickRate: 18.3
  },
  {
    id: 5,
    key: 'marketing_newsletter',
    name: 'Monthly Newsletter',
    type: 'marketing',
    language: 'en',
    subject: 'Your monthly update from {{tenant.name}}',
    isActive: true,
    isDefault: false,
    createdAt: '2024-01-17T14:00:00Z',
    updatedAt: '2024-01-22T10:10:00Z',
    variables: ['user.firstName', 'newsletter.content', 'newsletter.unsubscribeUrl'],
    deliveryCount: 5670,
    openRate: 42.1,
    clickRate: 8.7
  }
];

const mockStats = {
  totalTemplates: 12,
  activeTemplates: 10,
  totalDeliveries: 45230,
  averageOpenRate: 68.4,
  averageClickRate: 24.8,
  languagesSupported: 5
};

export default function EmailTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [languageFilter, setLanguageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { toast } = useToast();

  // Mock query - replace with actual API call
  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['email-templates', searchTerm, typeFilter, languageFilter, statusFilter],
    queryFn: async () => {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));

      let filtered = mockTemplates;

      if (searchTerm) {
        filtered = filtered.filter(template => 
          template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          template.key.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (typeFilter !== 'all') {
        filtered = filtered.filter(template => template.type === typeFilter);
      }

      if (languageFilter !== 'all') {
        filtered = filtered.filter(template => template.language === languageFilter);
      }

      if (statusFilter !== 'all') {
        filtered = filtered.filter(template => 
          statusFilter === 'active' ? template.isActive : !template.isActive
        );
      }

      return filtered;
    }
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'welcome':
        return <Users className="h-4 w-4" />;
      case 'verification':
        return <TestTube className="h-4 w-4" />;
      case 'password_reset':
        return <Settings className="h-4 w-4" />;
      case 'notification':
        return <MessageSquare className="h-4 w-4" />;
      case 'marketing':
        return <BarChart3 className="h-4 w-4" />;
      case 'workflow':
        return <Workflow className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'welcome':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'verification':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'password_reset':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'notification':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'marketing':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'workflow':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const handlePreview = (template: any) => {
    setSelectedTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template);
    setIsEditDialogOpen(true);
  };

  const handleDelete = async (templateId: number) => {
    try {
      // Mock delete operation
      toast({
        title: "Template Deleted",
        description: "Email template has been deleted successfully.",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete email template. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSendTest = async (template: any) => {
    try {
      // Mock test email operation
      toast({
        title: "Test Email Sent",
        description: `Test email sent using template "${template.name}".`,
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Failed to send test email. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicate = async (template: any) => {
    try {
      // Mock duplicate operation
      toast({
        title: "Template Duplicated",
        description: `Template "${template.name}" has been duplicated.`,
      });
    } catch (error) {
      toast({
        title: "Duplicate Failed",
        description: "Failed to duplicate template. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (templatesLoading) {
    return (
      <AdminOnly>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96 mt-2" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AdminOnly>
    );
  }

  return (
    <AdminOnly>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Email Templates</h1>
            <p className="text-muted-foreground">
              Manage email templates with multi-language support and workflow integration
            </p>
          </div>
          <div className="flex space-x-3">
            <PermissionGate action="export" resource="admin" showFallback={false}>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Templates
              </Button>
            </PermissionGate>

            <PermissionGate action="import" resource="admin" showFallback={false}>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import Templates
              </Button>
            </PermissionGate>

            <PermissionGate action="create" resource="admin" showFallback={false}>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Create Email Template</DialogTitle>
                    <DialogDescription>
                      Create a new email template with multi-language support and variable substitution.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="template-key">Template Key</Label>
                        <Input id="template-key" placeholder="welcome_new_user" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="template-type">Type</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="welcome">Welcome</SelectItem>
                            <SelectItem value="verification">Verification</SelectItem>
                            <SelectItem value="password_reset">Password Reset</SelectItem>
                            <SelectItem value="notification">Notification</SelectItem>
                            <SelectItem value="marketing">Marketing</SelectItem>
                            <SelectItem value="workflow">Workflow</SelectItem>
                            <SelectItem value="custom">Custom</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="template-name">Template Name</Label>
                        <Input id="template-name" placeholder="Welcome New User" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="template-language">Language</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select language" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                            <SelectItem value="it">Italian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="template-subject">Subject Line</Label>
                      <Input id="template-subject" placeholder="Welcome to {{tenant.name}}, {{user.firstName}}!" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="template-description">Description</Label>
                      <Textarea id="template-description" placeholder="Describe this template..." rows={3} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">Create Template</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </PermissionGate>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalTemplates}</div>
              <p className="text-xs text-muted-foreground">
                {mockStats.activeTemplates} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Deliveries</CardTitle>
              <Send className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.totalDeliveries.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.averageOpenRate}%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Click Rate</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.averageClickRate}%</div>
              <p className="text-xs text-muted-foreground">
                +0.8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Languages</CardTitle>
              <Languages className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockStats.languagesSupported}</div>
              <p className="text-xs text-muted-foreground">
                Supported languages
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Month</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.2K</div>
              <p className="text-xs text-muted-foreground">
                Emails sent
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filter Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="verification">Verification</SelectItem>
                  <SelectItem value="password_reset">Password Reset</SelectItem>
                  <SelectItem value="notification">Notification</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="workflow">Workflow</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Templates Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {templates?.map((template) => (
            <Card key={template.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg ${getTypeColor(template.type)}`}>
                      {getTypeIcon(template.type)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {template.key}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {template.language.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {template.isDefault && (
                      <Badge variant="secondary" className="text-xs">Default</Badge>
                    )}
                    <Badge 
                      variant={template.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">Subject:</p>
                  <p className="text-sm">{template.subject}</p>
                </div>

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{template.deliveryCount.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Sent</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-green-600">{template.openRate}%</p>
                    <p className="text-xs text-muted-foreground">Opens</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-blue-600">{template.clickRate}%</p>
                    <p className="text-xs text-muted-foreground">Clicks</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {template.variables.slice(0, 3).map((variable: string) => (
                    <Badge key={variable} variant="outline" className="text-xs">
                      {variable}
                    </Badge>
                  ))}
                  {template.variables.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{template.variables.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePreview(template)}
                    className="flex-1"
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    Preview
                  </Button>

                  <PermissionGate action="edit" resource="admin" showFallback={false}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(template)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </PermissionGate>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSendTest(template)}
                  >
                    <Send className="h-3 w-3" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(template)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>

                  <PermissionGate action="delete" resource="admin" showFallback={false}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(template.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </PermissionGate>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedTemplate && getTypeIcon(selectedTemplate.type)}
                {selectedTemplate?.name} Preview
              </DialogTitle>
              <DialogDescription>
                Preview of the email template with sample data
              </DialogDescription>
            </DialogHeader>

            {selectedTemplate && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Template Key</Label>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.key}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Type</Label>
                    <p className="text-sm text-muted-foreground capitalize">{selectedTemplate.type}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Language</Label>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.language.toUpperCase()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge variant={selectedTemplate.isActive ? "default" : "secondary"}>
                      {selectedTemplate.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Subject Line</Label>
                  <div className="mt-1 p-3 bg-muted rounded-md">
                    <p className="text-sm">{selectedTemplate.subject}</p>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Template Variables</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedTemplate.variables.map((variable: string) => (
                      <Badge key={variable} variant="outline">
                        {variable}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Performance Metrics</Label>
                  <div className="mt-1 grid grid-cols-3 gap-4 p-3 bg-muted rounded-md">
                    <div className="text-center">
                      <p className="text-lg font-bold">{selectedTemplate.deliveryCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Sent</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{selectedTemplate.openRate}%</p>
                      <p className="text-xs text-muted-foreground">Open Rate</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-blue-600">{selectedTemplate.clickRate}%</p>
                      <p className="text-xs text-muted-foreground">Click Rate</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminOnly>
  );
} 