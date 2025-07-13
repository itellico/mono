'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Code,
  Eye,
  Send,
  Download,
  Upload,
  Copy,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  Monitor,
  Smartphone,
  Tablet,
  Mail,
  Settings,
  TestTube,
} from 'lucide-react';

interface ReactEmailTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  component: string;
  props: Record<string, any>;
  previewData: Record<string, any>;
  lastModified: string;
  status: 'active' | 'draft' | 'archived';
  version: string;
}

const mockTemplates: ReactEmailTemplate[] = [
  {
    id: '1',
    name: 'Welcome Email',
    description: 'Welcome new users to the platform',
    category: 'onboarding',
    component: 'WelcomeEmail',
    props: {
      userFirstName: 'string',
      userEmail: 'string',
      tenantName: 'string',
      tenantDomain: 'string',
      systemDomain: 'string',
      systemSupportEmail: 'string',
    },
    previewData: {
      userFirstName: 'John',
      userEmail: 'john@example.com',
      tenantName: 'GoModels',
      tenantDomain: 'mono.com',
      systemDomain: 'https://mono.com',
      systemSupportEmail: 'support@mono.com',
    },
    lastModified: '2024-01-15T10:30:00Z',
    status: 'active',
    version: '1.0.0',
  },
];

export default function ReactEmailTemplatesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTemplate, setSelectedTemplate] = useState<ReactEmailTemplate | null>(null);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: '',
    component: '',
  });

  const { data: templates, isLoading } = useQuery({
    queryKey: ['react-email-templates'],
    queryFn: async (): Promise<ReactEmailTemplate[]> => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockTemplates;
    },
  });

  const { data: previewHtml, isLoading: isPreviewLoading } = useQuery({
    queryKey: ['react-email-preview', selectedTemplate?.id, selectedTemplate?.previewData],
    queryFn: async (): Promise<string> => {
      if (!selectedTemplate) return '';

      // Simulate React Email rendering
      await new Promise(resolve => setTimeout(resolve, 500));

      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${selectedTemplate.name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; }
            .container { max-width: 465px; margin: 40px auto; padding: 20px; border: 1px solid #eaeaea; border-radius: 8px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { width: 160px; height: 48px; margin: 0 auto; }
            .title { font-size: 24px; font-weight: normal; text-align: center; margin: 30px 0; }
            .content { font-size: 14px; line-height: 24px; color: #000; }
            .button { background: #667eea; border-radius: 4px; color: white; font-size: 12px; font-weight: 600; text-decoration: none; text-align: center; padding: 12px 20px; display: inline-block; margin: 32px 0; }
            .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo" style="background: #f0f0f0; display: flex; align-items: center; justify-content: center;">LOGO</div>
            </div>
            <h1 class="title">Welcome to <strong>${selectedTemplate.previewData.tenantName}</strong></h1>
            <div class="content">
              <p>Hello ${selectedTemplate.previewData.userFirstName},</p>
              <p>Welcome to ${selectedTemplate.previewData.tenantName}! We're excited to have you join our modeling platform where talent meets opportunity.</p>
              <div style="text-align: center;">
                <a href="${selectedTemplate.previewData.systemDomain}/dashboard" class="button">Get Started</a>
              </div>
              <p>Here's what you can do next:</p>
              <ul>
                <li>Complete your profile to get discovered by agencies</li>
                <li>Upload your best photos to create a stunning portfolio</li>
                <li>Browse and apply for modeling opportunities</li>
                <li>Connect with other models and industry professionals</li>
              </ul>
              <p>If you have any questions, our support team is here to help at <a href="mailto:${selectedTemplate.previewData.systemSupportEmail}">${selectedTemplate.previewData.systemSupportEmail}</a>.</p>
              <p>Best regards,<br>The ${selectedTemplate.previewData.tenantName} Team</p>
            </div>
            <div class="footer">
              © ${new Date().getFullYear()} ${selectedTemplate.previewData.tenantName}. All rights reserved.
            </div>
          </div>
        </body>
        </html>
      `;
    },
    enabled: !!selectedTemplate,
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (template: typeof newTemplate) => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { ...template, id: Date.now().toString() };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['react-email-templates'] });
      setIsCreateDialogOpen(false);
      setNewTemplate({ name: '', description: '', category: '', component: '' });
      toast({
        title: 'Template created',
        description: 'React Email template has been created successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create template.',
        variant: 'destructive',
      });
    },
  });

  const sendTestEmailMutation = useMutation({
    mutationFn: async (templateId: string) => {
      // Simulate sending test email
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      toast({
        title: 'Test email sent',
        description: 'Check your inbox for the test email.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to send test email.',
        variant: 'destructive',
      });
    },
  });

  const filteredTemplates = templates?.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  }) || [];

  const getPreviewWidth = () => {
    switch (previewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">React Email Templates</h1>
          <p className="text-muted-foreground mt-2">
            Manage React Email templates with live preview and testing.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create React Email Template</DialogTitle>
                <DialogDescription>
                  Create a new React Email template from scratch.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Template Name</Label>
                  <Input
                    id="name"
                    value={newTemplate.name}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Welcome Email"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newTemplate.description}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this template is used for..."
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => setNewTemplate(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="transactional">Transactional</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="notification">Notification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="component">Component Name</Label>
                  <Input
                    id="component"
                    value={newTemplate.component}
                    onChange={(e) => setNewTemplate(prev => ({ ...prev, component: e.target.value }))}
                    placeholder="e.g., WelcomeEmail"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={() => createTemplateMutation.mutate(newTemplate)}
                  disabled={createTemplateMutation.isPending}
                >
                  {createTemplateMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                  Create Template
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="onboarding">Onboarding</SelectItem>
            <SelectItem value="transactional">Transactional</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="notification">Notification</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Templates List */}
        <div className="lg:col-span-1 space-y-4">
          {filteredTemplates.map((template) => (
            <Card 
              key={template.id}
              className={`cursor-pointer transition-colors ${
                selectedTemplate?.id === template.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">{template.name}</CardTitle>
                  <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                    {template.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{template.category}</span>
                  <span>v{template.version}</span>
                </div>

                <div className="flex items-center space-x-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedTemplate(template);
                    }}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      sendTestEmailMutation.mutate(template.id);
                    }}
                    disabled={sendTestEmailMutation.isPending}
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredTemplates.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <Mail className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || categoryFilter !== 'all' 
                    ? 'No templates match your current filters.'
                    : 'Get started by creating your first React Email template.'}
                </p>
                {!searchTerm && categoryFilter === 'all' && (
                  <Button onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card className="h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedTemplate.name}</CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center border rounded-lg p-1">
                      <Button
                        size="sm"
                        variant={previewMode === 'desktop' ? 'default' : 'ghost'}
                        onClick={() => setPreviewMode('desktop')}
                      >
                        <Monitor className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={previewMode === 'tablet' ? 'default' : 'ghost'}
                        onClick={() => setPreviewMode('tablet')}
                      >
                        <Tablet className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={previewMode === 'mobile' ? 'default' : 'ghost'}
                        onClick={() => setPreviewMode('mobile')}
                      >
                        <Smartphone className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => sendTestEmailMutation.mutate(selectedTemplate.id)}
                      disabled={sendTestEmailMutation.isPending}
                    >
                      {sendTestEmailMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                <Tabs defaultValue="preview" className="h-full">
                  <TabsList className="mx-6">
                    <TabsTrigger value="preview">Preview</TabsTrigger>
                    <TabsTrigger value="code">Component Code</TabsTrigger>
                    <TabsTrigger value="props">Props</TabsTrigger>
                  </TabsList>

                  <TabsContent value="preview" className="p-6 pt-4">
                    <div className="border rounded-lg overflow-hidden bg-gray-50">
                      {isPreviewLoading ? (
                        <div className="h-96 flex items-center justify-center">
                          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                        </div>
                      ) : (
                        <div className="flex justify-center p-4">
                          <div style={{ width: getPreviewWidth(), maxWidth: '100%' }}>
                            <iframe
                              srcDoc={previewHtml}
                              className="w-full h-96 border-0 bg-white rounded"
                              title="Email Preview"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="code" className="p-6 pt-4">
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto">
                      <pre className="text-sm">
                        <code>{`import { WelcomeEmail } from '@/emails/templates/WelcomeEmail';

export const ${selectedTemplate.component} = ({
  userFirstName = 'there',
  userEmail = 'user@example.com',
  tenantName = 'GoModels',
  tenantDomain = 'mono.com',
  systemDomain = 'https://mono.com',
  systemSupportEmail = 'support@mono.com',
}: WelcomeEmailProps) => {
  // Component implementation
  return (
    <Html>
      <Head />
      <Preview>Welcome to {tenantName}, {userFirstName}!</Preview>
      <Tailwind>
        <Body className="bg-white my-auto mx-auto font-sans px-2">
          {/* Email content */}
        </Body>
      </Tailwind>
    </Html>
  );
};`}</code>
                      </pre>
                    </div>
                  </TabsContent>

                  <TabsContent value="props" className="p-6 pt-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Template Props</h4>
                      <div className="grid grid-cols-1 gap-4">
                        {Object.entries(selectedTemplate.props).map(([key, type]) => (
                          <div key={key} className="flex items-center justify-between p-3 border rounded">
                            <div>
                              <span className="font-mono text-sm">{key}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {type}
                              </Badge>
                            </div>
                            <Input
                              value={selectedTemplate.previewData[key] || ''}
                              onChange={(e) => {
                                setSelectedTemplate(prev => prev ? {
                                  ...prev,
                                  previewData: {
                                    ...prev.previewData,
                                    [key]: e.target.value
                                  }
                                } : null);
                              }}
                              className="w-48"
                              placeholder={`Enter ${key}...`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Code className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select a template</h3>
                <p className="text-gray-500">
                  Choose a React Email template from the list to preview and edit.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 