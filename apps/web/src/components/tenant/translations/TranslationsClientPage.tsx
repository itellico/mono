'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Globe, 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X,
  Search,
  Filter,
  Download,
  Upload,
  Zap,
  Brain,
  Users,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  MoreHorizontal,
  Eye,
  Star,
  Copy,
  RotateCcw,
  Settings,
  FileText,
  Languages
} from 'lucide-react';
import { toast } from 'sonner';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  rtl: boolean;
  flag: string;
  enabled: boolean;
  isDefault: boolean;
  completionPercentage: number;
}

interface TranslationString {
  id: string;
  key: string;
  namespace: string;
  sourceText: string;
  context?: string;
  variables: string[];
  pluralization?: {
    zero?: string;
    one?: string;
    two?: string;
    few?: string;
    many?: string;
    other?: string;
  };
  translations: Translation[];
  lastModified: string;
  priority: 'high' | 'medium' | 'low';
}

interface Translation {
  id: string;
  languageCode: string;
  translatedText: string;
  status: 'pending' | 'approved' | 'rejected' | 'needs_review';
  method: 'manual' | 'llm_auto' | 'llm_assisted';
  confidenceScore?: number;
  translatedBy?: string;
  reviewedBy?: string;
  lastModified: string;
  llmProvider?: string;
  llmModel?: string;
}

// Mock data
const mockLanguages: Language[] = [
  {
    code: 'en-US',
    name: 'English (US)',
    nativeName: 'English',
    rtl: false,
    flag: '🇺🇸',
    enabled: true,
    isDefault: true,
    completionPercentage: 100
  },
  {
    code: 'es-ES',
    name: 'Spanish (Spain)',
    nativeName: 'Español',
    rtl: false,
    flag: '🇪🇸',
    enabled: true,
    isDefault: false,
    completionPercentage: 87
  },
  {
    code: 'fr-FR',
    name: 'French (France)',
    nativeName: 'Français',
    rtl: false,
    flag: '🇫🇷',
    enabled: true,
    isDefault: false,
    completionPercentage: 65
  },
  {
    code: 'de-DE',
    name: 'German (Germany)',
    nativeName: 'Deutsch',
    rtl: false,
    flag: '🇩🇪',
    enabled: false,
    isDefault: false,
    completionPercentage: 23
  },
  {
    code: 'ar-SA',
    name: 'Arabic (Saudi Arabia)',
    nativeName: 'العربية',
    rtl: true,
    flag: '🇸🇦',
    enabled: false,
    isDefault: false,
    completionPercentage: 0
  }
];

const mockTranslationStrings: TranslationString[] = [
  {
    id: '1',
    key: 'welcome.title',
    namespace: 'common',
    sourceText: 'Welcome to {{ tenantName }}',
    context: 'Main welcome message displayed on homepage',
    variables: ['tenantName'],
    translations: [
      {
        id: '1-es',
        languageCode: 'es-ES',
        translatedText: 'Bienvenido a {{ tenantName }}',
        status: 'approved',
        method: 'llm_auto',
        confidenceScore: 0.95,
        translatedBy: 'AI Assistant',
        lastModified: '2024-01-20T10:30:00Z',
        llmProvider: 'openai',
        llmModel: 'gpt-4'
      },
      {
        id: '1-fr',
        languageCode: 'fr-FR',
        translatedText: 'Bienvenue sur {{ tenantName }}',
        status: 'needs_review',
        method: 'llm_auto',
        confidenceScore: 0.87,
        translatedBy: 'AI Assistant',
        lastModified: '2024-01-19T15:20:00Z',
        llmProvider: 'anthropic',
        llmModel: 'claude-3'
      }
    ],
    lastModified: '2024-01-20T10:30:00Z',
    priority: 'high'
  },
  {
    id: '2',
    key: 'application.status.approved',
    namespace: 'workflow',
    sourceText: 'Your application has been approved',
    context: 'Notification message when application is approved',
    variables: [],
    translations: [
      {
        id: '2-es',
        languageCode: 'es-ES',
        translatedText: 'Su solicitud ha sido aprobada',
        status: 'approved',
        method: 'manual',
        translatedBy: 'Maria Garcia',
        reviewedBy: 'John Smith',
        lastModified: '2024-01-18T14:00:00Z'
      }
    ],
    lastModified: '2024-01-18T14:00:00Z',
    priority: 'medium'
  },
  {
    id: '3',
    key: 'models.count',
    namespace: 'marketplace',
    sourceText: '{count, plural, =0 {No models} =1 {One model} other {# models}}',
    context: 'Model count with pluralization',
    variables: ['count'],
    pluralization: {
      zero: 'No models',
      one: 'One model',
      other: '# models'
    },
    translations: [],
    lastModified: '2024-01-17T09:00:00Z',
    priority: 'low'
  }
];

// API Functions
async function fetchLanguages(): Promise<Language[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockLanguages), 500);
  });
}

async function fetchTranslationStrings(): Promise<TranslationString[]> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(mockTranslationStrings), 500);
  });
}

async function autoTranslate(stringId: string, targetLanguages: string[]): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), 2000);
  });
}

async function updateTranslation(translationId: string, updates: Partial<Translation>): Promise<Translation> {
  return new Promise((resolve) => {
    setTimeout(() => resolve({
      id: translationId,
      languageCode: 'es-ES',
      translatedText: 'Updated text',
      status: 'pending',
      method: 'manual',
      lastModified: new Date().toISOString()
    }), 500);
  });
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'approved': return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'rejected': return <X className="h-4 w-4 text-red-500" />;
    case 'needs_review': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    case 'pending': return <Clock className="h-4 w-4 text-gray-400" />;
    default: return <Clock className="h-4 w-4" />;
  }
}

function getMethodIcon(method: string) {
  switch (method) {
    case 'manual': return <Users className="h-4 w-4 text-blue-500" />;
    case 'llm_auto': return <Brain className="h-4 w-4 text-purple-500" />;
    case 'llm_assisted': return <Zap className="h-4 w-4 text-orange-500" />;
    default: return <FileText className="h-4 w-4" />;
  }
}

function getPriorityBadge(priority: string) {
  const variants = {
    high: 'destructive',
    medium: 'default',
    low: 'secondary'
  } as const;
  
  return (
    <Badge variant={variants[priority as keyof typeof variants] || 'secondary'}>
      {priority}
    </Badge>
  );
}

export function TranslationsClientPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNamespace, setSelectedNamespace] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [editingTranslation, setEditingTranslation] = useState<{ stringId: string; languageCode: string } | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [autoTranslateDialogOpen, setAutoTranslateDialogOpen] = useState(false);
  const [selectedStrings, setSelectedStrings] = useState<string[]>([]);

  // Queries
  const { data: languages, isLoading: loadingLanguages } = useQuery({
    queryKey: ['languages'],
    queryFn: fetchLanguages,
  });

  const { data: translationStrings, isLoading: loadingStrings } = useQuery({
    queryKey: ['translation-strings'],
    queryFn: fetchTranslationStrings,
  });

  // Mutations
  const autoTranslateMutation = useMutation({
    mutationFn: ({ stringId, languages }: { stringId: string; languages: string[] }) =>
      autoTranslate(stringId, languages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translation-strings'] });
      toast.success('Auto-translation completed');
      setAutoTranslateDialogOpen(false);
    },
    onError: () => {
      toast.error('Auto-translation failed');
    },
  });

  const updateTranslationMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Translation> }) =>
      updateTranslation(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['translation-strings'] });
      toast.success('Translation updated successfully');
      setEditDialogOpen(false);
    },
    onError: () => {
      toast.error('Failed to update translation');
    },
  });

  const handleAutoTranslate = (stringId: string) => {
    const enabledLanguages = languages?.filter(l => l.enabled && !l.isDefault).map(l => l.code) || [];
    autoTranslateMutation.mutate({ stringId, languages: enabledLanguages });
  };

  const handleApproveTranslation = (translationId: string) => {
    updateTranslationMutation.mutate({
      id: translationId,
      updates: { status: 'approved', reviewedBy: 'Current User' }
    });
  };

  const handleRejectTranslation = (translationId: string) => {
    updateTranslationMutation.mutate({
      id: translationId,
      updates: { status: 'rejected', reviewedBy: 'Current User' }
    });
  };

  const filteredStrings = translationStrings?.filter(str => {
    const matchesSearch = str.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         str.sourceText.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesNamespace = !selectedNamespace || str.namespace === selectedNamespace;
    const matchesLanguage = !selectedLanguage || str.translations.some(t => t.languageCode === selectedLanguage);
    const matchesStatus = !selectedStatus || str.translations.some(t => t.status === selectedStatus);
    
    return matchesSearch && matchesNamespace && matchesLanguage && matchesStatus;
  }) || [];

  const enabledLanguages = languages?.filter(l => l.enabled) || [];
  const totalStrings = translationStrings?.length || 0;
  const translatedStrings = translationStrings?.filter(s => s.translations.length > 0).length || 0;
  const avgCompletion = languages?.reduce((sum, l) => sum + l.completionPercentage, 0) / (languages?.length || 1) || 0;

  if (loadingLanguages || loadingStrings) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Translations</h1>
          <p className="text-muted-foreground">
            Manage multi-language content for your marketplace
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={autoTranslateDialogOpen} onOpenChange={setAutoTranslateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Brain className="h-4 w-4 mr-2" />
                Auto Translate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Auto Translate with AI</DialogTitle>
                <DialogDescription>
                  Use AI to automatically translate content to all enabled languages
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Alert>
                  <Brain className="h-4 w-4" />
                  <AlertDescription>
                    AI translations will be marked as "needs review" and should be verified by human translators.
                  </AlertDescription>
                </Alert>
                
                <div className="space-y-2">
                  <Label>Target Languages</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {enabledLanguages.filter(l => !l.isDefault).map((language) => (
                      <div key={language.code} className="flex items-center space-x-2">
                        <span className="text-lg">{language.flag}</span>
                        <span className="text-sm">{language.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setAutoTranslateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => handleAutoTranslate('all')}
                    disabled={autoTranslateMutation.isPending}
                  >
                    Start Translation
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Language
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Languages</CardTitle>
            <Languages className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{enabledLanguages.length}</div>
            <p className="text-xs text-muted-foreground">
              {languages?.filter(l => !l.enabled).length} available
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Translation Keys</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStrings}</div>
            <p className="text-xs text-muted-foreground">
              {translatedStrings} translated
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgCompletion)}%</div>
            <p className="text-xs text-muted-foreground">
              Average across languages
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {translationStrings?.reduce((count, str) => 
                count + str.translations.filter(t => t.status === 'needs_review').length, 0
              ) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Need human review
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="translations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="translations">Translations</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="translations" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search translation keys..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedNamespace} onValueChange={setSelectedNamespace}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Namespace" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Namespaces</SelectItem>
                <SelectItem value="common">Common</SelectItem>
                <SelectItem value="workflow">Workflow</SelectItem>
                <SelectItem value="marketplace">Marketplace</SelectItem>
                <SelectItem value="auth">Authentication</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Languages</SelectItem>
                {enabledLanguages.map((language) => (
                  <SelectItem key={language.code} value={language.code}>
                    {language.flag} {language.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="needs_review">Needs Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Translations Table */}
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Key</TableHead>
                    <TableHead>Source Text</TableHead>
                    <TableHead>Languages</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStrings.map((string) => (
                    <TableRow key={string.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{string.key}</div>
                          <div className="text-sm text-muted-foreground">
                            {string.namespace}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md">
                          <p className="text-sm truncate">{string.sourceText}</p>
                          {string.variables.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {string.variables.map((variable) => (
                                <Badge key={variable} variant="outline" className="text-xs">
                                  {variable}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {enabledLanguages.filter(l => !l.isDefault).map((language) => {
                            const translation = string.translations.find(t => t.languageCode === language.code);
                            return (
                              <div
                                key={language.code}
                                className="flex items-center gap-1 text-xs"
                                title={`${language.name}: ${translation?.status || 'missing'}`}
                              >
                                <span className="text-sm">{language.flag}</span>
                                {translation ? getStatusIcon(translation.status) : <X className="h-3 w-3 text-gray-300" />}
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getPriorityBadge(string.priority)}
                      </TableCell>
                      <TableCell>
                        {new Date(string.lastModified).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleAutoTranslate(string.id)}>
                              <Brain className="h-4 w-4 mr-2" />
                              Auto Translate
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Translations
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate Key
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Key
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="languages" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {languages?.map((language) => (
              <Card key={language.code} className={language.enabled ? 'ring-2 ring-primary/20' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{language.flag}</span>
                      <div>
                        <CardTitle className="text-lg">{language.name}</CardTitle>
                        <CardDescription>{language.nativeName}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {language.isDefault && (
                        <Badge variant="default">Default</Badge>
                      )}
                      {language.rtl && (
                        <Badge variant="outline">RTL</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Completion</span>
                      <span>{language.completionPercentage}%</span>
                    </div>
                    <Progress value={language.completionPercentage} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch 
                        checked={language.enabled}
                        disabled={language.isDefault}
                      />
                      <Label className="text-sm">
                        {language.enabled ? 'Enabled' : 'Disabled'}
                      </Label>
                    </div>
                    <Button size="sm" variant="outline">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Translation Settings</CardTitle>
              <CardDescription>
                Configure global translation preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto-translation</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically translate new content using AI
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Human Review Required</Label>
                    <p className="text-sm text-muted-foreground">
                      Require human approval for AI translations
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Fallback to Default Language</Label>
                    <p className="text-sm text-muted-foreground">
                      Show default language when translation is missing
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Translation Memory</Label>
                    <p className="text-sm text-muted-foreground">
                      Remember and suggest similar translations
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">AI Translation Providers</h4>
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">OpenAI</h5>
                      <Switch defaultChecked />
                    </div>
                    <p className="text-sm text-muted-foreground">GPT-4, GPT-3.5 Turbo</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">Anthropic</h5>
                      <Switch defaultChecked />
                    </div>
                    <p className="text-sm text-muted-foreground">Claude 3, Claude 2</p>
                  </Card>
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium">Google</h5>
                      <Switch />
                    </div>
                    <p className="text-sm text-muted-foreground">Gemini Pro, PaLM</p>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}