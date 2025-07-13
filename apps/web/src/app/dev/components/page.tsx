'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Eye,
  Code,
  Layout,
  Database,
  Shield,
  Zap,
  FileText,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle,
  Plus,
  Save,
  Settings,
  Users,
  Key,
  Building2,
  Tags,
  Clock,
  ClockIcon,
  StarIcon,
  BookmarkIcon,
  Globe,
  Crown,
  MapPin,
  Languages,
  Flag,
  Palette,
  TrendingUp,
  Briefcase,
  Headphones,
  UserCheck,
  DollarSign,
  Cog,
  Monitor,
  PenTool,
  BarChart3,
  Calendar as CalendarIcon,
  AlertTriangle,
  User,
  History,
  Search,
  Filter,
  CalendarDays,
  Sliders,
  CheckSquare,
  AlertCircle,
  X,
  PlusCircle
} from 'lucide-react';

// Import actual production components
import { AdminListPage } from '@/components/admin/AdminListPage';
import { PermissionGate } from '@/components/reusable/PermissionGate';
import { ConfirmationModal } from '@/components/admin/shared/ConfirmationModal';
import { AdminEditModal } from '@/components/admin/shared/AdminEditModal';
import { UniversalMediaUploader } from '@/components/media/UniversalMediaUploader';
import { SaveSearchDialog } from '@/components/saved-searches/SaveSearchDialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Slider } from '@/components/ui/slider';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { PasswordInput } from '@/components/ui/password-input';
// For demo purposes, create local formatting functions instead of importing server-side ones
const formatDate = (date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string => {
  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    return new Intl.DateTimeFormat('en-US', options).format(date);
  }
};

// Mock LoadSavedSearchDropdown for demo (since real one requires auth)
const MockLoadSavedSearchDropdown = ({ onLoadSearch, mockSavedSearches, userLocale }: any) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <BookmarkIcon className="h-4 w-4" />
          Saved Searches
          <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
            {mockSavedSearches.length}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <BookmarkIcon className="h-4 w-4" />
          Saved Searches
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {/* Default search first */}
        {mockSavedSearches.filter((s: any) => s.isDefault).map((search: any) => (
          <React.Fragment key={search.id}>
            <DropdownMenuItem
              onClick={() => onLoadSearch(search)}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <StarIcon className="h-4 w-4 text-yellow-500" />
                  <div className="flex flex-col">
                    <span className="font-medium">{search.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(search.createdAt, userLocale)}
                    </span>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  Default
                </Badge>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </React.Fragment>
        ))}
        
        {/* Other searches */}
        {mockSavedSearches.filter((s: any) => !s.isDefault).map((search: any) => (
          <DropdownMenuItem
            key={search.id}
            onClick={() => onLoadSearch(search)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="font-medium">{search.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(search.createdAt, userLocale)}
                  </span>
                </div>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => console.log('Navigate to manage saved searches')}
          className="cursor-pointer text-primary"
        >
          <div className="flex items-center gap-2">
            <BookmarkIcon className="h-4 w-4" />
            Manage Saved Searches
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const formatRelativeTime = (date: Date, locale: string): string => {
  try {
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;

    // For longer periods, just show the date
    return formatDate(date, locale, { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return 'unknown';
  }
};
import type { ColumnConfig, FilterConfig, StatCard, BulkAction } from '@/components/admin/AdminListPage';

export default function ComponentLibraryPage() {
  const router = useRouter();

  // User locale and timezone for formatting examples
  const userLocale = 'en-US';
  const userTimezone = 'America/New_York';
  const userTimeFormat = '12h';

  // Mock data for advanced search filters
  const categoryOptions = [
    { value: 'design', label: 'Design & Creative' },
    { value: 'development', label: 'Web Development' },
    { value: 'marketing', label: 'Digital Marketing' },
    { value: 'writing', label: 'Content Writing' },
    { value: 'photography', label: 'Photography' },
    { value: 'consulting', label: 'Business Consulting' }
  ];

  const tagOptions = [
    { value: 'react', label: 'React' },
    { value: 'nodejs', label: 'Node.js' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'figma', label: 'Figma' },
    { value: 'photoshop', label: 'Photoshop' },
    { value: 'seo', label: 'SEO' },
    { value: 'copywriting', label: 'Copywriting' },
    { value: 'branding', label: 'Branding' }
  ];

  const countryOptions = [
    { value: 'us', label: 'United States' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'de', label: 'Germany' },
    { value: 'fr', label: 'France' },
    { value: 'ca', label: 'Canada' },
    { value: 'au', label: 'Australia' }
  ];

  const cityOptions = [
    { value: 'nyc', label: 'New York City' },
    { value: 'london', label: 'London' },
    { value: 'berlin', label: 'Berlin' },
    { value: 'paris', label: 'Paris' },
    { value: 'toronto', label: 'Toronto' },
    { value: 'sydney', label: 'Sydney' }
  ];

  // Mock saved searches data
  const mockSavedSearches = [
    {
      id: '1',
      name: 'Senior Developers in NYC',
      isDefault: true,
      entityType: 'demo',
      filters: {
        categories: ['development'],
        tags: ['react', 'nodejs'],
        experienceRange: [5, 20],
        location: { country: 'us', city: 'nyc' }
      },
      createdAt: new Date('2024-01-10')
    },
    {
      id: '2',
      name: 'Budget Designers',
      isDefault: false,
      entityType: 'demo',
      filters: {
        categories: ['design'],
        priceRange: [0, 500],
        tags: ['figma', 'photoshop']
      },
      createdAt: new Date('2024-01-08')
    },
    {
      id: '3',
      name: 'Remote Marketing Experts',
      isDefault: false,
      entityType: 'demo',
      filters: {
        categories: ['marketing'],
        tags: ['seo', 'copywriting'],
        remote: true
      },
      createdAt: new Date('2024-01-05')
    },
    {
      id: '4',
      name: 'Local Photographers',
      isDefault: false,
      entityType: 'demo',
      filters: {
        categories: ['photography'],
        radiusKm: 25,
        city: 'berlin'
      },
      createdAt: new Date('2024-01-03')
    }
  ];

  // Sample data for demonstrations
  const [sampleData, setSampleData] = useState([
    { 
      id: '1', 
      name: 'John Doe', 
      email: 'john@example.com',
      status: 'active', 
      role: 'admin',
      created: '2024-01-15',
      lastActive: '2024-01-20'
    },
    { 
      id: '2', 
      name: 'Jane Smith', 
      email: 'jane@example.com',
      status: 'inactive', 
      role: 'user',
      created: '2024-01-10',
      lastActive: '2024-01-18'
    },
    { 
      id: '3', 
      name: 'Bob Johnson', 
      email: 'bob@example.com',
      status: 'pending', 
      role: 'moderator',
      created: '2024-01-05',
      lastActive: '2024-01-19'
    },
  ]);

  // State variables
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saveSearchOpen, setSaveSearchOpen] = useState(false);
  const [dataEntryModalOpen, setDataEntryModalOpen] = useState(false);
  const [confirmTextModalOpen, setConfirmTextModalOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');
  const [openModalOpen, setOpenModalOpen] = useState(false);
  const [deleteConfirmModalOpen, setDeleteConfirmModalOpen] = useState(false);
  const [deleteWithTextModalOpen, setDeleteWithTextModalOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [loadedSearchName, setLoadedSearchName] = useState('');
  const [savedSearchName, setSavedSearchName] = useState('');
  
  // Advanced search filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState([200, 800]);
  const [experienceRange, setExperienceRange] = useState([3, 12]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [radiusKm, setRadiusKm] = useState([50]);
  
  // Modal demo state
  const [newItemData, setNewItemData] = useState({ name: '', description: '', category: '' });
  const [sliderValue, setSliderValue] = useState([50]);
  const [multiSelectValue, setMultiSelectValue] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [searchDateRange, setSearchDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [searchText, setSearchText] = useState('');
  const [searchCategory, setSearchCategory] = useState('');
  const [searchStatus, setSearchStatus] = useState('');
  
  
  // Password demo state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [filters, setFilters] = useState<Record<string, string[]>>({
    status: [],
    role: []
  });
  const [sortConfig, setSortConfig] = useState<{ column: string; direction: 'asc' | 'desc' | null }>({
    column: '',
    direction: null
  });
  const [selectedUser, setSelectedUser] = useState(sampleData[0]);
  const [uploadedMedia, setUploadedMedia] = useState<any[]>([]);
  
  // Edit page demo state
  const [editFormData, setEditFormData] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    bio: 'Senior developer with 10+ years experience',
    country: 'us',
    language: 'en',
    department: 'engineering',
    permissions: 'editor',
    notifications: true,
    newsletter: false,
    apiAccess: true
  });
  const [initialEditData] = useState(editFormData);
  const [editActiveTab, setEditActiveTab] = useState('basic');
  
  // Check if edit form has changes
  const hasEditChanges = JSON.stringify(editFormData) !== JSON.stringify(initialEditData);
  
  // ICON HIERARCHY DEMONSTRATION:
  // 1. Lucide React (preferred) → 2. SVG Libraries → 3. Emoji Fallback
  
  // Countries: Use flag emojis since specialized country React libraries have better SVG flags
  // In production: use react-country-flag or similar for proper SVG flags
  const countryOptionsWithFlags = [
    { value: 'us', label: '🇺🇸 United States', description: 'North America', iconType: 'emoji' },
    { value: 'uk', label: '🇬🇧 United Kingdom', description: 'Europe', iconType: 'emoji' },
    { value: 'ca', label: '🇨🇦 Canada', description: 'North America', iconType: 'emoji' },
    { value: 'au', label: '🇦🇺 Australia', description: 'Oceania', iconType: 'emoji' },
    { value: 'de', label: '🇩🇪 Germany', description: 'Europe', iconType: 'emoji' },
    { value: 'fr', label: '🇫🇷 France', description: 'Europe', iconType: 'emoji' },
    { value: 'jp', label: '🇯🇵 Japan', description: 'Asia', iconType: 'emoji' },
    { value: 'kr', label: '🇰🇷 South Korea', description: 'Asia', iconType: 'emoji' },
    { value: 'br', label: '🇧🇷 Brazil', description: 'South America', iconType: 'emoji' },
    { value: 'in', label: '🇮🇳 India', description: 'Asia', iconType: 'emoji' }
  ];
  
  // Languages: Use flag emojis for visual recognition, but Lucide React icon as backup
  const languageOptions = [
    { value: 'en', label: '🇺🇸 English', description: 'Primary language', iconType: 'emoji', fallbackIcon: Languages },
    { value: 'es', label: '🇪🇸 Español', description: 'Spanish', iconType: 'emoji', fallbackIcon: Languages },
    { value: 'fr', label: '🇫🇷 Français', description: 'French', iconType: 'emoji', fallbackIcon: Languages },
    { value: 'de', label: '🇩🇪 Deutsch', description: 'German', iconType: 'emoji', fallbackIcon: Languages },
    { value: 'it', label: '🇮🇹 Italiano', description: 'Italian', iconType: 'emoji', fallbackIcon: Languages },
    { value: 'pt', label: '🇵🇹 Português', description: 'Portuguese', iconType: 'emoji', fallbackIcon: Languages },
    { value: 'ja', label: '🇯🇵 日本語', description: 'Japanese', iconType: 'emoji', fallbackIcon: Languages },
    { value: 'ko', label: '🇰🇷 한국어', description: 'Korean', iconType: 'emoji', fallbackIcon: Languages }
  ];
  
  // Departments: Use Lucide React icons (FIRST PRIORITY - available in Lucide)
  const departmentOptions = [
    { value: 'engineering', label: 'Engineering', description: 'Software development & tech', icon: Cog, iconType: 'lucide' },
    { value: 'design', label: 'Design', description: 'UI/UX and creative', icon: Palette, iconType: 'lucide' },
    { value: 'marketing', label: 'Marketing', description: 'Growth and campaigns', icon: TrendingUp, iconType: 'lucide' },
    { value: 'sales', label: 'Sales', description: 'Business development', icon: Briefcase, iconType: 'lucide' },
    { value: 'support', label: 'Support', description: 'Customer service', icon: Headphones, iconType: 'lucide' },
    { value: 'hr', label: 'Human Resources', description: 'People operations', icon: UserCheck, iconType: 'lucide' },
    { value: 'finance', label: 'Finance', description: 'Accounting and budgets', icon: DollarSign, iconType: 'lucide' },
    { value: 'operations', label: 'Operations', description: 'Business operations', icon: Monitor, iconType: 'lucide' }
  ];
  
  // Permissions: Use Lucide React icons (FIRST PRIORITY - available in Lucide)
  const permissionOptions = [
    { value: 'viewer', label: 'Viewer', description: 'Read-only access', icon: Eye, iconType: 'lucide' },
    { value: 'editor', label: 'Editor', description: 'Edit content and data', icon: PenTool, iconType: 'lucide' },
    { value: 'admin', label: 'Admin', description: 'Full administrative access', icon: Shield, iconType: 'lucide' },
    { value: 'super_admin', label: 'Super Admin', description: 'Complete system control', icon: Crown, iconType: 'lucide' },
    { value: 'moderator', label: 'Moderator', description: 'Content moderation', icon: UserCheck, iconType: 'lucide' },
    { value: 'analyst', label: 'Analyst', description: 'Data analysis access', icon: BarChart3, iconType: 'lucide' }
  ];
  
  // Auto-save handler for toggles
  const handleToggleAutoSave = async (field: string, value: boolean) => {
    setEditFormData(prev => ({ ...prev, [field]: value }));
    // Simulate auto-save
    console.log(`Auto-saving ${field}:`, value);
    // In real app: await autoSaveField(field, value);
  };
  
  // Manual save handler
  const handleManualSave = async () => {
    console.log('Manually saving all changes:', editFormData);
    // In real app: await saveAllChanges(editFormData);
  };

  // Handle sorting
  const handleSort = (column: string) => {
    let direction: 'asc' | 'desc' | null = 'asc';
    
    if (sortConfig.column === column) {
      if (sortConfig.direction === 'asc') {
        direction = 'desc';
      } else if (sortConfig.direction === 'desc') {
        direction = null;
      }
    }
    
    setSortConfig({ column, direction });
    
    // Sort the data
    if (direction) {
      const sortedData = [...sampleData].sort((a, b) => {
        const aValue = a[column as keyof typeof a];
        const bValue = b[column as keyof typeof b];
        
        if (aValue < bValue) return direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return direction === 'asc' ? 1 : -1;
        return 0;
      });
      setSampleData(sortedData);
    } else {
      // Reset to original order
      setSampleData([
        { 
          id: '1', 
          name: 'John Doe', 
          email: 'john@example.com',
          status: 'active', 
          role: 'admin',
          created: '2024-01-15',
          lastActive: '2024-01-20'
        },
        { 
          id: '2', 
          name: 'Jane Smith', 
          email: 'jane@example.com',
          status: 'inactive', 
          role: 'user',
          created: '2024-01-10',
          lastActive: '2024-01-18'
        },
        { 
          id: '3', 
          name: 'Bob Johnson', 
          email: 'bob@example.com',
          status: 'pending', 
          role: 'moderator',
          created: '2024-01-05',
          lastActive: '2024-01-19'
        },
      ]);
    }
  };

  // Example live pages in the system
  const livePages = [
    {
      title: 'Tenant Management',
      path: '/admin/tenants',
      description: 'Full-featured tenant management with stats cards, filters, search, bulk actions',
      features: ['Stats Cards', 'Advanced Filters', 'Bulk Actions', 'Saved Searches', 'Row Selection']
    },
    {
      title: 'User Management',
      path: '/admin/users',
      description: 'User list with role management and permissions',
      features: ['Role Filters', 'Permission Gates', 'Profile Actions', 'Activity Tracking']
    },
    {
      title: 'Categories',
      path: '/admin/categories',
      description: 'Hierarchical category management with drag-and-drop',
      features: ['Tree View', 'Drag & Drop', 'Nested Categories', 'Bulk Operations']
    },
    {
      title: 'Audit Logs',
      path: '/admin/audit',
      description: 'Comprehensive audit trail with advanced filtering',
      features: ['Time Filters', 'Activity Types', 'User Tracking', 'Export Options']
    },
    {
      title: 'Permissions',
      path: '/admin/permissions',
      description: '4-tab permission management interface',
      features: ['Role Matrix', 'Permission Templates', 'Emergency Access', 'Health Monitoring']
    },
    {
      title: 'Settings',
      path: '/admin/settings',
      description: '14-panel hierarchical settings system',
      features: ['Platform Config', 'Security Settings', 'Media Configuration', 'Operational Modes']
    }
  ];

  return (
    <div className="container mx-auto px-4 py-4 md:py-8 space-y-4 md:space-y-8 max-w-7xl">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold">itellico Mono Component Library</h1>
        <p className="text-base md:text-lg text-muted-foreground">
          Complete component library covering all admin functionality - 30+ sections audited
        </p>
      </div>

      <Alert className="py-3">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="text-sm md:text-base">
          This library showcases actual production components from comprehensive platform audit. 
          Visit live pages to see them in action.
        </AlertDescription>
      </Alert>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 w-full gap-1 h-auto p-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="list-pattern" className="text-xs md:text-sm">List Pattern</TabsTrigger>
          <TabsTrigger value="edit-pattern" className="text-xs md:text-sm">Edit Pattern</TabsTrigger>
          <TabsTrigger value="modals" className="text-xs md:text-sm">Modals</TabsTrigger>
          <TabsTrigger value="forms" className="text-xs md:text-sm">Forms</TabsTrigger>
          <TabsTrigger value="search-pattern" className="text-xs md:text-sm">Search Pattern</TabsTrigger>
          <TabsTrigger value="advanced" className="text-xs md:text-sm">Advanced</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">itellico Mono Component Overview</h2>
            <p className="text-muted-foreground">
              Complete component library covering all admin functionality. Based on comprehensive audit of 30+ admin sections.
            </p>
          </div>

          <div className="grid gap-4 md:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Page Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">• AdminListPage - Primary list pattern</div>
                <div className="text-sm">• Edit Page - Standard edit forms</div>
                <div className="text-sm">• Dashboard - Statistics & overview</div>
                <div className="text-sm">• Server-Client Hybrid pattern</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">• TanStack Query integration</div>
                <div className="text-sm">• Filter & search systems</div>
                <div className="text-sm">• Saved searches</div>
                <div className="text-sm">• Real-time updates</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm">• Enhanced Permission Gates</div>
                <div className="text-sm">• Role-based access control</div>
                <div className="text-sm">• Audit logging</div>
                <div className="text-sm">• Tenant isolation</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Live Admin Pages</h3>
            <p className="text-muted-foreground">
              Click to explore actual production implementations of these patterns.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {livePages.map((page) => (
              <Card 
                key={page.path} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => router.push(page.path)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <CardDescription>{page.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {page.features.map((feature) => (
                      <Badge key={feature} variant="secondary">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* List Pattern Tab */}
        <TabsContent value="list-pattern" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">AdminListPage Component</h2>
            <p className="text-muted-foreground">
              The core component for all admin list pages. Handles search, filters, pagination, bulk actions, and more.
            </p>
          </div>

          {/* Live Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Live Example</CardTitle>
              <CardDescription>
                This is the actual AdminListPage component used in production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdminListPage
                statsCards={[
                  {
                    title: 'Total Users',
                    value: 156,
                    description: 'Active platform users'
                  },
                  {
                    title: 'New Today',
                    value: 12,
                    description: 'Registered today'
                  }
                ]}
                addConfig={{
                  label: 'Add User',
                  onClick: () => console.log('Add clicked'),
                  permission: { action: 'create', resource: 'users' }
                }}
                searchConfig={{
                  placeholder: 'Search users...',
                  value: searchText,
                  onChange: (value) => {
                    setSearchText(value);
                    console.log('Search:', value);
                  }
                }}
                filters={[
                  {
                    key: 'status',
                    title: 'Status',
                    type: 'multiSelect',
                    options: [
                      { label: 'Active', value: 'active' },
                      { label: 'Inactive', value: 'inactive' },
                      { label: 'Pending', value: 'pending' }
                    ]
                  },
                  {
                    key: 'role',
                    title: 'Role',
                    type: 'multiSelect',
                    options: [
                      { label: 'Admin', value: 'admin' },
                      { label: 'User', value: 'user' },
                      { label: 'Moderator', value: 'moderator' }
                    ]
                  }
                ]}
                activeFilters={filters}
                onFilterChange={(key, values) => {
                  setFilters(prev => ({ ...prev, [key]: values }));
                }}
                onClearFilters={() => setFilters({ status: [], role: [] })}
                savedSearchConfig={{
                  entityType: 'users',
                  enabled: true,
                  activeSearchName: savedSearchName,
                  canLoad: true,
                  canSave: true,
                  mockData: mockSavedSearches,
                  onLoadSearch: (config) => {
                    console.log('Loading saved search:', config);
                    // Apply the loaded search configuration
                    setFilters(config.filters as any);
                    setSavedSearchName(config.searchName);
                  },
                  onSaveSearch: (searchData) => {
                    console.log('Saving search:', searchData);
                    setSaveSearchOpen(true);
                  }
                }}
                columns={[
                  {
                    key: 'name',
                    title: 'Name',
                    sortable: true,
                    render: (value) => <span className="font-medium">{value}</span>
                  },
                  {
                    key: 'email',
                    title: 'Email',
                    sortable: true
                  },
                  {
                    key: 'status',
                    title: 'Status',
                    sortable: true,
                    render: (value) => (
                      <Badge variant={value === 'active' ? 'default' : 'secondary'}>
                        {value}
                      </Badge>
                    )
                  },
                  {
                    key: 'role',
                    title: 'Role',
                    sortable: true,
                    render: (value) => (
                      <Badge variant="outline">{value}</Badge>
                    )
                  },
                  {
                    key: 'lastActive',
                    title: 'Last Active',
                    sortable: true
                  }
                ]}
                data={sampleData}
                isLoading={false}
                selectedRows={selectedRows}
                onRowSelect={(id, selected) => {
                  setSelectedRows(prev => {
                    const newSet = new Set(prev);
                    if (selected) {
                      newSet.add(id);
                    } else {
                      newSet.delete(id);
                    }
                    return newSet;
                  });
                }}
                onSelectAll={(selected) => {
                  if (selected) {
                    setSelectedRows(new Set(sampleData.map(d => d.id)));
                  } else {
                    setSelectedRows(new Set());
                  }
                }}
                getRowId={(row) => row.id}
                bulkActions={[
                  {
                    key: 'delete',
                    label: 'Delete Selected',
                    variant: 'destructive',
                    onClick: (ids) => console.log('Delete:', Array.from(ids))
                  }
                ]}
                pagination={{
                  page: 1,
                  limit: 10,
                  total: 3,
                  totalPages: 1
                }}
                onPageChange={(page) => console.log('Page:', page)}
                onLimitChange={(limit) => console.log('Limit:', limit)}
                sortConfig={sortConfig}
                onSort={handleSort}
                renderRowActions={(row) => (
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setSelectedUser(row);
                        setEditModalOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              />
            </CardContent>
          </Card>

          {/* Visual Mockup of Saved Search Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Saved Search Buttons Location</CardTitle>
              <CardDescription>
                Visual mockup showing where the saved search buttons appear in the filter bar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-4 bg-muted/20">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Mock Saved Search Buttons */}
                  <div className="flex items-center gap-1">
                    {/* Load Saved Search Button */}
                    <Button variant="outline" size="sm" className="gap-2">
                      <BookmarkIcon className="h-4 w-4" />
                      Saved Searches
                      <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                        4
                      </Badge>
                    </Button>
                    
                    {/* Save Current Search Button */}
                    <Button variant="outline" size="sm" className="h-8 px-2 gap-1">
                      <BookmarkIcon className="h-3 w-3" />
                      Save
                    </Button>
                  </div>

                  {/* Search Input */}
                  <div className="flex-1 min-w-0 max-w-xs">
                    <Input
                      placeholder="Search users..."
                      className="h-8"
                      disabled
                    />
                  </div>

                  {/* Filter Dropdowns */}
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="sm" className="h-8 gap-1" disabled>
                      <PlusCircle className="h-3 w-3" />
                      Status
                    </Button>
                    <Button variant="outline" size="sm" className="h-8 gap-1" disabled>
                      <PlusCircle className="h-3 w-3" />
                      Role
                    </Button>
                  </div>
                </div>
              </div>
              
              <Alert className="mt-4">
                <BookmarkIcon className="h-4 w-4" />
                <AlertDescription>
                  The saved search buttons appear at the beginning of the filter bar (leftmost position) when you're authenticated and have the proper permissions.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Saved Search Configuration Example */}
          <Card>
            <CardHeader>
              <CardTitle>Saved Search Configuration</CardTitle>
              <CardDescription>
                How to enable saved searches in AdminListPage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`// Enable saved searches by providing savedSearchConfig
<AdminListPage
  // ... other props
  savedSearchConfig={{
    entityType: 'users',
    enabled: true,
    activeSearchName: currentSearchName,
    canLoad: true,
    canSave: true,
    onLoadSearch: (config) => {
      // Apply loaded search configuration
      setFilters(config.filters);
      setSortConfig(config.sortConfig);
      setSearchText(config.searchValue);
    },
    onSaveSearch: (searchData) => {
      // Open save dialog or handle save
      setSaveSearchDialogOpen(true);
    }
  }}
/>

// The saved search buttons (dropdown & save) are automatically 
// rendered in the FilterBar component when savedSearchConfig is provided`}
              </pre>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Edit Pattern Tab */}
        <TabsContent value="edit-pattern" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Standard Edit Page Pattern</h2>
            <p className="text-muted-foreground">
              Complete edit page with tabs, auto-saving toggles, and change detection.
            </p>
          </div>

          {/* Live Edit Page Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Live Edit Page Demonstration</CardTitle>
              <CardDescription>
                Interactive example showing cards, tabs, form fields, auto-saving, and conditional save button
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Edit Page Header */}
              <div className="p-4 md:p-6 border-b">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">Edit User Profile</h1>
                    <p className="text-muted-foreground">Update user information and settings</p>
                    
                    {/* Audit Indicators */}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>Created: Jan 15, 2024</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <History className="h-3 w-3" />
                        <span>Modified: 2 hours ago</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>By: admin@example.com</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    {hasEditChanges && (
                      <Button onClick={handleManualSave} className="gap-2">
                        <Save className="w-4 h-4" />
                        Save Changes
                      </Button>
                    )}
                    {!hasEditChanges && (
                      <Button variant="outline" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        No Changes
                      </Button>
                    )}
                  </div>
                </div>
                {hasEditChanges && (
                  <Alert className="mt-4 border-blue-200 bg-blue-50">
                    <AlertDescription>
                      You have unsaved changes. Click "Save Changes" to persist your modifications.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Edit Form with Tabs */}
              <div className="p-6">
                <Tabs value={editActiveTab} onValueChange={setEditActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="role">Role & Access</TabsTrigger>
                    <TabsTrigger value="settings">Settings</TabsTrigger>
                    <TabsTrigger value="preferences">Preferences</TabsTrigger>
                  </TabsList>

                  {/* Basic Info Tab */}
                  <TabsContent value="basic" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Personal Information</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="demo-name">Full Name</Label>
                            <Input 
                              id="demo-name"
                              value={editFormData.name}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="demo-email">Email Address</Label>
                            <Input 
                              id="demo-email"
                              type="email"
                              value={editFormData.email}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="demo-bio">Biography</Label>
                            <Textarea 
                              id="demo-bio"
                              value={editFormData.bio}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, bio: e.target.value }))}
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Location & Language</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Country
                            </Label>
                            <SearchableSelect
                              value={editFormData.country}
                              onValueChange={(value) => setEditFormData(prev => ({ ...prev, country: value }))}
                              options={countryOptionsWithFlags.map(option => ({
                                value: option.value,
                                label: option.label,
                                description: option.description
                              }))}
                              placeholder="Select country..."
                              searchPlaceholder="Search countries..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Languages className="h-4 w-4" />
                              Language
                            </Label>
                            <SearchableSelect
                              value={editFormData.language}
                              onValueChange={(value) => setEditFormData(prev => ({ ...prev, language: value }))}
                              options={languageOptions.map(option => ({
                                value: option.value,
                                label: option.label,
                                description: option.description
                              }))}
                              placeholder="Select language..."
                              searchPlaceholder="Search languages..."
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Role & Access Tab */}
                  <TabsContent value="role" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Department & Role</CardTitle>
                          <CardDescription>
                            Dropdowns with search functionality and icons
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Building2 className="h-4 w-4" />
                              Department
                            </Label>
                            <SearchableSelect
                              value={editFormData.department}
                              onValueChange={(value) => setEditFormData(prev => ({ ...prev, department: value }))}
                              options={departmentOptions.map(option => ({
                                value: option.value,
                                label: option.label,
                                description: option.description
                              }))}
                              placeholder="Select department..."
                              searchPlaceholder="Search departments..."
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Permission Level
                            </Label>
                            <SearchableSelect
                              value={editFormData.permissions}
                              onValueChange={(value) => setEditFormData(prev => ({ ...prev, permissions: value }))}
                              options={permissionOptions.map(option => ({
                                value: option.value,
                                label: option.label,
                                description: option.description
                              }))}
                              placeholder="Select permission level..."
                              searchPlaceholder="Search permissions..."
                            />
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Access Preview</CardTitle>
                          <CardDescription>
                            Current selection details
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center w-10 h-10 bg-background rounded-lg">
                                {React.createElement(
                                  departmentOptions.find(d => d.value === editFormData.department)?.icon || Cog,
                                  { className: "h-5 w-5 text-muted-foreground" }
                                )}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {departmentOptions.find(d => d.value === editFormData.department)?.label || 'Engineering'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {departmentOptions.find(d => d.value === editFormData.department)?.description || 'Software development & tech'}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                              <div className="flex items-center justify-center w-10 h-10 bg-background rounded-lg">
                                {React.createElement(
                                  permissionOptions.find(p => p.value === editFormData.permissions)?.icon || PenTool,
                                  { className: "h-5 w-5 text-muted-foreground" }
                                )}
                              </div>
                              <div>
                                <div className="font-medium">
                                  {permissionOptions.find(p => p.value === editFormData.permissions)?.label || 'Editor'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {permissionOptions.find(p => p.value === editFormData.permissions)?.description || 'Edit content and data'}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Password Section with Visual Indicators */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Password & Security
                          </CardTitle>
                          <CardDescription>
                            Password fields with strength indicators and validation nodes
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="demo-new-password">New Password</Label>
                            <PasswordInput
                              id="demo-new-password"
                              placeholder="Enter new password"
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              showStrengthIndicator={true}
                              showRequirements={true}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="demo-confirm-password">Confirm Password</Label>
                            <PasswordInput
                              id="demo-confirm-password"
                              placeholder="Confirm new password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {/* Visual Node Indicators */}
                            {confirmPassword && (
                              <div className="flex items-center gap-2 mt-2">
                                {newPassword === confirmPassword ? (
                                  <div className="flex items-center gap-1 text-green-600">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm">Passwords match</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-red-600">
                                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                                    <span className="text-sm">Passwords do not match</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                          {/* Mock Change Password Button */}
                          <div className="pt-4 border-t">
                            <Button 
                              variant="outline" 
                              className="w-full"
                              onClick={() => alert('Change Password Dialog (Mock) - Authentication components removed for demo')}
                            >
                              <Key className="w-4 h-4 mr-2" />
                              Change Password (Mock)
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Toggle Settings with Visual Nodes */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Toggle Settings with Visual Nodes</CardTitle>
                          <CardDescription>
                            Auto-saving toggles with visual feedback indicators
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between py-3 border-b">
                            <div className="space-y-0.5">
                              <Label htmlFor="demo-notifications" className="flex items-center gap-2">
                                Email Notifications
                                {/* Visual Node Indicator */}
                                <div className={`w-2 h-2 rounded-full ${
                                  editFormData.notifications ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                                }`}></div>
                              </Label>
                              <p className="text-sm text-muted-foreground">Receive email updates (auto-saves)</p>
                            </div>
                            <Switch 
                              id="demo-notifications"
                              checked={editFormData.notifications}
                              onCheckedChange={(checked) => handleToggleAutoSave('notifications', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between py-3 border-b">
                            <div className="space-y-0.5">
                              <Label htmlFor="demo-newsletter" className="flex items-center gap-2">
                                Newsletter Subscription
                                {/* Visual Node Indicator */}
                                <div className={`w-2 h-2 rounded-full ${
                                  editFormData.newsletter ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                                }`}></div>
                              </Label>
                              <p className="text-sm text-muted-foreground">Monthly newsletter (auto-saves)</p>
                            </div>
                            <Switch 
                              id="demo-newsletter"
                              checked={editFormData.newsletter}
                              onCheckedChange={(checked) => handleToggleAutoSave('newsletter', checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between py-3">
                            <div className="space-y-0.5">
                              <Label htmlFor="demo-api" className="flex items-center gap-2">
                                API Access
                                {/* Visual Node Indicator */}
                                <div className={`w-2 h-2 rounded-full ${
                                  editFormData.apiAccess ? 'bg-purple-500 animate-pulse' : 'bg-gray-300'
                                }`}></div>
                              </Label>
                              <p className="text-sm text-muted-foreground">Allow API access (auto-saves)</p>
                            </div>
                            <Switch 
                              id="demo-api"
                              checked={editFormData.apiAccess}
                              onCheckedChange={(checked) => handleToggleAutoSave('apiAccess', checked)}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    {/* Color Node Patterns Section */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Visual Node Patterns</CardTitle>
                        <CardDescription>
                          Color-coded nodes for different states and feedback types
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 p-3 border rounded">
                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm">Active/Success</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 border rounded">
                            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm">Processing</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 border rounded">
                            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                            <span className="text-sm">Warning</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 border rounded">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-sm">Error/Failed</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 border rounded">
                            <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                            <span className="text-sm">Premium/Special</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 border rounded">
                            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                            <span className="text-sm">Inactive/Disabled</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 border rounded">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-sm">Pending</span>
                          </div>
                          <div className="flex items-center gap-2 p-3 border rounded">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
                            <span className="text-sm">Info/System</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Preferences Tab */}
                  <TabsContent value="preferences" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Communication Preferences</CardTitle>
                        <CardDescription>
                          Configure how you want to receive updates
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Newsletter Subscription</Label>
                            <div className="text-sm text-muted-foreground">
                              Receive our weekly newsletter
                            </div>
                          </div>
                          <Switch
                            checked={editFormData.newsletter}
                            onCheckedChange={(checked) => handleToggleAutoSave('newsletter', checked)}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          {/* Icon Hierarchy Explanation */}
          <Card>
            <CardHeader>
              <CardTitle>📋 itellico Mono Icon Hierarchy</CardTitle>
              <CardDescription>
                Standard approach for selecting icons across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-medium">1</div>
                      <h4 className="font-medium">Lucide React</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">First priority - always prefer Lucide React icons</p>
                    <div className="flex items-center gap-2">
                      <Cog className="h-4 w-4" />
                      <Palette className="h-4 w-4" />
                      <Shield className="h-4 w-4" />
                      <span className="text-xs">Departments, Permissions</span>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">2</div>
                      <h4 className="font-medium">SVG Libraries</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Second priority - specialized React libraries</p>
                    <div className="text-xs space-y-1">
                      <div>• react-country-flag</div>
                      <div>• react-timezone-select</div>
                      <div>• Custom SVG components</div>
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-sm font-medium">3</div>
                      <h4 className="font-medium">Emoji Fallback</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">Last resort - only when no SVG available</p>
                    <div className="flex items-center gap-1">
                      <span>🇺🇸🇫🇷🇩🇪</span>
                      <span className="text-xs ml-2">Countries, Languages</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">💡 Implementation Example:</h4>
                  <pre className="text-xs overflow-x-auto">
{`// CORRECT: Follow hierarchy for countries
// 1. Try Lucide React first
const countryIcon = Flag; // Generic flag icon

// 2. Use specialized library if available
import ReactCountryFlag from "react-country-flag";
<ReactCountryFlag countryCode="US" svg />

// 3. Fallback to emoji only if needed
const fallback = "🇺🇸";`}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Explanation */}
          <Card>
            <CardHeader>
              <CardTitle>Edit Page Features Demonstrated</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-medium text-green-600">✅ Working Features:</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• Cards with organized form sections</li>
                    <li>• Tabs for separating content areas (4 tabs)</li>
                    <li>• <strong>🔍 Searchable dropdowns</strong> with filter functionality</li>
                    <li>• <strong>🏴‍☠️ Icon hierarchy</strong> following mono platform standards</li>
                    <li>• <strong>🇺🇸 Flag emojis</strong> for countries/languages (appropriate fallback)</li>
                    <li>• <strong>⚙️ Lucide React icons</strong> for departments and roles (first priority)</li>
                    <li>• Change detection (save button appears/disappears)</li>
                    <li>• Auto-saving toggles (immediate save on switch)</li>
                    <li>• Form state management with complex objects</li>
                    <li>• Visual feedback for unsaved changes</li>
                    <li>• Real-time preview of selected options with proper icons</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-medium text-blue-600">🔧 Implementation Notes:</h4>
                  <ul className="text-sm space-y-1 ml-4">
                    <li>• <strong>SearchableSelect</strong> component for all dropdowns</li>
                    <li>• <strong>Icon Hierarchy:</strong> Lucide React → SVG Libraries → Emoji</li>
                    <li>• <strong>Countries/Languages:</strong> Flag emojis (awaiting react-country-flag)</li>
                    <li>• <strong>Departments/Roles:</strong> Lucide React icons (first priority)</li>
                    <li>• Search functionality filters by label, value, description</li>
                    <li>• Use JSON.stringify() for change detection</li>
                    <li>• Separate auto-save vs manual save logic</li>
                    <li>• Cards organize related fields together</li>
                    <li>• Tabs prevent overwhelming single form</li>
                    <li>• Permission gates control edit access</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Modals Tab */}
        <TabsContent value="modals" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Modal Patterns</h2>
            <p className="text-muted-foreground">
              Standard modal patterns for different use cases across the platform.
            </p>
          </div>

          <div className="grid gap-6">
            {/* Confirmation Modal */}
            <Card>
              <CardHeader>
                <CardTitle>Confirmation Modal</CardTitle>
                <CardDescription>
                  Used for destructive actions and important confirmations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="destructive"
                  onClick={() => setDeleteModalOpen(true)}
                >
                  Open Delete Modal
                </Button>

                <ConfirmationModal
                  open={deleteModalOpen}
                  onOpenChange={setDeleteModalOpen}
                  title="Delete Item"
                  description="Are you sure you want to delete this item? This action cannot be undone."
                  confirmText="Delete"
                  variant="destructive"
                  icon="delete"
                  onConfirm={() => {
                    console.log('Deleted!');
                    setDeleteModalOpen(false);
                  }}
                  onCancel={() => setDeleteModalOpen(false)}
                />

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Usage:</h4>
                  <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`<ConfirmationModal
  open={open}
  onOpenChange={setOpen}
  title="Delete Item"
  description="Are you sure?"
  confirmText="Delete"
  variant="destructive"
  icon="delete"
  onConfirm={handleDelete}
  onCancel={handleCancel}
/>`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Edit Modal Pattern */}
            <Card>
              <CardHeader>
                <CardTitle>AdminEditModal Pattern</CardTitle>
                <CardDescription>
                  Generic edit modal with change tracking and validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`// Generic Edit Modal with Type Safety
<AdminEditModal<Category>
  open={editModalOpen}
  onOpenChange={setEditModalOpen}
  title="Edit Category"
  initialData={selectedCategory}
  onSave={async (data) => {
    await updateCategory(data.id, data);
    queryClient.invalidateQueries(['categories']);
  }}
>
  <CategoryEditForm />
</AdminEditModal>

// Features:
- Generic type support <T>
- Automatic change tracking
- Disabled save when no changes
- Loading states
- Form enhancement injection`}
                </pre>
              </CardContent>
            </Card>

            {/* Open/Display Modal */}
            <Card>
              <CardHeader>
                <CardTitle>Open/Display Modal</CardTitle>
                <CardDescription>
                  Simple modal for displaying information or forms without destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="default"
                  onClick={() => setOpenModalOpen(true)}
                >
                  Open Info Modal
                </Button>

                <Dialog open={openModalOpen} onOpenChange={setOpenModalOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>User Profile Information</DialogTitle>
                      <DialogDescription>
                        View and manage user profile details
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Full Name</Label>
                          <Input value="John Doe" readOnly />
                        </div>
                        <div>
                          <Label>Email</Label>
                          <Input value="john@example.com" readOnly />
                        </div>
                      </div>
                      <div>
                        <Label>Bio</Label>
                        <Textarea value="Software developer with 5 years of experience" readOnly />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpenModalOpen(false)}>
                        Close
                      </Button>
                      <Button>Edit Profile</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Usage:</h4>
                  <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div>Content goes here</div>
    <DialogFooter>
      <Button variant="outline">Close</Button>
      <Button>Action</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {/* Delete Modal with Text Confirmation */}
            <Card>
              <CardHeader>
                <CardTitle>Delete with Text Confirmation</CardTitle>
                <CardDescription>
                  Requires typing specific text to confirm destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  variant="destructive"
                  onClick={() => setConfirmTextModalOpen(true)}
                >
                  Delete Project (Text Confirm)
                </Button>

                <Dialog open={confirmTextModalOpen} onOpenChange={setConfirmTextModalOpen}>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-destructive">Delete Project</DialogTitle>
                      <DialogDescription>
                        This action will permanently delete the project "My Project" and all associated data. 
                        This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Alert className="border-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          To confirm deletion, type <strong>DELETE</strong> in the field below:
                        </AlertDescription>
                      </Alert>
                      <div>
                        <Label>Confirmation</Label>
                        <Input 
                          value={confirmationText}
                          onChange={(e) => setConfirmationText(e.target.value)}
                          placeholder="Type DELETE to confirm"
                          className="mt-1"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setConfirmTextModalOpen(false);
                          setConfirmationText('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="destructive"
                        disabled={confirmationText !== 'DELETE'}
                        onClick={() => {
                          console.log('Project deleted!');
                          setConfirmTextModalOpen(false);
                          setConfirmationText('');
                        }}
                      >
                        Delete Project
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">Usage:</h4>
                  <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`const [confirmText, setConfirmText] = useState('');
const requiredText = 'DELETE';

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="text-destructive">
        Delete Project
      </DialogTitle>
    </DialogHeader>
    <Alert className="border-destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        Type <strong>{requiredText}</strong> to confirm
      </AlertDescription>
    </Alert>
    <Input 
      value={confirmText}
      onChange={(e) => setConfirmText(e.target.value)}
      placeholder={\`Type \${requiredText} to confirm\`}
    />
    <DialogFooter>
      <Button 
        variant="destructive"
        disabled={confirmText !== requiredText}
        onClick={handleDelete}
      >
        Delete
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Form Patterns</h2>
            <p className="text-muted-foreground">
              Standard form patterns used throughout the admin interface.
            </p>
          </div>

          <div className="grid gap-6">
            {/* Basic Form Pattern */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Form Pattern</CardTitle>
                <CardDescription>
                  Standard form field structure with validation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`// Standard form field structure
<div className="space-y-2">
  <Label htmlFor="fieldName">Field Label</Label>
  <Input 
    id="fieldName" 
    value={formData.fieldName}
    onChange={(e) => setFormData(prev => ({ 
      ...prev, 
      fieldName: e.target.value 
    }))}
    disabled={isReadOnly}
    placeholder="Enter value..."
  />
  {errors.fieldName && (
    <p className="text-sm text-red-600">{errors.fieldName}</p>
  )}
</div>

// Form state management
const [formData, setFormData] = useState(initialData);
const [errors, setErrors] = useState({});
const [isDirty, setIsDirty] = useState(false);

// Change tracking
const isDirty = JSON.stringify(formData) !== JSON.stringify(initialData);`}
                </pre>
              </CardContent>
            </Card>

            {/* Advanced Form Components */}
            <Card>
              <CardHeader>
                <CardTitle>Advanced Form Components</CardTitle>
                <CardDescription>
                  Specialized form inputs used in the platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h4 className="font-medium">Searchable Select</h4>
                    <div className="border rounded p-2 bg-muted/50">
                      <div className="text-sm text-muted-foreground">Used for large option lists with search</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Multi Select</h4>
                    <div className="border rounded p-2 bg-muted/50">
                      <Badge variant="secondary" className="mr-1">Option 1</Badge>
                      <Badge variant="secondary" className="mr-1">Option 2</Badge>
                      <Button variant="ghost" size="sm">+</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Icon Picker</h4>
                    <div className="border rounded p-2 bg-muted/50 flex items-center">
                      <Database className="h-4 w-4 mr-2" />
                      <span className="text-sm">Selected: Database</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">File Upload</h4>
                    <UniversalMediaUploader
                      context="document"
                      maxFiles={5}
                      onUploadComplete={(assets) => {
                        console.log('Demo upload complete:', assets);
                      }}
                      showOptimizationStatus={true}
                      showPreviews={true}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Universal Media Uploader */}
            <Card>
              <CardHeader>
                <CardTitle>Universal Media Uploader</CardTitle>
                <CardDescription>
                  Multi-purpose reusable file uploader with context-aware configurations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Profile Picture Upload */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Profile Picture Upload</h4>
                    <UniversalMediaUploader
                      context="profile_picture"
                      maxFiles={1}
                      onUploadComplete={(assets) => {
                        console.log('Profile picture uploaded:', assets);
                      }}
                      showOptimizationStatus={true}
                      showPreviews={true}
                    />
                  </div>

                  {/* Portfolio Upload */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Portfolio Upload</h4>
                    <UniversalMediaUploader
                      context="portfolio"
                      maxFiles={10}
                      onUploadComplete={(assets) => {
                        console.log('Portfolio uploaded:', assets);
                      }}
                      showOptimizationStatus={true}
                      showPreviews={true}
                    />
                  </div>

                  {/* Document Upload */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Document Upload</h4>
                    <UniversalMediaUploader
                      context="document"
                      maxFiles={5}
                      onUploadComplete={(assets) => {
                        console.log('Documents uploaded:', assets);
                      }}
                      showOptimizationStatus={false}
                      showPreviews={true}
                    />
                  </div>

                  {/* Application Upload */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Application Upload</h4>
                    <UniversalMediaUploader
                      context="application"
                      contextId="job-123"
                      maxFiles={3}
                      onUploadComplete={(assets) => {
                        console.log('Application files uploaded:', assets);
                      }}
                      showOptimizationStatus={true}
                      showPreviews={true}
                    />
                  </div>
                </div>

                {/* Implementation Code */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Implementation Examples</h4>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`// Basic profile picture upload
<UniversalMediaUploader
  context="profile_picture"
  onUploadComplete={(assets) => updateProfile(assets[0])}
/>

// Portfolio upload with custom limits
<UniversalMediaUploader
  context="portfolio"
  maxFiles={10}
  maxFileSize={25 * 1024 * 1024}
  onUploadComplete={(assets) => addToPortfolio(assets)}
/>

// Application document upload
<UniversalMediaUploader
  context="application"
  contextId={jobId}
  acceptedFormats={['application/pdf', 'image/jpeg']}
  showOptimizationStatus={false}
/>

// Video library upload
<UniversalMediaUploader
  context="video_library"
  maxFiles={5}
  autoOptimize={true}
  onUploadComplete={(assets) => addToVideoLibrary(assets)}
/>`}
                  </pre>
                </div>

                {/* Available Contexts */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Available Upload Contexts</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Badge variant="outline">profile_picture</Badge>
                      <p className="text-sm text-muted-foreground">Single image, optimized for avatars</p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline">compcard</Badge>
                      <p className="text-sm text-muted-foreground">Model comp card images</p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline">portfolio</Badge>
                      <p className="text-sm text-muted-foreground">Multiple images/videos for portfolios</p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline">video_library</Badge>
                      <p className="text-sm text-muted-foreground">Video content with optimization</p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline">voice_portfolio</Badge>
                      <p className="text-sm text-muted-foreground">Audio files for voice talent</p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline">application</Badge>
                      <p className="text-sm text-muted-foreground">Job application documents</p>
                    </div>
                    <div className="space-y-2">
                      <Badge variant="outline">document</Badge>
                      <p className="text-sm text-muted-foreground">General document uploads</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Key Features</h4>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Drag & Drop Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Real-time Progress Tracking</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Context-Aware Validation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Multi-tenant Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Automatic Optimization</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Error Handling & Retry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">File Preview Support</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm">ARIA Accessibility</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Date Picker Components */}
            <Card>
              <CardHeader>
                <CardTitle>Date Picker Components</CardTitle>
                <CardDescription>
                  ShadCN-based date picker components for various use cases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Single Date Picker */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Single Date Picker</h4>
                    <div className="space-y-2">
                      <Label>Select Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-[180px] justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span className="text-sm">Dec 25, 2024</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={new Date()}
                            onSelect={() => {}}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Date Range Picker */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Date Range Picker</h4>
                    <div className="space-y-2">
                      <Label>Select Date Range</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-[220px] justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span className="text-sm">Dec 18 - Dec 25, 2024</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="range"
                            selected={{
                              from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                              to: new Date()
                            }}
                            onSelect={() => {}}
                            numberOfMonths={2}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  {/* Date with Time Picker */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Date with Time</h4>
                    <div className="space-y-2">
                      <Label>Select Date & Time</Label>
                      <div className="flex gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-[140px] justify-start text-left font-normal px-3"
                            >
                              <CalendarIcon className="mr-2 h-3 w-3" />
                              <span className="text-sm">Dec 25, 24</span>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={new Date()}
                              onSelect={() => {}}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <Input
                          type="time"
                          defaultValue="09:00"
                          className="w-[100px] text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Multiple Date Selection */}
                  <div className="space-y-4">
                    <h4 className="font-medium">Multiple Dates</h4>
                    <div className="space-y-2">
                      <Label>Select Multiple Dates</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-[180px] justify-start text-left font-normal"
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            <span className="text-sm">3 selected</span>
                            <Badge variant="secondary" className="ml-auto">3</Badge>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="multiple"
                            selected={[
                              new Date(),
                              new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                              new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
                            ]}
                            onSelect={() => {}}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </div>

                {/* Date Picker Implementation Code */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Implementation Example</h4>
                  <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
{`// Single Date Picker with ShadCN
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"

const [date, setDate] = useState<Date>()

<Popover>
  <PopoverTrigger asChild>
    <Button variant="outline" className="justify-start">
      <CalendarIcon className="mr-2 h-4 w-4" />
      {date ? format(date, "PPP") : "Pick a date"}
    </Button>
  </PopoverTrigger>
  <PopoverContent className="w-auto p-0">
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      initialFocus
    />
  </PopoverContent>
</Popover>

// Date Range Picker
const [dateRange, setDateRange] = useState<DateRange | undefined>()

<Calendar
  mode="range"
  selected={dateRange}
  onSelect={setDateRange}
  numberOfMonths={2}
/>`}
                  </pre>
                </div>

                {/* Date Picker Variants */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Date Picker Variants</h4>
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Compact Style</h5>
                      <Button variant="outline" size="sm" className="w-[140px]">
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        Dec 25, 2024
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">With Icon Only</h5>
                      <Button variant="outline" size="sm" className="w-12 h-8 p-0">
                        <CalendarIcon className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="font-medium text-sm">Disabled State</h5>
                      <Button variant="outline" size="sm" className="w-[140px]" disabled>
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        No date
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Improved Date/Time Picker */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Better Date/Time Combinations</h4>
                  <div className="space-y-4">
                    {/* Inline Date/Time */}
                    <div className="space-y-2">
                      <Label>Inline Date/Time Picker</Label>
                      <div className="inline-flex border rounded-md">
                        <Button
                          variant="ghost"
                          className="h-9 px-3 rounded-r-none border-r"
                        >
                          <CalendarIcon className="mr-2 h-3 w-3" />
                          <span className="text-sm">Dec 25</span>
                        </Button>
                        <Input
                          type="time"
                          defaultValue="14:30"
                          className="h-9 w-20 rounded-l-none border-0 text-sm"
                        />
                      </div>
                    </div>

                    {/* Compact Date Range with Times */}
                    <div className="space-y-2">
                      <Label>Event Duration</Label>
                      <div className="flex items-center gap-2">
                        <div className="inline-flex border rounded-md">
                          <Button
                            variant="ghost"
                            className="h-9 px-2 rounded-r-none border-r"
                          >
                            <CalendarIcon className="h-3 w-3" />
                          </Button>
                          <span className="px-2 py-2 text-sm">Dec 25</span>
                          <Input
                            type="time"
                            defaultValue="09:00"
                            className="h-9 w-16 rounded-l-none border-0 border-l text-sm"
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">to</span>
                        <div className="inline-flex border rounded-md">
                          <Button
                            variant="ghost"
                            className="h-9 px-2 rounded-r-none border-r"
                          >
                            <CalendarIcon className="h-3 w-3" />
                          </Button>
                          <span className="px-2 py-2 text-sm">Dec 25</span>
                          <Input
                            type="time"
                            defaultValue="17:00"
                            className="h-9 w-16 rounded-l-none border-0 border-l text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Mobile-friendly Date/Time */}
                    <div className="space-y-2">
                      <Label>Mobile-Optimized</Label>
                      <div className="space-y-2">
                        <Input
                          type="date"
                          defaultValue="2024-12-25"
                          className="w-[160px] text-sm"
                        />
                        <Input
                          type="time"
                          defaultValue="14:30"
                          className="w-[100px] text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Date Presets */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Quick Date Presets</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">Today</Button>
                    <Button variant="outline" size="sm">Yesterday</Button>
                    <Button variant="outline" size="sm">Last 7 days</Button>
                    <Button variant="outline" size="sm">Last 30 days</Button>
                    <Button variant="outline" size="sm">This month</Button>
                    <Button variant="outline" size="sm">Last month</Button>
                    <Button variant="outline" size="sm">This year</Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Combine presets with the calendar component for improved UX
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Advanced Features</h2>
            <p className="text-muted-foreground">
              Complex components and patterns for advanced functionality.
            </p>
          </div>

          <div className="grid gap-6">
            {/* Audit System */}
            <Card>
              <CardHeader>
                <CardTitle>Audit System Dashboard</CardTitle>
                <CardDescription>
                  Multi-tab interface for comprehensive audit functionality
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2 md:grid-cols-5">
                    <Button variant="outline" size="sm">Overview</Button>
                    <Button variant="outline" size="sm">Audit Logs</Button>
                    <Button variant="outline" size="sm">Versions</Button>
                    <Button variant="outline" size="sm">Locks</Button>
                    <Button variant="outline" size="sm">Analytics</Button>
                  </div>
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Complete audit trail with real-time tracking, version history, and conflict resolution.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={() => router.push('/admin/audit')}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Live Audit System
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Permission System */}
            <Card>
              <CardHeader>
                <CardTitle>Permission Management</CardTitle>
                <CardDescription>
                  4-tab permission interface with role-based access control
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2 md:grid-cols-4">
                    <Button variant="outline" size="sm">Overview</Button>
                    <Button variant="outline" size="sm">Roles</Button>
                    <Button variant="outline" size="sm">Permissions</Button>
                    <Button variant="outline" size="sm">Matrix</Button>
                  </div>
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      Enterprise-grade permission system with emergency access and health monitoring.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={() => router.push('/admin/permissions')}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Live Permission System
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Settings System */}
            <Card>
              <CardHeader>
                <CardTitle>Hierarchical Settings</CardTitle>
                <CardDescription>
                  14-panel settings system with permission-based access
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-1 text-xs">
                    <div className="grid grid-cols-2 gap-1">
                      <Badge variant="outline">Platform Config</Badge>
                      <Badge variant="outline">Security</Badge>
                      <Badge variant="outline">Operational Modes</Badge>
                      <Badge variant="outline">Media Settings</Badge>
                      <Badge variant="outline">Email Config</Badge>
                      <Badge variant="outline">Storage</Badge>
                      <Badge variant="outline">Monitoring</Badge>
                      <Badge variant="outline">More...</Badge>
                    </div>
                  </div>
                  <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                      Comprehensive platform configuration with read-only displays and dangerous operations isolation.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={() => router.push('/admin/settings')}
                    className="w-full"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Live Settings System
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Three-Level Change System */}
            <Card>
              <CardHeader>
                <CardTitle>Three-Level Change System</CardTitle>
                <CardDescription>
                  Advanced change tracking with optimistic updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2 grid-cols-1 md:grid-cols-3">
                    <div className="border rounded p-2 text-center">
                      <div className="text-sm font-medium text-blue-600">Optimistic</div>
                      <div className="text-xs text-muted-foreground">Immediate UI</div>
                    </div>
                    <div className="border rounded p-2 text-center">
                      <div className="text-sm font-medium text-amber-600">Processing</div>
                      <div className="text-xs text-muted-foreground">Server validation</div>
                    </div>
                    <div className="border rounded p-2 text-center">
                      <div className="text-sm font-medium text-green-600">Committed</div>
                      <div className="text-xs text-muted-foreground">Persisted</div>
                    </div>
                  </div>
                  <Alert>
                    <Zap className="h-4 w-4" />
                    <AlertDescription>
                      Enterprise change management with conflict resolution and rollback capabilities.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Modals Tab */}
        <TabsContent value="modals" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Modal Patterns</h2>
            <p className="text-muted-foreground">
              Standard modal patterns for different use cases including confirmation, data entry, and text verification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Delete Modal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="h-5 w-5 text-red-500" />
                  Delete Modal
                </CardTitle>
                <CardDescription>
                  Simple confirmation modal for destructive actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteConfirmModalOpen(true)}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Item
                </Button>
              </CardContent>
            </Card>

            {/* Data Entry Modal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-500" />
                  Data Entry Modal
                </CardTitle>
                <CardDescription>
                  Modal with form inputs for creating new items
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setDataEntryModalOpen(true)}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Item
                </Button>
              </CardContent>
            </Card>

            {/* Delete with Confirmation Text */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Text Confirmation
                </CardTitle>
                <CardDescription>
                  Modal requiring text input to confirm dangerous actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={() => setDeleteWithTextModalOpen(true)}
                  className="w-full bg-red-600 hover:bg-red-700 border-red-700 shadow-sm hover:shadow-red-600/20 hover:shadow-lg transition-all"
                >
                  <AlertTriangle className="w-4 h-4 mr-2 animate-pulse" />
                  Dangerous Action
                  <span className="ml-2 text-xs bg-red-700/50 px-2 py-0.5 rounded-full">⚠️ Irreversible</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Industry Controls Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Model Industry Controls</h3>
            <p className="text-muted-foreground">
              Specialized form controls commonly used in various industries and business models.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sliders and Range Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sliders className="h-5 w-5" />
                  Sliders & Range Controls
                </CardTitle>
                <CardDescription>
                  Price ranges, ratings, percentages, and numerical adjustments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Budget Range ($)</Label>
                  <Slider
                    value={sliderValue}
                    onValueChange={setSliderValue}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$0</span>
                    <span className="font-medium">${sliderValue[0]}k</span>
                    <span>$100k</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label>Price Range</Label>
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1000}
                    min={0}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>${priceRange[0]}</span>
                    <span>${priceRange[1]}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Multi-Select Dropdowns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Multi-Select Controls
                </CardTitle>
                <CardDescription>
                  Categories, tags, skills, and multiple choice selections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Skills & Expertise</Label>
                  <div className="flex flex-wrap gap-2">
                    {['JavaScript', 'React', 'Node.js', 'Python', 'Design', 'Marketing'].map((skill) => (
                      <button
                        key={skill}
                        onClick={() => {
                          setMultiSelectValue(prev => 
                            prev.includes(skill) 
                              ? prev.filter(s => s !== skill)
                              : [...prev, skill]
                          );
                        }}
                        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                          multiSelectValue.includes(skill)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background hover:bg-muted border-border'
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Selected: {multiSelectValue.length} skills
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Industry Categories</Label>
                  <SearchableSelect
                    value={searchCategory}
                    onValueChange={setSearchCategory}
                    options={[
                      { value: 'tech', label: 'Technology', description: 'Software, AI, Hardware' },
                      { value: 'finance', label: 'Finance', description: 'Banking, Investment, Insurance' },
                      { value: 'healthcare', label: 'Healthcare', description: 'Medical, Pharma, Wellness' },
                      { value: 'retail', label: 'Retail', description: 'E-commerce, Stores, Consumer Goods' },
                      { value: 'education', label: 'Education', description: 'Schools, Training, E-learning' },
                      { value: 'media', label: 'Media', description: 'Publishing, Entertainment, News' }
                    ]}
                    placeholder="Select category..."
                    searchPlaceholder="Search categories..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Forms Tab */}
        <TabsContent value="forms" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Form Components with Visual Feedback</h2>
            <p className="text-muted-foreground">
              Advanced form components with password strength indicators, visual nodes, and timezone-aware formatting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Password Components */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Password Components
                </CardTitle>
                <CardDescription>
                  Password inputs with strength indicators and visual validation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password-demo">Password with Strength Indicator</Label>
                  <PasswordInput
                    id="password-demo"
                    placeholder="Enter a secure password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    showStrengthIndicator={true}
                    showRequirements={true}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirm-password-demo">Confirm Password with Node Validation</Label>
                  <PasswordInput
                    id="confirm-password-demo"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {/* Visual Node Feedback */}
                  {confirmPassword && (
                    <div className="flex items-center gap-2 p-2 rounded border">
                      {newPassword === confirmPassword ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-green-600">✓ Passwords match</span>
                        </>
                      ) : (
                        <>
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-sm text-red-600">✗ Passwords do not match</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="current-password-demo">Current Password (Simple)</Label>
                  <PasswordInput
                    id="current-password-demo"
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Date/Time Components */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Timezone-Aware Components
                </CardTitle>
                <CardDescription>
                  Date and time displays that respect user preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Created Date (Full Format)</Label>
                  <div className="p-3 bg-muted rounded border">
                    <div className="font-medium">
                      {formatDate(new Date('2024-01-15T10:30:00Z'), userLocale, {
                        timeZone: userTimezone,
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: userTimeFormat === '12h'
                      })}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      User timezone: {userTimezone}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Last Modified (Relative Time)</Label>
                  <div className="p-3 bg-muted rounded border">
                    <div className="font-medium">
                      {formatRelativeTime(new Date(Date.now() - 2 * 60 * 60 * 1000), userLocale)}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Absolute: {formatDate(new Date(Date.now() - 2 * 60 * 60 * 1000), userLocale, {
                        timeZone: userTimezone,
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: userTimeFormat === '12h'
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <Label>Activity Timestamp (List Format)</Label>
                  <div className="p-3 bg-muted rounded border">
                    <div className="text-sm font-medium">
                      {formatRelativeTime(new Date('2024-01-20T15:45:00Z'), userLocale)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(new Date('2024-01-20T15:45:00Z'), userLocale, {
                        timeZone: userTimezone,
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: userTimeFormat === '12h'
                      })}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Visual Node Reference */}
          <Card>
            <CardHeader>
              <CardTitle>Visual Node Reference Guide</CardTitle>
              <CardDescription>
                Standard color codes for different feedback states across the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Success States</h4>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Valid/Active</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Completed</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Warning States</h4>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Pending</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Review Required</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Error States</h4>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Invalid/Failed</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Critical Error</span>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Info States</h4>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Processing</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                    <span className="text-sm">Premium/Special</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <span className="text-sm">Inactive/Disabled</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Pattern Tab */}
        <TabsContent value="search-pattern" className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Search Patterns</h2>
            <p className="text-muted-foreground">
              Comprehensive search patterns including text search, filters, date ranges, and advanced filtering options.
            </p>
          </div>

          {/* Basic Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Basic Text Search
              </CardTitle>
              <CardDescription>
                Simple text search with placeholder and search icon
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users, content, or anything..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pl-10"
                />
              </div>
              {searchText && (
                <div className="text-sm text-muted-foreground">
                  Searching for: <span className="font-medium">"{searchText}"</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Advanced Search Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Advanced Filters
              </CardTitle>
              <CardDescription>
                Multiple filter types with dropdowns and selections
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <SearchableSelect
                    value={searchStatus}
                    onValueChange={setSearchStatus}
                    options={[
                      { value: 'active', label: 'Active', description: 'Currently active items' },
                      { value: 'inactive', label: 'Inactive', description: 'Disabled or paused items' },
                      { value: 'pending', label: 'Pending', description: 'Awaiting approval' },
                      { value: 'archived', label: 'Archived', description: 'Old or deleted items' }
                    ]}
                    placeholder="All statuses"
                    searchPlaceholder="Search statuses..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Category Filter</Label>
                  <SearchableSelect
                    value={searchCategory}
                    onValueChange={setSearchCategory}
                    options={[
                      { value: 'tech', label: 'Technology', description: 'Software, AI, Hardware' },
                      { value: 'finance', label: 'Finance', description: 'Banking, Investment, Insurance' },
                      { value: 'healthcare', label: 'Healthcare', description: 'Medical, Pharma, Wellness' },
                      { value: 'retail', label: 'Retail', description: 'E-commerce, Stores, Consumer Goods' }
                    ]}
                    placeholder="All categories"
                    searchPlaceholder="Search categories..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Priority Level</Label>
                  <RadioGroup value={searchStatus} onValueChange={setSearchStatus}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="high" id="high" />
                      <Label htmlFor="high" className="text-sm">High Priority</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="medium" id="medium" />
                      <Label htmlFor="medium" className="text-sm">Medium Priority</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="low" id="low" />
                      <Label htmlFor="low" className="text-sm">Low Priority</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Range Search */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Advanced Date Range Search
              </CardTitle>
              <CardDescription>
                Sophisticated date selection with presets and custom ranges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Date Presets */}
              <div className="space-y-2">
                <Label>Quick Select</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setSearchDateRange({ from: today, to: today });
                    }}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setSearchDateRange({ from: yesterday, to: yesterday });
                    }}
                  >
                    Yesterday
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const lastWeek = new Date();
                      lastWeek.setDate(lastWeek.getDate() - 7);
                      setSearchDateRange({ from: lastWeek, to: new Date() });
                    }}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const lastMonth = new Date();
                      lastMonth.setDate(lastMonth.getDate() - 30);
                      setSearchDateRange({ from: lastMonth, to: new Date() });
                    }}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const startOfMonth = new Date();
                      startOfMonth.setDate(1);
                      setSearchDateRange({ from: startOfMonth, to: new Date() });
                    }}
                  >
                    This Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const lastMonth = new Date();
                      lastMonth.setMonth(lastMonth.getMonth() - 1);
                      const startOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1);
                      const endOfLastMonth = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0);
                      setSearchDateRange({ from: startOfLastMonth, to: endOfLastMonth });
                    }}
                  >
                    Last Month
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const startOfYear = new Date(new Date().getFullYear(), 0, 1);
                      setSearchDateRange({ from: startOfYear, to: new Date() });
                    }}
                  >
                    This Year
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const lastYear = new Date().getFullYear() - 1;
                      const startOfLastYear = new Date(lastYear, 0, 1);
                      const endOfLastYear = new Date(lastYear, 11, 31);
                      setSearchDateRange({ from: startOfLastYear, to: endOfLastYear });
                    }}
                  >
                    Last Year
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Custom Date Range */}
              <div className="space-y-4">
                <Label>Custom Range</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">From Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {searchDateRange.from ? searchDateRange.from.toLocaleDateString() : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={searchDateRange.from}
                          onSelect={(date) => setSearchDateRange(prev => ({ ...prev, from: date }))}
                          disabled={(date) => searchDateRange.to ? date > searchDateRange.to : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm text-muted-foreground">To Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {searchDateRange.to ? searchDateRange.to.toLocaleDateString() : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={searchDateRange.to}
                          onSelect={(date) => setSearchDateRange(prev => ({ ...prev, to: date }))}
                          disabled={(date) => searchDateRange.from ? date < searchDateRange.from : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Clear button */}
                {(searchDateRange.from || searchDateRange.to) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSearchDateRange({})}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear dates
                  </Button>
                )}
              </div>

              {/* Date Range Display */}
              {(searchDateRange.from || searchDateRange.to) && (
                <Alert>
                  <CalendarDays className="h-4 w-4" />
                  <AlertDescription>
                    {searchDateRange.from && searchDateRange.to
                      ? `Searching from ${formatDate(searchDateRange.from, userLocale, { dateStyle: 'medium' })} to ${formatDate(searchDateRange.to, userLocale, { dateStyle: 'medium' })}`
                      : searchDateRange.from
                      ? `Searching from ${formatDate(searchDateRange.from, userLocale, { dateStyle: 'medium' })} onwards`
                      : `Searching up to ${formatDate(searchDateRange.to, userLocale, { dateStyle: 'medium' })}`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Saved Search Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookmarkIcon className="h-5 w-5" />
                Saved Search Integration
              </CardTitle>
              <CardDescription>
                Save and load complex search configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {/* Mock LoadSavedSearchDropdown for demo */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <BookmarkIcon className="h-4 w-4" />
                      Saved Searches
                      <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                        {mockSavedSearches.length}
                      </Badge>
                    </Button>
                  </DropdownMenuTrigger>
                  
                  <DropdownMenuContent align="start" className="w-64">
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <BookmarkIcon className="h-4 w-4" />
                      Saved Searches
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Default search first */}
                    {mockSavedSearches.filter(s => s.isDefault).map((search) => (
                      <React.Fragment key={search.id}>
                        <DropdownMenuItem
                          onClick={() => {
                            console.log('Loading saved search:', search);
                            setLoadedSearchName(search.name);
                            // Apply the filters from the saved search
                            if (search.filters.categories) {
                              setSelectedCategories(search.filters.categories);
                            }
                            if (search.filters.tags) {
                              setSelectedTags(search.filters.tags);
                            }
                            if (search.filters.priceRange) {
                              setPriceRange(search.filters.priceRange);
                            }
                            if (search.filters.experienceRange) {
                              setExperienceRange(search.filters.experienceRange);
                            }
                            if (search.filters.location) {
                              setSelectedCountry(search.filters.location.country || '');
                              setSelectedCity(search.filters.location.city || '');
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              <StarIcon className="h-4 w-4 text-yellow-500" />
                              <div className="flex flex-col">
                                <span className="font-medium">{search.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {formatRelativeTime(search.createdAt, userLocale)}
                                </span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Default
                            </Badge>
                          </div>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </React.Fragment>
                    ))}
                    
                    {/* Other searches */}
                    {mockSavedSearches.filter(s => !s.isDefault).map((search) => (
                      <DropdownMenuItem
                        key={search.id}
                        onClick={() => {
                          console.log('Loading saved search:', search);
                          setLoadedSearchName(search.name);
                          // Apply the filters from the saved search
                          if (search.filters.categories) {
                            setSelectedCategories(search.filters.categories);
                          }
                          if (search.filters.tags) {
                            setSelectedTags(search.filters.tags);
                          }
                          if (search.filters.priceRange) {
                            setPriceRange(search.filters.priceRange);
                          }
                          if (search.filters.experienceRange) {
                            setExperienceRange(search.filters.experienceRange);
                          }
                          if (search.filters.location) {
                            setSelectedCountry(search.filters.location.country || '');
                            setSelectedCity(search.filters.location.city || '');
                          }
                          if (search.filters.radiusKm) {
                            setRadiusKm([search.filters.radiusKm]);
                          }
                          if (search.filters.city) {
                            setSelectedCity(search.filters.city);
                          }
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <ClockIcon className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-col">
                              <span className="font-medium">{search.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(search.createdAt, userLocale)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => console.log('Navigate to manage saved searches')}
                      className="cursor-pointer text-primary"
                    >
                      <div className="flex items-center gap-2">
                        <BookmarkIcon className="h-4 w-4" />
                        Manage Saved Searches
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                
                <Button 
                  onClick={() => setSaveSearchOpen(true)}
                  variant="outline"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Current Search
                </Button>
              </div>
              
              <Alert>
                <BookmarkIcon className="h-4 w-4" />
                <AlertDescription>
                  Save complex search configurations to quickly access frequently used filters and criteria.
                </AlertDescription>
              </Alert>
              
              {loadedSearchName && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    Loaded saved search: <strong>{loadedSearchName}</strong>
                  </AlertDescription>
                </Alert>
              )}

              {/* Feature Explanation */}
              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-medium text-sm">How it works:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="font-mono bg-muted px-1 rounded">1.</span>
                    <span>Apply filters using the search components above</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono bg-muted px-1 rounded">2.</span>
                    <span>Click "Save Current Search" to open the save dialog</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono bg-muted px-1 rounded">3.</span>
                    <span>Name your search and optionally set as default</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-mono bg-muted px-1 rounded">4.</span>
                    <span>Load saved searches from the dropdown anytime</span>
                  </div>
                </div>
              </div>

              {/* Integration Example */}
              <div className="mt-4">
                <h4 className="font-medium mb-2 text-sm">Integration Example:</h4>
                <pre className="bg-muted p-3 rounded-md text-sm overflow-x-auto">
{`// In your component
const [saveSearchOpen, setSaveSearchOpen] = useState(false);

// Render SaveSearchDialog
<SaveSearchDialog
  open={saveSearchOpen}
  onOpenChange={setSaveSearchOpen}
  entityType="your-entity"
  currentFilters={activeFilters}
  currentSort={sortConfig}
  currentSearch={searchText}
  onSaved={(savedSearch) => {
    // Handle save success
    toast.success('Search saved!');
  }}
/>`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Multi-Select Dropdowns */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tags className="h-5 w-5" />
                Multi-Select Filters
              </CardTitle>
              <CardDescription>
                Multiple selection dropdowns for categories, tags, and skills
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Categories (Multi-Select)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-normal"
                      >
                        <span className="truncate">
                          {selectedCategories.length > 0
                            ? `${selectedCategories.length} selected`
                            : "Select categories..."}
                        </span>
                        <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="max-h-64 overflow-auto">
                        {categoryOptions.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-2 px-3 py-2 hover:bg-accent cursor-pointer"
                            onClick={() => {
                              if (selectedCategories.includes(option.value)) {
                                setSelectedCategories(selectedCategories.filter(v => v !== option.value));
                              } else {
                                setSelectedCategories([...selectedCategories, option.value]);
                              }
                            }}
                          >
                            <Checkbox
                              checked={selectedCategories.includes(option.value)}
                              className="pointer-events-none"
                            />
                            <Label className="flex-1 cursor-pointer font-normal">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedCategories.map((cat) => {
                        const option = categoryOptions.find(opt => opt.value === cat);
                        return (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {option?.label}
                            <button
                              onClick={() => setSelectedCategories(selectedCategories.filter(c => c !== cat))}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Skills/Tags (Multi-Select)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between text-left font-normal"
                      >
                        <span className="truncate">
                          {selectedTags.length > 0
                            ? `${selectedTags.length} selected`
                            : "Select skills..."}
                        </span>
                        <svg className="ml-2 h-4 w-4 shrink-0 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <div className="max-h-64 overflow-auto">
                        {tagOptions.map((option) => (
                          <div
                            key={option.value}
                            className="flex items-center space-x-2 px-3 py-2 hover:bg-accent cursor-pointer"
                            onClick={() => {
                              if (selectedTags.includes(option.value)) {
                                setSelectedTags(selectedTags.filter(v => v !== option.value));
                              } else {
                                setSelectedTags([...selectedTags, option.value]);
                              }
                            }}
                          >
                            <Checkbox
                              checked={selectedTags.includes(option.value)}
                              className="pointer-events-none"
                            />
                            <Label className="flex-1 cursor-pointer font-normal">
                              {option.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedTags.map((tag) => {
                        const option = tagOptions.find(opt => opt.value === tag);
                        return (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {option?.label}
                            <button
                              onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                              className="ml-1 hover:text-destructive"
                            >
                              ×
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <Alert>
                <Tags className="h-4 w-4" />
                <AlertDescription>
                  Selected: {selectedCategories.length} categories, {selectedTags.length} skills
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Range Sliders */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Range Slider Filters
              </CardTitle>
              <CardDescription>
                Numeric range filters for price, experience, rating, etc.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label>Price Range ($)</Label>
                    <div className="px-2 py-4">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={1000}
                        min={0}
                        step={50}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>${priceRange[0]}</span>
                      <span>${priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label>Experience (Years)</Label>
                    <div className="px-2 py-4">
                      <Slider
                        value={experienceRange}
                        onValueChange={setExperienceRange}
                        max={20}
                        min={0}
                        step={1}
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{experienceRange[0]} years</span>
                      <span>{experienceRange[1]} years</span>
                    </div>
                  </div>
                </div>
              </div>

              <Alert>
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Price: ${priceRange[0]} - ${priceRange[1]} | Experience: {experienceRange[0]} - {experienceRange[1]} years
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Geographic Search Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geographic Search Filters
              </CardTitle>
              <CardDescription>
                Location-based filtering with country, city, and radius options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <SearchableSelect
                    value={selectedCountry}
                    onValueChange={setSelectedCountry}
                    options={countryOptions}
                    placeholder="Select country..."
                    searchPlaceholder="Search countries..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>City</Label>
                  <SearchableSelect
                    value={selectedCity}
                    onValueChange={setSelectedCity}
                    options={cityOptions}
                    placeholder="Select city..."
                    searchPlaceholder="Search cities..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Search Radius</Label>
                  <div className="px-2 py-2">
                    <Slider
                      value={radiusKm}
                      onValueChange={setRadiusKm}
                      max={500}
                      min={5}
                      step={5}
                      className="w-full"
                    />
                  </div>
                  <div className="text-center text-sm text-muted-foreground">
                    {radiusKm[0]} km radius
                  </div>
                </div>
              </div>

              {(selectedCountry || selectedCity) && (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    Searching in: {selectedCity ? cityOptions.find(c => c.value === selectedCity)?.label : ''} 
                    {selectedCountry && selectedCity ? ', ' : ''}
                    {selectedCountry ? countryOptions.find(c => c.value === selectedCountry)?.label : ''}
                    {' '} within {radiusKm[0]} km
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>Advanced Location Options</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="remote" />
                    <Label htmlFor="remote" className="text-sm">Include Remote Work</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="hybrid" />
                    <Label htmlFor="hybrid" className="text-sm">Include Hybrid</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="relocation" />
                    <Label htmlFor="relocation" className="text-sm">Open to Relocation</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="travel" />
                    <Label htmlFor="travel" className="text-sm">Willing to Travel</Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

      </Tabs>

      {/* Guidelines Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Development Guidelines</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <ul className="space-y-2 list-disc pl-5">
            <li>
              <strong>Use AdminListPage</strong> for all list views - handles filters, search, pagination, and bulk actions
            </li>
            <li>
              <strong>Follow Edit Page Pattern</strong> with permission gates and server-side authentication
            </li>
            <li>
              <strong>Include Stats Cards</strong> at the top of list pages to show key metrics
            </li>
            <li>
              <strong>Implement Permission Gates</strong> for all actions that require specific permissions
            </li>
            <li>
              <strong>Use ConfirmationModal</strong> for all destructive actions
            </li>
            <li>
              <strong>Maintain Server-Client Hybrid</strong> pattern for authentication and data loading
            </li>
            <li>
              <strong>Provide Loading States</strong> using Skeleton components consistently
            </li>
            <li>
              <strong>Handle Empty States</strong> with helpful messages and actions
            </li>
            <li>
              <strong>Follow TanStack Query</strong> patterns for all server state management
            </li>
            <li>
              <strong>Implement Audit Logging</strong> for all administrative actions
            </li>
          </ul>
        </CardContent>
      </Card>
      
      {/* Live Modal Demonstrations */}
      <AdminEditModal
        title="Edit User"
        initialData={selectedUser}
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={async (data) => {
          console.log('Saving user data:', data);
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          setSelectedUser({ ...selectedUser, ...data });
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input 
              id="edit-name" 
              defaultValue={selectedUser.name}
              onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input 
              id="edit-email" 
              defaultValue={selectedUser.email}
              onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-role">Role</Label>
            <Input 
              id="edit-role" 
              defaultValue={selectedUser.role}
              onChange={(e) => setSelectedUser({ ...selectedUser, role: e.target.value })}
            />
          </div>
        </div>
      </AdminEditModal>
      
      <SaveSearchDialog
        open={saveSearchOpen}
        onOpenChange={setSaveSearchOpen}
        entityType="demo"
        currentFilters={{
          categories: selectedCategories,
          tags: selectedTags,
          priceRange: priceRange,
          experienceRange: experienceRange,
          country: selectedCountry ? [selectedCountry] : [],
          city: selectedCity ? [selectedCity] : [],
          radius: radiusKm,
          searchText: searchText ? [searchText] : [],
          status: searchStatus ? [searchStatus] : [],
          category: searchCategory ? [searchCategory] : [],
          dateFrom: searchDateRange.from ? [searchDateRange.from.toISOString()] : [],
          dateTo: searchDateRange.to ? [searchDateRange.to.toISOString()] : []
        }}
        currentSort={{
          sortBy: 'name',
          sortOrder: 'asc'
        }}
        currentSearch={searchText}
        currentColumnConfig={{}}
        currentPagination={{ limit: 10 }}
        onSaved={(savedSearch) => {
          console.log('Search saved:', savedSearch);
          // Add the new saved search to our mock data
          const newSearch = {
            id: String(mockSavedSearches.length + 1),
            name: savedSearch.name,
            isDefault: savedSearch.isDefault,
            entityType: 'demo',
            filters: {
              categories: selectedCategories,
              tags: selectedTags,
              priceRange: priceRange,
              experienceRange: experienceRange,
              location: selectedCountry || selectedCity ? { country: selectedCountry, city: selectedCity } : undefined,
              radiusKm: radiusKm[0],
              searchText: searchText || undefined
            },
            createdAt: new Date()
          };
          // In a real app, this would be saved to the database
          console.log('New saved search:', newSearch);
        }}
      />

      {/* Additional Modal Patterns */}
      <ConfirmationModal
        isOpen={deleteConfirmModalOpen}
        onClose={() => setDeleteConfirmModalOpen(false)}
        onConfirm={() => {
          console.log('Item deleted');
          setDeleteConfirmModalOpen(false);
        }}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        variant="destructive"
      />

      {/* Data Entry Modal */}
      <AdminEditModal
        title="Add New Item"
        initialData={newItemData}
        isOpen={dataEntryModalOpen}
        onClose={() => setDataEntryModalOpen(false)}
        onSave={async (data) => {
          console.log('Creating new item:', data);
          setNewItemData({ name: '', description: '', category: '' });
          setDataEntryModalOpen(false);
        }}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-item-name">Item Name</Label>
            <Input 
              id="new-item-name" 
              placeholder="Enter item name"
              value={newItemData.name}
              onChange={(e) => setNewItemData(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-item-description">Description</Label>
            <Textarea 
              id="new-item-description" 
              placeholder="Enter description"
              value={newItemData.description}
              onChange={(e) => setNewItemData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-item-category">Category</Label>
            <SearchableSelect
              value={newItemData.category}
              onValueChange={(value) => setNewItemData(prev => ({ ...prev, category: value }))}
              options={[
                { value: 'tech', label: 'Technology', description: 'Software, AI, Hardware' },
                { value: 'finance', label: 'Finance', description: 'Banking, Investment, Insurance' },
                { value: 'healthcare', label: 'Healthcare', description: 'Medical, Pharma, Wellness' },
                { value: 'retail', label: 'Retail', description: 'E-commerce, Stores, Consumer Goods' }
              ]}
              placeholder="Select category..."
              searchPlaceholder="Search categories..."
            />
          </div>
        </div>
      </AdminEditModal>

      {/* Delete with Text Confirmation Modal */}
      <AdminEditModal
        title="⚠️ Dangerous Action Confirmation"
        initialData={{ confirmText: confirmDeleteText }}
        isOpen={deleteWithTextModalOpen}
        onClose={() => {
          setDeleteWithTextModalOpen(false);
          setConfirmDeleteText('');
        }}
        onSave={async (data) => {
          if (confirmDeleteText === 'DELETE') {
            console.log('Dangerous action confirmed');
            setDeleteWithTextModalOpen(false);
            setConfirmDeleteText('');
          }
        }}
        saveButtonText="🗑️ Yes, Delete Everything"
        saveButtonVariant="destructive"
      >
        <div className="space-y-4">
          <Alert className="border-red-600 bg-red-50 dark:bg-red-950/20">
            <AlertTriangle className="h-4 w-4 text-red-600 animate-pulse" />
            <AlertDescription className="text-red-900 dark:text-red-100">
              <strong className="text-red-600">⚠️ EXTREME WARNING:</strong> This action will <span className="font-bold underline">permanently delete</span> all associated data including:
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>All user records and profiles</li>
                <li>Complete transaction history</li>
                <li>Associated files and media</li>
                <li>Audit logs and backups</li>
              </ul>
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-800">
                This action <span className="font-bold text-red-700 dark:text-red-300">CANNOT BE UNDONE</span> and will take effect immediately.
              </div>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-delete-text" className="text-red-600 font-medium flex items-center gap-2">
              <span className="text-lg">🔴</span> Type "DELETE" to confirm this irreversible action
            </Label>
            <div className="relative">
              <Input 
                id="confirm-delete-text" 
                placeholder="Type DELETE here"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value.toUpperCase())}
                className={cn(
                  "font-mono text-lg tracking-wider transition-all",
                  confirmDeleteText === 'DELETE' 
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20 ring-2 ring-green-500/50' 
                    : confirmDeleteText.length > 0
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20 ring-2 ring-red-500/50'
                    : 'border-red-300'
                )}
              />
              {confirmDeleteText === 'DELETE' && (
                <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600 animate-in zoom-in" />
              )}
              {confirmDeleteText && confirmDeleteText !== 'DELETE' && (
                <X className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-600" />
              )}
            </div>
          </div>
          
          {confirmDeleteText && confirmDeleteText !== 'DELETE' && (
            <div className="flex items-center gap-2 p-2 bg-red-100 dark:bg-red-900/30 rounded-md">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600 font-medium">Please type "DELETE" exactly as shown to confirm.</p>
            </div>
          )}
          
          {confirmDeleteText === 'DELETE' && (
            <div className="flex items-center gap-2 p-2 bg-green-100 dark:bg-green-900/30 rounded-md animate-in slide-in-from-bottom">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <p className="text-sm text-green-600 font-medium">✓ Confirmation text matches. You may now proceed with deletion.</p>
            </div>
          )}
          
          <div className="pt-2 border-t border-red-200 dark:border-red-800">
            <p className="text-xs text-muted-foreground text-center">
              This confirmation dialog is required for compliance and cannot be bypassed.
            </p>
          </div>
        </div>
      </AdminEditModal>
    </div>
  );
}