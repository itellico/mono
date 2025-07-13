'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { LoadingState } from '@/components/ui/loading-state';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Mail, 
  Plus, 
  Edit, 
  Trash2, 
  Copy, 
  Send, 
  Eye,
  Code,
  Palette,
  FileText,
  Settings,
  MoreHorizontal,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Monitor,
  Smartphone,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  category: 'system' | 'workflow' | 'messaging' | 'marketing';
  type: 'auth' | 'notification' | 'approval' | 'newsletter' | 'custom';
  description: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  isActive: boolean;
  isCustomizable: boolean;
  usage: {
    sent: number;
    opened: number;
    clicked: number;
  };
  lastModified: string;
  createdBy: string;
}

interface TemplateVariable {
  name: string;
  description: string;
  example: string;
  required: boolean;
  category: 'user' | 'tenant' | 'content' | 'system';
}

// Mock data
const mockTemplates: EmailTemplate[] = [
  {
    id: '1',
    name: 'Welcome Email',
    subject: 'Welcome to {{ tenantName }}, {{ userName }}!',
    category: 'system',
    type: 'auth',
    description: 'Sent when a new user joins the platform',
    htmlContent: `
      <mjml>
        <mj-body>
          <mj-section background-color="{{ tenantBranding.primaryColor }}">
            <mj-column>
              <mj-image src="{{ tenantBranding.logoUrl }}" alt="{{ tenantName }}" />
              <mj-text color="white" font-size="24px">Welcome to {{ tenantName }}!</mj-text>
            </mj-column>
          </mj-section>
          <mj-section>
            <mj-column>
              <mj-text>Hi {{ userName }},</mj-text>
              <mj-text>Welcome to {{ tenantName }}! We're excited to have you on board.</mj-text>
              <mj-button href="{{ activationUrl }}">Activate Account</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    textContent: 'Welcome to {{ tenantName }}, {{ userName }}! Activate your account: {{ activationUrl }}',
    variables: ['userName', 'tenantName', 'activationUrl', 'tenantBranding.primaryColor', 'tenantBranding.logoUrl'],
    isActive: true,
    isCustomizable: true,
    usage: { sent: 156, opened: 142, clicked: 89 },
    lastModified: '2024-01-20T10:30:00Z',
    createdBy: 'System'
  },
  {
    id: '2',
    name: 'Application Status Update',
    subject: 'Your {{ jobTitle }} application has been {{ status }}',
    category: 'workflow',
    type: 'notification',
    description: 'Sent when application status changes',
    htmlContent: `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text font-size="20px">Application Update</mj-text>
              <mj-text>Hi {{ userName }},</mj-text>
              <mj-text>Your application for {{ jobTitle }} has been {{ status }}.</mj-text>
              <mj-button href="{{ actionUrl }}">View Details</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    textContent: 'Your {{ jobTitle }} application has been {{ status }}. View details: {{ actionUrl }}',
    variables: ['userName', 'jobTitle', 'status', 'actionUrl', 'applicationDate'],
    isActive: true,
    isCustomizable: true,
    usage: { sent: 89, opened: 76, clicked: 45 },
    lastModified: '2024-01-19T14:20:00Z',
    createdBy: 'John Doe'
  },
  {
    id: '3',
    name: 'Monthly Newsletter',
    subject: '{{ tenantName }} Newsletter - {{ monthYear }}',
    category: 'marketing',
    type: 'newsletter',
    description: 'Monthly newsletter template',
    htmlContent: `
      <mjml>
        <mj-body>
          <mj-section>
            <mj-column>
              <mj-text font-size="24px">{{ tenantName }} Newsletter</mj-text>
              <mj-text>{{ newsletterContent }}</mj-text>
              <mj-button href="{{ unsubscribeUrl }}">Unsubscribe</mj-button>
            </mj-column>
          </mj-section>
        </mj-body>
      </mjml>
    `,
    textContent: '{{ tenantName }} Newsletter - {{ newsletterContent }}',
    variables: ['tenantName', 'monthYear', 'newsletterContent', 'unsubscribeUrl'],
    isActive: false,
    isCustomizable: true,
    usage: { sent: 0, opened: 0, clicked: 0 },
    lastModified: '2024-01-15T09:00:00Z',
    createdBy: 'Sarah Wilson'
  }
];

const availableVariables: TemplateVariable[] = [
  // User variables
  { name: 'userName', description: 'Full name of the user', example: 'John Doe', required: false, category: 'user' },
  { name: 'userEmail', description: 'User email address', example: 'john@example.com', required: false, category: 'user' },
  { name: 'userType', description: 'User type/role', example: 'model', required: false, category: 'user' },
  { name: 'userProfile.avatar', description: 'User avatar URL', example: 'https://...', required: false, category: 'user' },
  
  // Tenant variables
  { name: 'tenantName', description: 'Tenant/brand name', example: 'ClickDami', required: false, category: 'tenant' },
  { name: 'tenantBranding.primaryColor', description: 'Primary brand color', example: '#6366F1', required: false, category: 'tenant' },
  { name: 'tenantBranding.logoUrl', description: 'Brand logo URL', example: 'https://...', required: false, category: 'tenant' },
  { name: 'tenantDomain', description: 'Tenant custom domain', example: 'clickdami.com', required: false, category: 'tenant' },
  
  // Content variables
  { name: 'jobTitle', description: 'Job or casting title', example: 'Fashion Model', required: false, category: 'content' },
  { name: 'status', description: 'Current status', example: 'approved', required: false, category: 'content' },
  { name: 'applicationDate', description: 'Application submission date', example: 'Jan 20, 2024', required: false, category: 'content' },
  { name: 'messageContent', description: 'Message body content', example: 'Hello...', required: false, category: 'content' },
  
  // System variables
  { name: 'activationUrl', description: 'Account activation link', example: 'https://...', required: false, category: 'system' },
  { name: 'actionUrl', description: 'Call-to-action link', example: 'https://...', required: false, category: 'system' },
  { name: 'unsubscribeUrl', description: 'Unsubscribe link', example: 'https://...', required: false, category: 'system' },
  { name: 'currentYear', description: 'Current year', example: '2024', required: false, category: 'system' }
];

// API Functions
async function fetchEmailTemplates(): Promise<EmailTemplate[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockTemplates), 500);
  });
}

async function createEmailTemplate(template: Partial<EmailTemplate>): Promise<EmailTemplate> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      ...template,
      id: Date.now().toString(),
      usage: { sent: 0, opened: 0, clicked: 0 },
      lastModified: new Date().toISOString(),
      createdBy: 'Current User'
    } as EmailTemplate), 500);
  });
}

async function updateEmailTemplate(id: string, template: Partial<EmailTemplate>): Promise<EmailTemplate> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      ...mockTemplates.find(t => t.id === id),
      ...template,
      lastModified: new Date().toISOString()
    } as EmailTemplate), 500);
  });
}

async function sendTestEmail(templateId: string, testEmail: string): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 1000);
  });
}

function getCategoryIcon(category: string) {
  switch (category) {
    case 'system': return <Settings className="h-4 w-4 text-blue-500" />;
    case 'workflow': return <Zap className="h-4 w-4 text-purple-500" />;
    case 'messaging': return <Mail className="h-4 w-4 text-green-500" />;
    case 'marketing': return <Users className="h-4 w-4 text-orange-500" />;
    default: return <FileText className="h-4 w-4" />;
  }
}

function getVariablesByCategory(category: string) {
  return availableVariables.filter(v => v.category === category);
}

export function EmailTemplatesClientPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [selectedTab, setSelectedTab] = useState('templates');
  const [testEmail, setTestEmail] = useState('');

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    subject: '',
    category: 'workflow' as const,
    type: 'notification' as const,
    description: '',
    htmlContent: '',
    textContent: '',
    isActive: true
  });

  // Queries
  const { data: templates, isLoading } = useQuery({
    queryKey: ['email-templates'],
    queryFn: fetchEmailTemplates,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setCreateDialogOpen(false);
      setNewTemplate({
        name: '',
        subject: '',
        category: 'workflow',
        type: 'notification',
        description: '',
        htmlContent: '',
        textContent: '',
        isActive: true
      });
      toast.success('Template created successfully');
    },
    onError: () => {
      toast.error('Failed to create template');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, template }: { id: string; template: Partial<EmailTemplate> }) =>
      updateEmailTemplate(id, template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      setEditingTemplate(null);
      toast.success('Template updated successfully');
    },
    onError: () => {
      toast.error('Failed to update template');
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: ({ templateId, email }: { templateId: string; email: string }) =>
      sendTestEmail(templateId, email),
    onSuccess: () => {
      toast.success('Test email sent successfully');
      setTestEmail('');
    },
    onError: () => {
      toast.error('Failed to send test email');
    },
  });

  const handleCreateTemplate = () => {
    createMutation.mutate(newTemplate);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setCreateDialogOpen(true);
  };

  const handleSendTest = (templateId: string) => {
    if (!testEmail) {
      toast.error('Please enter a test email address');
      return;
    }
    testEmailMutation.mutate({ templateId, email: testEmail });
  };

  const insertVariable = (variable: string) => {
    const variableText = `{{ ${variable} }}`;
    // This would insert the variable at cursor position in the editor
    toast.success(`Variable {{ ${variable} }} copied to clipboard`);
    navigator.clipboard.writeText(variableText);
  };

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  }) || [];

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground">
            Create and manage email templates for notifications and marketing
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTemplate(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Edit Template' : 'Create Email Template'}
              </DialogTitle>
              <DialogDescription>
                Design and configure your email template with MJML
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={editingTemplate?.name || newTemplate.name}
                    onChange={(e) => {
                      if (editingTemplate) {
                        setEditingTemplate({ ...editingTemplate, name: e.target.value });
                      } else {
                        setNewTemplate({ ...newTemplate, name: e.target.value });
                      }
                    }}
                    placeholder="Welcome Email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={editingTemplate?.category || newTemplate.category}
                    onValueChange={(value: any) => {
                      if (editingTemplate) {
                        setEditingTemplate({ ...editingTemplate, category: value });
                      } else {
                        setNewTemplate({ ...newTemplate, category: value });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                      <SelectItem value="messaging">Messaging</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Subject Line</Label>
                <Input
                  id="subject"
                  value={editingTemplate?.subject || newTemplate.subject}
                  onChange={(e) => {
                    if (editingTemplate) {
                      setEditingTemplate({ ...editingTemplate, subject: e.target.value });
                    } else {
                      setNewTemplate({ ...newTemplate, subject: e.target.value });
                    }
                  }}
                  placeholder="Welcome to {{ tenantName }}, {{ userName }}!"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={editingTemplate?.description || newTemplate.description}
                  onChange={(e) => {
                    if (editingTemplate) {
                      setEditingTemplate({ ...editingTemplate, description: e.target.value });
                    } else {
                      setNewTemplate({ ...newTemplate, description: e.target.value });
                    }
                  }}
                  placeholder="Describe when this template is used"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="htmlContent">MJML Content</Label>
                <Textarea
                  id="htmlContent"
                  value={editingTemplate?.htmlContent || newTemplate.htmlContent}
                  onChange={(e) => {
                    if (editingTemplate) {
                      setEditingTemplate({ ...editingTemplate, htmlContent: e.target.value });
                    } else {
                      setNewTemplate({ ...newTemplate, htmlContent: e.target.value });
                    }
                  }}
                  rows={10}
                  className="font-mono text-sm"
                  placeholder="<mjml><mj-body>...</mj-body></mjml>"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTemplate} disabled={createMutation.isPending}>
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              {templates?.filter(t => t.isActive).length || 0} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates?.reduce((sum, t) => sum + t.usage.sent, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates ? 
                Math.round((templates.reduce((sum, t) => sum + t.usage.opened, 0) / 
                           Math.max(templates.reduce((sum, t) => sum + t.usage.sent, 0), 1)) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all templates
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {templates ? 
                Math.round((templates.reduce((sum, t) => sum + t.usage.clicked, 0) / 
                           Math.max(templates.reduce((sum, t) => sum + t.usage.sent, 0), 1)) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average across all templates
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="variables">Variables</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="messaging">Messaging</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          {/* Templates Grid */}
          {filteredTemplates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getCategoryIcon(template.category)}
                        <div>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditTemplate(template)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Template
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Subject</h4>
                      <p className="text-sm text-muted-foreground">{template.subject}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant={template.isActive ? 'default' : 'secondary'}>
                        {template.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {template.category}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-center">
                        <div className="font-medium">{template.usage.sent}</div>
                        <div className="text-muted-foreground">Sent</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{template.usage.opened}</div>
                        <div className="text-muted-foreground">Opened</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium">{template.usage.clicked}</div>
                        <div className="text-muted-foreground">Clicked</div>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="test@example.com"
                          value={testEmail}
                          onChange={(e) => setTestEmail(e.target.value)}
                          className="text-xs"
                        />
                        <Button 
                          size="sm" 
                          onClick={() => handleSendTest(template.id)}
                          disabled={testEmailMutation.isPending}
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No templates found"
              description="Create your first email template to get started"
              action={
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              }
            />
          )}
        </TabsContent>

        <TabsContent value="variables" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Available Template Variables</CardTitle>
              <CardDescription>
                Click on any variable to copy it to your clipboard
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="user" className="space-y-4">
                <TabsList>
                  <TabsTrigger value="user">User</TabsTrigger>
                  <TabsTrigger value="tenant">Tenant</TabsTrigger>
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>

                {['user', 'tenant', 'content', 'system'].map((category) => (
                  <TabsContent key={category} value={category}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {getVariablesByCategory(category).map((variable) => (
                        <Card 
                          key={variable.name} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => insertVariable(variable.name)}
                        >
                          <CardContent className="p-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <code className="text-sm bg-muted px-2 py-1 rounded">
                                  {'{{ ' + variable.name + ' }}'}
                                </code>
                                {variable.required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {variable.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Example: {variable.example}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
              <CardDescription>
                Configure global email settings and SMTP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable email notifications for your marketplace
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow marketing and newsletter emails
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Track email opens and clicks
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">SMTP Configuration</h4>
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    SMTP settings are configured at the platform level. Contact support to customize email delivery.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}