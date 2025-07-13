'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Settings,
  FileText,
  Users,
  Briefcase,
  Layout,
  Eye,
  Calendar,
  Camera,
  Baby,
  BookOpen,
  Layers,
  User,
  Search as SearchIcon,
  Palette,
  Code,
  Monitor,
  Smartphone,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  Database,
  Building
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { browserLogger } from '@/lib/browser-logger';
// Dynamically import Monaco Editor to avoid SSR issues
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
// Module Types Definition - Updated for GoModels platform elements
const MODULE_TYPES = {
  'model-book': {
    label: 'Model Book',
    description: 'Digital portfolio with multiple pictures and measurements',
    icon: BookOpen,
    color: 'bg-blue-500',
    fields: ['pictures', 'measurements', 'experience', 'skills']
  },
  'set-card': {
    label: 'Set Card',
    description: 'Collection of 5 professional photos for casting',
    icon: Layers,
    color: 'bg-purple-500',
    fields: ['headshot', 'full_body', 'profile', 'action_shot', 'close_up']
  },
  'baby-model-job': {
    label: 'Baby Model Job',
    description: 'Specialized job posting for baby and child models',
    icon: Baby,
    color: 'bg-pink-500',
    fields: ['age_range', 'requirements', 'safety_measures', 'parent_consent']
  },
  'profile-form': {
    label: 'Profile Form',
    description: 'User profile and model portfolio forms',
    icon: Users,
    color: 'bg-green-500',
    fields: ['personal_info', 'measurements', 'experience', 'portfolio']
  },
  'casting-application': {
    label: 'Casting Application',
    description: 'Application form for casting calls and auditions',
    icon: Camera,
    color: 'bg-orange-500',
    fields: ['availability', 'experience', 'photos', 'special_skills']
  },
  'search-interface': {
    label: 'Search Interface',
    description: 'Advanced search and filtering interfaces',
    icon: Search,
    color: 'bg-cyan-500',
    fields: ['filters', 'sorting', 'results_display', 'pagination']
  },
  'detail-page': {
    label: 'Detail Page',
    description: 'Individual item detail pages with rich content',
    icon: Eye,
    color: 'bg-indigo-500',
    fields: ['header', 'gallery', 'details', 'actions']
  },
  'job-module': {
    label: 'Job Module',
    description: 'Job posting and management modules',
    icon: Briefcase,
    color: 'bg-red-500',
    fields: ['job_details', 'requirements', 'application_form', 'deadline']
  }
} as const;
const MODULE_STATUSES = {
  'draft': { label: 'Draft', color: 'bg-gray-500' },
  'published': { label: 'Published', color: 'bg-green-500' },
  'testing': { label: 'Testing', color: 'bg-yellow-500' },
  'archived': { label: 'Archived', color: 'bg-gray-400' }
} as const;
// Default module schema template with comprehensive metadata
const DEFAULT_MODULE_SCHEMA = {
  name: "New Module",
  description: "Module description",
  metadata: {
    form: {
      layout: "form", // form, grid, wizard, tabs
      autoSave: true,
      autoSaveInterval: 30000,
      showProgress: false,
      allowDrafts: true,
      pagination: {
        enabled: false,
        itemsPerPage: 10,
        infiniteScroll: false
      }
    },
    business: {
      requiresParentalConsent: false,
      minimumAge: 18,
      subscriptionTier: "free", // free, basic, premium, enterprise
      requiresApproval: false,
      photoRequirements: {
        minimum: 0,
        maximum: 10,
        allowedTypes: ["jpg", "png", "webp"],
        maxFileSize: "5MB"
      },
      geographicRestrictions: []
    },
    ui: {
      theme: "default",
      showFieldNumbers: false,
      groupFields: true,
      showTooltips: true,
      fieldOrder: "natural", // natural, custom, alphabetical
      editability: {
        userCanEdit: true,
        adminOnlyFields: [],
        readOnlyAfterSubmission: []
      }
    }
  },
  sections: [
    {
      id: "main_section",
      title: "Main Section",
      order: 1,
      collapsible: false,
      fields: [
        {
          id: "sample_field",
          type: "text",
          label: "Sample Field",
          required: false,
          order: 1,
          section: "main_section",
          editable: true,
          validation: {
            minLength: 0,
            maxLength: 100
          },
          help: "This is a sample field"
        }
      ]
    }
  ]
};
// Available schema references for data integration
const AVAILABLE_SCHEMAS = {
  users: {
    name: "Users",
    description: "User account information",
    icon: Users,
    fields: [
      { name: "id", type: "uuid", description: "User ID" },
      { name: "email", type: "string", description: "Email address" },
      { name: "name", type: "string", description: "Full name" },
      { name: "age", type: "number", description: "Age" },
      { name: "location", type: "string", description: "Location" },
      { name: "phone", type: "string", description: "Phone number" }
    ]
  },
  profiles: {
    name: "Profiles",
    description: "Model profiles and portfolios",
    icon: User,
    fields: [
      { name: "id", type: "uuid", description: "Profile ID" },
      { name: "measurements", type: "object", description: "Body measurements" },
      { name: "photos", type: "array", description: "Portfolio photos" },
      { name: "experience", type: "text", description: "Experience description" },
      { name: "skills", type: "array", description: "Skills and specialties" },
      { name: "availability", type: "object", description: "Availability calendar" }
    ]
  },
  jobs: {
    name: "Jobs",
    description: "Job postings and casting calls",
    icon: Briefcase,
    fields: [
      { name: "id", type: "uuid", description: "Job ID" },
      { name: "title", type: "string", description: "Job title" },
      { name: "requirements", type: "object", description: "Job requirements" },
      { name: "pay", type: "number", description: "Payment amount" },
      { name: "location", type: "string", description: "Job location" },
      { name: "dates", type: "object", description: "Job dates" }
    ]
  },
  agencies: {
    name: "Agencies",
    description: "Talent agencies and management",
    icon: Building,
    fields: [
      { name: "id", type: "uuid", description: "Agency ID" },
      { name: "name", type: "string", description: "Agency name" },
      { name: "contact", type: "object", description: "Contact information" },
      { name: "commission", type: "number", description: "Commission rate" },
      { name: "specialties", type: "array", description: "Specialties" }
    ]
  }
};
// Types
interface Module {
  id: string;
  name: string;
  description: string;
  type: keyof typeof MODULE_TYPES;
  status: keyof typeof MODULE_STATUSES;
  tenantId: string;
  tenantName: string;
  schema: any;
  uiSchema: any;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: string;
  usageCount?: number;
}
interface ModuleFilters {
  search: string;
  type: string;
  status: string;
  tenant: string;
}
// Mock data for demonstration - Updated with GoModels-specific modules
const mockModules: Module[] = [
  {
    id: '1',
    name: 'Fashion Model Book',
    description: 'Complete fashion model portfolio with 15-20 professional photos',
    type: 'model-book',
    status: 'published',
    tenantId: 'mono',
    tenantName: 'GoModels.com',
    schema: {
      fields: [
        { name: 'headshots', type: 'image', label: 'Headshots', required: true, maxCount: 5 },
        { name: 'full_body', type: 'image', label: 'Full Body Shots', required: true, maxCount: 5 },
        { name: 'measurements', type: 'object', label: 'Measurements', required: true },
        { name: 'experience', type: 'textarea', label: 'Experience', required: false }
      ]
    },
    uiSchema: {},
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    createdBy: 'admin@mono.com',
    version: '1.2',
    usageCount: 45
  },
  {
    id: '2',
    name: 'Commercial Set Card',
    description: 'Standard 5-photo set card for commercial casting calls',
    type: 'set-card',
    status: 'published',
    tenantId: 'mono',
    tenantName: 'GoModels.com',
    schema: {
      fields: [
        { name: 'headshot', type: 'image', label: 'Headshot', required: true, maxCount: 1 },
        { name: 'full_body', type: 'image', label: 'Full Body', required: true, maxCount: 1 },
        { name: 'profile', type: 'image', label: 'Profile Shot', required: true, maxCount: 1 },
        { name: 'action_shot', type: 'image', label: 'Action Shot', required: true, maxCount: 1 },
        { name: 'close_up', type: 'image', label: 'Close-up', required: true, maxCount: 1 }
      ]
    },
    uiSchema: {},
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-18T16:45:00Z',
    createdBy: 'admin@mono.com',
    version: '1.0',
    usageCount: 78
  },
  {
    id: '3',
    name: 'Baby Model Casting',
    description: 'Specialized job application for baby and toddler models',
    type: 'baby-model-job',
    status: 'testing',
    tenantId: 'mono',
    tenantName: 'GoModels.com',
    schema: {
      fields: [
        { name: 'child_age', type: 'number', label: 'Child Age (months)', required: true },
        { name: 'parent_consent', type: 'boolean', label: 'Parent Consent', required: true },
        { name: 'safety_requirements', type: 'checklist', label: 'Safety Requirements', required: true },
        { name: 'photos', type: 'image', label: 'Recent Photos', required: true, maxCount: 3 }
      ]
    },
    uiSchema: {},
    createdAt: '2024-01-22T11:15:00Z',
    updatedAt: '2024-01-22T11:15:00Z',
    createdBy: 'admin@mono.com',
    version: '0.9',
    usageCount: 12
  },
  {
    id: '4',
    name: 'Talent Search Advanced',
    description: 'Advanced search interface for finding models and talent',
    type: 'search-interface',
    status: 'published',
    tenantId: 'mono',
    tenantName: 'GoModels.com',
    schema: {
      fields: [
        { name: 'age_range', type: 'range', label: 'Age Range', required: false },
        { name: 'location', type: 'location', label: 'Location', required: false },
        { name: 'experience_level', type: 'select', label: 'Experience Level', required: false },
        { name: 'availability', type: 'date_range', label: 'Availability', required: false }
      ]
    },
    uiSchema: {},
    createdAt: '2024-01-05T14:20:00Z',
    updatedAt: '2024-01-25T09:30:00Z',
    createdBy: 'admin@mono.com',
    version: '2.1',
    usageCount: 156
  }
];
// API Functions (mock for now)
const fetchModules = async (filters: ModuleFilters): Promise<Module[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  let filtered = mockModules;
  if (filters.search) {
    filtered = filtered.filter(module => 
      module.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      module.description.toLowerCase().includes(filters.search.toLowerCase())
    );
  }
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter(module => module.type === filters.type);
  }
  if (filters.status && filters.status !== 'all') {
    filtered = filtered.filter(module => module.status === filters.status);
  }
  return filtered;
};
// Components
function ModuleCard({ module, onEdit, onDelete, onDuplicate }: {
  module: Module;
  onEdit: (module: Module) => void;
  onDelete: (module: Module) => void;
  onDuplicate: (module: Module) => void;
}) {
  const moduleType = MODULE_TYPES[module.type];
  const moduleStatus = MODULE_STATUSES[module.status];
  const IconComponent = moduleType.icon;
  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-l-4" style={{ borderLeftColor: moduleType.color.replace('bg-', '#') }}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${moduleType.color} text-white`}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">{module.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(module)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(module)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(module)} className="text-red-600">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className={`${moduleStatus.color} text-white`}>
              {moduleStatus.label}
            </Badge>
            <Badge variant="outline">v{module.version}</Badge>
            {module.usageCount && (
              <Badge variant="outline">{module.usageCount} uses</Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(module.updatedAt).toLocaleDateString()}
          </div>
        </div>
        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Fields: {module.schema?.fields?.length || 0}</span>
            <span className="text-muted-foreground">Type: {moduleType.label}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
function ModuleFilters({ filters, onFiltersChange }: {
  filters: ModuleFilters;
  onFiltersChange: (filters: ModuleFilters) => void;
}) {
  const t = useTranslations('admin-common');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="h-4 w-4 mr-2" />
          {t('moduleManager.filters.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input
          placeholder={t('moduleManager.filters.searchPlaceholder')}
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="md:col-span-2"
        />
        <Select value={filters.type} onValueChange={(value) => onFiltersChange({ ...filters, type: value })}>
          <SelectTrigger>{t('moduleManager.filters.type')}</SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('moduleManager.filters.allTypes')}</SelectItem>
            {Object.keys(MODULE_TYPES).map(key => (
              <SelectItem key={key} value={key}>{MODULE_TYPES[key as keyof typeof MODULE_TYPES].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filters.status} onValueChange={(value) => onFiltersChange({ ...filters, status: value })}>
          <SelectTrigger>{t('moduleManager.filters.status')}</SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('moduleManager.filters.allStatuses')}</SelectItem>
            {Object.keys(MODULE_STATUSES).map(key => (
              <SelectItem key={key} value={key}>{MODULE_STATUSES[key as keyof typeof MODULE_STATUSES].label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
function CreateModuleDialog({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('admin-common');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<keyof typeof MODULE_TYPES>('model-book');
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    browserLogger.info('Creating module', { name, description, type: selectedType });
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t('moduleManager.createDialog.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
           <div>
             <Label htmlFor="module-type">{t('moduleManager.createDialog.typeLabel')}</Label>
             <div className="grid grid-cols-2 gap-2 mt-2">
               {Object.keys(MODULE_TYPES).map(key => {
                 const type = MODULE_TYPES[key as keyof typeof MODULE_TYPES];
                 return (
                   <Button
                     key={key}
                     type="button"
                     variant={selectedType === key ? 'secondary' : 'outline'}
                     onClick={() => setSelectedType(key as keyof typeof MODULE_TYPES)}
                     className="h-auto p-3 flex flex-col items-start"
                   >
                     <type.icon className="h-5 w-5 mb-2" />
                     <span className="font-semibold">{type.label}</span>
                     <span className="text-xs text-muted-foreground text-left">{type.description}</span>
                   </Button>
                 )
               })}
             </div>
           </div>
           <div>
             <Label htmlFor="module-name">{t('moduleManager.createDialog.nameLabel')}</Label>
             <Input id="module-name" value={name} onChange={(e) => setName(e.target.value)} />
           </div>
           <div>
             <Label htmlFor="module-description">{t('moduleManager.createDialog.descriptionLabel')}</Label>
             <Textarea id="module-description" value={description} onChange={(e) => setDescription(e.target.value)} />
           </div>
           <div className="flex justify-end gap-2">
             <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
               {t('common.cancel')}
             </Button>
             <Button type="submit">{t('moduleManager.createDialog.submitButton')}</Button>
           </div>
         </form>
      </DialogContent>
    </Dialog>
  );
}
// Comprehensive Module Editor Dialog
// Visual Module Editor Component
function VisualModuleEditor({ schema, onChange }: {
  schema: any;
  onChange: (schema: any) => void;
}) {
  if (!schema) return <div className="text-center text-muted-foreground">Invalid JSON schema</div>;
  return (
    <div className="space-y-6">
      {/* Module Metadata */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Module Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Module Name</Label>
            <Input 
              value={schema.name || ''} 
              onChange={(e) => onChange({...schema, name: e.target.value})}
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input 
              value={schema.description || ''} 
              onChange={(e) => onChange({...schema, description: e.target.value})}
            />
          </div>
        </div>
      </div>
      {/* Form Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Form Behavior</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Layout Type</Label>
            <Select 
              value={schema.metadata?.form?.layout || 'form'}
              onValueChange={(value) => onChange({
                ...schema, 
                metadata: {
                  ...schema.metadata,
                  form: {...schema.metadata?.form, layout: value}
                }
              })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="form">Standard Form</SelectItem>
                <SelectItem value="grid">Grid Layout</SelectItem>
                <SelectItem value="wizard">Step Wizard</SelectItem>
                <SelectItem value="tabs">Tabbed Interface</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Switch 
              checked={schema.metadata?.form?.autoSave || false}
              onCheckedChange={(checked) => onChange({
                ...schema,
                metadata: {
                  ...schema.metadata,
                  form: {...schema.metadata?.form, autoSave: checked}
                }
              })}
            />
            <Label>Auto-save enabled</Label>
          </div>
        </div>
      </div>
      {/* Business Rules */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Business Rules</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch 
              checked={schema.metadata?.business?.requiresParentalConsent || false}
              onCheckedChange={(checked) => onChange({
                ...schema,
                metadata: {
                  ...schema.metadata,
                  business: {...schema.metadata?.business, requiresParentalConsent: checked}
                }
              })}
            />
            <Label>Requires Parental Consent</Label>
          </div>
          <div>
            <Label>Minimum Age</Label>
            <Input 
              type="number"
              value={schema.metadata?.business?.minimumAge || 18} 
              onChange={(e) => onChange({
                ...schema,
                metadata: {
                  ...schema.metadata,
                  business: {...schema.metadata?.business, minimumAge: parseInt(e.target.value)}
                }
              })}
            />
          </div>
        </div>
      </div>
      {/* Field Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Fields</h3>
        {schema.sections?.map((section: any, sectionIndex: number) => (
          <Card key={section.id}>
            <CardHeader>
              <CardTitle className="text-base">{section.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {section.fields?.map((field: any, fieldIndex: number) => (
                  <div key={field.id} className="flex items-center gap-4 p-3 border rounded">
                    <div className="flex-1">
                      <div className="font-medium">{field.label}</div>
                      <div className="text-sm text-muted-foreground">{field.type}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={field.required} />
                      <Label className="text-sm">Required</Label>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
// Module Preview Component
function ModulePreview({ schema }: { schema: any }) {
  if (!schema) return <div className="text-center text-muted-foreground">Invalid schema</div>;
  return (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">{schema.name}</h2>
        <p className="text-muted-foreground mb-4">{schema.description}</p>
        {/* Metadata Display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-3 rounded">
            <h4 className="font-semibold text-sm">Form Settings</h4>
            <p className="text-xs">Layout: {schema.metadata?.form?.layout || 'form'}</p>
            <p className="text-xs">Auto-save: {schema.metadata?.form?.autoSave ? 'Yes' : 'No'}</p>
          </div>
          <div className="bg-green-50 p-3 rounded">
            <h4 className="font-semibold text-sm">Business Rules</h4>
            <p className="text-xs">Min Age: {schema.metadata?.business?.minimumAge || 18}</p>
            <p className="text-xs">Parental Consent: {schema.metadata?.business?.requiresParentalConsent ? 'Required' : 'Not Required'}</p>
          </div>
        </div>
        {/* Form Preview */}
        <div className="space-y-4">
          {schema.sections?.map((section: any) => (
            <div key={section.id} className="border rounded p-4">
              <h3 className="font-semibold mb-3">{section.title}</h3>
              <div className="space-y-3">
                {section.fields?.map((field: any) => (
                  <div key={field.id} className="space-y-1">
                    <Label className="flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <div className="h-10 bg-gray-100 border rounded px-3 flex items-center text-sm text-muted-foreground">
                      {field.type} field
                    </div>
                    {field.help && (
                      <p className="text-xs text-muted-foreground">{field.help}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export default function ModuleManagerPage() {
  const router = useRouter();
  const [filters, setFilters] = useState<ModuleFilters>({
    search: '',
    type: 'all',
    status: 'all',
    tenant: 'all'
  });
  const [isCreateOpen, setCreateOpen] = useState(false);
  const { toast } = useToast();
  const t = useTranslations('admin-common');
  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['modules', filters],
    queryFn: () => fetchModules(filters),
  });
  const handleEdit = (module: Module) => {
    router.push(`/admin/modules/editor?id=${module.id}`);
  };
  const handleDelete = (module: Module) => {
    toast({
      title: "Delete Module",
      description: `${module.name} has been deleted`,
      variant: "destructive",
    });
  };
  const handleDuplicate = (module: Module) => {
    toast({
      title: "Module Duplicated",
      description: `Created copy of ${module.name}`,
    });
  };
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('moduleManager.title')}</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage platform elements like model books, set cards, and specialized forms
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setCreateOpen(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            {t('moduleManager.buttons.createModule')}
          </Button>
        </div>
      </div>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Model Books</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">Set Cards</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Baby className="h-5 w-5 text-pink-500" />
              <div>
                <p className="text-sm font-medium">Baby Jobs</p>
                <p className="text-2xl font-bold">1</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Layout className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Total Active</p>
                <p className="text-2xl font-bold">{mockModules.filter(m => m.status === 'published').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1">
          <ModuleFilters filters={filters} onFiltersChange={setFilters} />
        </div>
        {/* Modules Grid */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {modules?.map((module) => (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <CreateModuleDialog open={isCreateOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}