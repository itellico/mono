# 🎨 Frontend Developers - itellico Mono Guide

> **Building Modern UI/UX for Creative Industries** - Next.js 15, React 19, and cutting-edge frontend patterns

## 🎯 What You're Building

You'll be creating **premium user interfaces** for a multi-tenant SaaS platform serving the **modeling, film, casting, and creative industries**. Your work will be used by **700,000+ users** including models, photographers, agencies, and casting directors.

### **Frontend Excellence Standards**
- **Performance:** Core Web Vitals > 90 score
- **Accessibility:** WCAG 2.1 AA compliance
- **Responsiveness:** Mobile-first design
- **Design System:** Consistent ShadCN UI components
- **User Experience:** Industry-specific workflows

---

## ⚡ Frontend Stack Overview

### **Core Technologies**

| Technology | Version | Purpose | Your Focus |
|------------|---------|---------|------------|
| **Next.js** | 15.x | React framework with App Router | SSR, routing, performance |
| **React** | 19.x | UI library with latest features | Components, hooks, patterns |
| **TypeScript** | 5.x | Type safety | Interface definitions, type guards |
| **Tailwind CSS** | Latest | Utility-first styling | Responsive design, dark mode |
| **ShadCN UI** | Latest | Component library | Consistent UI patterns |
| **Lucid React** | Latest | Icon library | Consistent iconography |
| **TanStack Query** | Latest | Server state management | Data fetching, caching |
| **Zustand** | Latest | UI state management | Client-side state only |

### **State Management Strategy**

```typescript
// ✅ SERVER STATE: Always use TanStack Query
export function useUsers(tenantId: number) {
  return useQuery({
    queryKey: ['users', tenantId],
    queryFn: () => fetchUsers(tenantId),
    staleTime: 5 * 60 * 1000,
  });
}

// ✅ UI STATE: Use Zustand with shallow comparison
export const useUIStore = create<UIState>()(/* store definition */);

export function UsersList() {
  // Server state via TanStack Query
  const { data: users, isLoading } = useUsers(tenantId);
  
  // UI state via Zustand with useShallow
  const { selectedView, searchQuery } = useUIStore(
    useShallow((state) => ({
      selectedView: state.selectedView,
      searchQuery: state.searchQuery,
    }))
  );
}
```

---

## 🏗️ Architecture Patterns for Frontend

### **App Router Structure**

```
src/app/
├── (admin)/              # Admin-only routes with layout
│   ├── layout.tsx       # Admin layout with sidebar
│   ├── users/           # User management
│   ├── tenants/         # Tenant administration
│   └── settings/        # System settings
├── (auth)/              # Authentication routes
│   ├── signin/
│   ├── signup/
│   └── layout.tsx       # Auth layout
├── dashboard/           # User dashboard
│   ├── layout.tsx       # Dashboard layout
│   ├── profile/
│   ├── portfolio/
│   └── messages/
├── api/                 # API routes (hybrid with Fastify)
├── globals.css          # Global styles
└── layout.tsx           # Root layout
```

### **Component Architecture**

```
src/components/
├── ui/                  # ShadCN UI base components
│   ├── button.tsx
│   ├── input.tsx
│   ├── dialog.tsx
│   └── ...
├── admin/               # Admin-specific components
│   ├── AdminSidebar.tsx
│   ├── AdminListPage.tsx
│   ├── AdminEditPage.tsx
│   └── analytics/
├── dashboard/           # User dashboard components
│   ├── ProfileCard.tsx
│   ├── PortfolioGrid.tsx
│   └── messaging/
├── shared/              # Shared components
│   ├── Header.tsx
│   ├── Footer.tsx
│   ├── LoadingSpinner.tsx
│   └── ErrorBoundary.tsx
└── forms/               # Form components
    ├── UserForm.tsx
    ├── ProfileForm.tsx
    └── ValidationHelpers.tsx
```

---

## 🎨 Design System & Styling

### **Lucid React Icons**

We use **Lucid React** for consistent, beautiful iconography across the platform:

```typescript
// Icon usage patterns
import { 
  User, 
  Camera, 
  Heart, 
  MessageCircle, 
  Settings, 
  Search,
  Upload,
  Download,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  ChevronDown,
  Plus,
  X
} from 'lucide-react';

export function ProfileCard({ profile }: ProfileCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center space-y-0 pb-2">
        <User className="h-4 w-4 text-muted-foreground" />
        <h3 className="ml-2 font-semibold">{profile.name}</h3>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Camera className="h-4 w-4 mr-2" />
            Portfolio
          </Button>
          <Button variant="outline" size="sm">
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </Button>
          <Button variant="ghost" size="sm">
            <Heart className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

#### **Icon Conventions**
- **Size**: Use `h-4 w-4` for inline icons, `h-5 w-5` for buttons, `h-6 w-6` for larger actions
- **Color**: Use `text-muted-foreground` for secondary icons, inherit for primary
- **Spacing**: Add `mr-2` or `ml-2` when icons are next to text
- **Consistency**: Use the same icon for the same action across the platform

#### **Common Icon Patterns**
```typescript
// Navigation icons
<Settings className="h-4 w-4 mr-3" />
<User className="h-4 w-4 mr-3" />
<Camera className="h-4 w-4 mr-3" />

// Action icons
<Edit className="h-4 w-4" />
<Trash2 className="h-4 w-4 text-destructive" />
<Plus className="h-4 w-4" />

// State icons
<Eye className="h-4 w-4" />         // Visible
<EyeOff className="h-4 w-4" />      // Hidden
<Heart className="h-4 w-4" />       // Favorite
<Download className="h-4 w-4" />    // Download
```

### **ShadCN UI Components**

We use **ShadCN UI** for consistent, accessible components:

```typescript
// Base component usage
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function UserEditDialog({ user, isOpen, onClose }: UserEditDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form className="space-y-4">
          <Input 
            placeholder="User name" 
            defaultValue={user.name}
            className="w-full"
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

### **Tailwind CSS Patterns**

#### **Responsive Design**
```typescript
// Mobile-first responsive patterns
<div className="
  grid 
  grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  gap-4 md:gap-6 lg:gap-8
  p-4 md:p-6 lg:p-8
">
  {profiles.map(profile => (
    <ProfileCard key={profile.id} profile={profile} />
  ))}
</div>
```

#### **Dark Mode Support**
```typescript
// Dark mode with CSS variables
<div className="
  bg-background text-foreground
  border border-border
  hover:bg-accent hover:text-accent-foreground
  transition-colors duration-200
">
  <h2 className="text-xl font-semibold text-primary">
    Profile Title
  </h2>
  <p className="text-muted-foreground">
    Profile description
  </p>
</div>
```

#### **Custom Component Patterns**
```typescript
// Reusable component with proper TypeScript
interface ProfileCardProps {
  profile: Profile;
  size?: 'sm' | 'md' | 'lg';
  showActions?: boolean;
  className?: string;
}

export function ProfileCard({ 
  profile, 
  size = 'md', 
  showActions = true,
  className 
}: ProfileCardProps) {
  const sizeClasses = {
    sm: 'p-3 text-sm',
    md: 'p-4 text-base',
    lg: 'p-6 text-lg'
  };

  return (
    <div className={cn(
      'bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow',
      sizeClasses[size],
      className
    )}>
      {/* Component content */}
    </div>
  );
}
```

---

## 📊 Data Fetching & State Management

### **TanStack Query Patterns**

#### **Query Key Factories**
```typescript
// Consistent query key patterns
export const profileKeys = {
  all: (tenantId: number) => ['profiles', tenantId] as const,
  lists: (tenantId: number) => [...profileKeys.all(tenantId), 'list'] as const,
  list: (tenantId: number, filters: ProfileFilters) => 
    [...profileKeys.lists(tenantId), filters] as const,
  details: (tenantId: number) => [...profileKeys.all(tenantId), 'detail'] as const,
  detail: (tenantId: number, id: number) => 
    [...profileKeys.details(tenantId), id] as const,
};
```

#### **Custom Hooks**
```typescript
// Profile data fetching hooks
export function useProfiles(tenantId: number, filters: ProfileFilters = {}) {
  return useQuery({
    queryKey: profileKeys.list(tenantId, filters),
    queryFn: () => fetchProfiles(tenantId, filters),
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProfile(tenantId: number, profileId: number) {
  return useQuery({
    queryKey: profileKeys.detail(tenantId, profileId),
    queryFn: () => fetchProfile(tenantId, profileId),
    enabled: !!tenantId && !!profileId,
  });
}

// Mutation with optimistic updates
export function useUpdateProfile(tenantId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: UpdateProfileData) => updateProfile(tenantId, data),
    onMutate: async (newProfile) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ 
        queryKey: profileKeys.lists(tenantId) 
      });
      
      // Snapshot previous value
      const previousProfiles = queryClient.getQueryData(
        profileKeys.lists(tenantId)
      );
      
      // Optimistically update cache
      queryClient.setQueryData(
        profileKeys.detail(tenantId, newProfile.id),
        newProfile
      );
      
      return { previousProfiles };
    },
    onError: (err, newProfile, context) => {
      // Rollback on error
      queryClient.setQueryData(
        profileKeys.lists(tenantId),
        context?.previousProfiles
      );
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ 
        queryKey: profileKeys.all(tenantId) 
      });
    },
  });
}
```

### **Zustand UI State Management**

```typescript
// UI-only state store
interface UIState {
  // View preferences
  profileView: 'grid' | 'list';
  gridColumns: 2 | 3 | 4;
  
  // Modal states
  isProfileModalOpen: boolean;
  isConfirmModalOpen: boolean;
  activeProfileId: number | null;
  
  // Form states
  searchQuery: string;
  activeFilters: ProfileFilters;
  
  // Actions
  setProfileView: (view: 'grid' | 'list') => void;
  setGridColumns: (columns: 2 | 3 | 4) => void;
  openProfileModal: (profileId: number) => void;
  closeProfileModal: () => void;
  setSearchQuery: (query: string) => void;
  updateFilters: (filters: Partial<ProfileFilters>) => void;
}

export const useUIStore = create<UIState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set) => ({
          // Initial state
          profileView: 'grid',
          gridColumns: 3,
          isProfileModalOpen: false,
          isConfirmModalOpen: false,
          activeProfileId: null,
          searchQuery: '',
          activeFilters: {},
          
          // Actions
          setProfileView: (view) => set((state) => {
            state.profileView = view;
          }),
          
          setGridColumns: (columns) => set((state) => {
            state.gridColumns = columns;
          }),
          
          openProfileModal: (profileId) => set((state) => {
            state.isProfileModalOpen = true;
            state.activeProfileId = profileId;
          }),
          
          closeProfileModal: () => set((state) => {
            state.isProfileModalOpen = false;
            state.activeProfileId = null;
          }),
          
          setSearchQuery: (query) => set((state) => {
            state.searchQuery = query;
          }),
          
          updateFilters: (filters) => set((state) => {
            state.activeFilters = { ...state.activeFilters, ...filters };
          }),
        }))
      ),
      {
        name: 'mono-ui-store',
        partialize: (state) => ({
          // Only persist UI preferences
          profileView: state.profileView,
          gridColumns: state.gridColumns,
        }),
      }
    ),
    { name: 'UI Store' }
  )
);
```

---

## 🔄 Industry-Specific UI Patterns

### **Model Portfolio Grid**

```typescript
// Model portfolio with optimized image loading
interface ModelPortfolioProps {
  modelId: number;
  tenantId: number;
}

export function ModelPortfolio({ modelId, tenantId }: ModelPortfolioProps) {
  const { data: portfolio, isLoading } = useModelPortfolio(tenantId, modelId);
  const { gridColumns, setGridColumns } = useUIStore(
    useShallow((state) => ({
      gridColumns: state.gridColumns,
      setGridColumns: state.setGridColumns,
    }))
  );

  if (isLoading) {
    return <PortfolioSkeleton />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Portfolio</h2>
        <div className="flex space-x-2">
          {[2, 3, 4].map((cols) => (
            <Button
              key={cols}
              variant={gridColumns === cols ? 'default' : 'outline'}
              size="sm"
              onClick={() => setGridColumns(cols as 2 | 3 | 4)}
            >
              {cols}
            </Button>
          ))}
        </div>
      </div>
      
      <div className={cn(
        'grid gap-4',
        {
          'grid-cols-2': gridColumns === 2,
          'grid-cols-3': gridColumns === 3,
          'grid-cols-4': gridColumns === 4,
        }
      )}>
        {portfolio?.images.map((image) => (
          <div
            key={image.id}
            className="aspect-square relative group overflow-hidden rounded-lg"
          >
            <Image
              src={image.secureUrl}
              alt={image.alt}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="sm" variant="secondary">
                View
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### **Casting Application Flow**

```typescript
// Multi-step casting application with progress tracking
export function CastingApplicationWizard({ jobId, tenantId }: CastingApplicationProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [applicationData, setApplicationData] = useState<ApplicationData>({});
  
  const steps = [
    { id: 1, title: 'Basic Info', component: BasicInfoStep },
    { id: 2, title: 'Portfolio', component: PortfolioStep },
    { id: 3, title: 'Measurements', component: MeasurementsStep },
    { id: 4, title: 'Availability', component: AvailabilityStep },
    { id: 5, title: 'Review', component: ReviewStep },
  ];

  const { mutate: submitApplication, isPending } = useSubmitApplication(tenantId);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className={cn(
                'flex items-center',
                index < steps.length - 1 && 'flex-1'
              )}
            >
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                currentStep >= step.id
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {currentStep > step.id ? '✓' : step.id}
              </div>
              <span className="ml-2 text-sm font-medium">
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={cn(
                  'flex-1 h-0.5 mx-4',
                  currentStep > step.id ? 'bg-primary' : 'bg-muted'
                )} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step */}
      <Card className="mb-6">
        <CardContent className="p-6">
          {React.createElement(steps[currentStep - 1].component, {
            data: applicationData,
            onUpdate: setApplicationData,
            jobId,
            tenantId,
          })}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
          disabled={currentStep === 1}
        >
          Previous
        </Button>
        
        {currentStep < steps.length ? (
          <Button
            onClick={() => setCurrentStep(currentStep + 1)}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={() => submitApplication(applicationData)}
            disabled={isPending}
          >
            {isPending ? 'Submitting...' : 'Submit Application'}
          </Button>
        )}
      </div>
    </div>
  );
}
```

### **Real-time Messaging Interface**

```typescript
// Real-time messaging with WebSocket integration
export function MessagingInterface({ conversationId, tenantId }: MessagingProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { data: messages, isLoading } = useMessages(tenantId, conversationId);
  const { mutate: sendMessage } = useSendMessage(tenantId, conversationId);
  
  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:3001/ws/conversations/${conversationId}`);
    
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      queryClient.setQueryData(
        messageKeys.list(tenantId, conversationId),
        (old: Message[]) => [...(old || []), message]
      );
    };
    
    return () => ws.close();
  }, [conversationId, tenantId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    
    sendMessage({ 
      content: newMessage,
      type: 'text'
    });
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <MessagesSkeleton />
        ) : (
          messages?.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex',
                message.senderId === currentUserId ? 'justify-end' : 'justify-start'
              )}
            >
              <div className={cn(
                'max-w-xs lg:max-w-md px-4 py-2 rounded-lg',
                message.senderId === currentUserId
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              )}>
                <p>{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t">
        <div className="flex space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  );
}
```

---

## 🎭 Role-Based UI Components

### **4-Tier Admin Sidebar System**

```typescript
// Dynamic sidebar based on user role
interface AdminSidebarProps {
  userRole: 'super_admin' | 'tenant_admin' | 'content_moderator' | 'account_owner';
  tenantId?: number;
}

export function AdminSidebar({ userRole, tenantId }: AdminSidebarProps) {
  const sidebarConfig = useMemo(() => {
    switch (userRole) {
      case 'super_admin':
        return superAdminSidebarConfig;
      case 'tenant_admin':
        return tenantAdminSidebarConfig;
      case 'content_moderator':
        return contentModeratorSidebarConfig;
      case 'account_owner':
        return accountOwnerSidebarConfig;
      default:
        return [];
    }
  }, [userRole]);

  return (
    <aside className="w-64 bg-sidebar border-r h-full">
      <div className="p-4">
        <h2 className="text-lg font-semibold">{getRoleDisplayName(userRole)}</h2>
      </div>
      <nav className="space-y-1 p-2">
        {sidebarConfig.map((section) => (
          <div key={section.title}>
            <h3 className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {section.title}
            </h3>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center px-3 py-2 text-sm rounded-md hover:bg-accent',
                  pathname === item.href && 'bg-accent text-accent-foreground'
                )}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

---

## 📱 Responsive Design Patterns

### **Mobile-First Components**

```typescript
// Responsive model card component
export function ModelCard({ model }: ModelCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="aspect-square relative">
        <Image
          src={model.profileImage.secureUrl}
          alt={model.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>
      <CardContent className="p-3 sm:p-4">
        <h3 className="font-semibold text-sm sm:text-base truncate">
          {model.name}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {model.location}
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-2">
          <div className="flex space-x-2 text-xs">
            <span>H: {model.height}</span>
            <span>W: {model.weight}</span>
          </div>
          <Button size="sm" className="w-full sm:w-auto">
            View Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### **Adaptive Layouts**

```typescript
// Layout that adapts to screen size and content
export function AdaptiveLayout({ children }: AdaptiveLayoutProps) {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {isMobile ? (
        <MobileLayout>{children}</MobileLayout>
      ) : (
        <DesktopLayout>{children}</DesktopLayout>
      )}
    </div>
  );
}
```

---

## 🚀 Performance Optimization

### **Image Optimization**

```typescript
// Optimized image component with progressive loading
interface OptimizedImageProps {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'portrait' | 'landscape';
  sizes?: string;
  priority?: boolean;
}

export function OptimizedImage({ 
  src, 
  alt, 
  aspectRatio = 'square',
  sizes,
  priority = false 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const aspectClasses = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  };

  return (
    <div className={cn('relative overflow-hidden rounded-lg', aspectClasses[aspectRatio])}>
      {isLoading && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {error ? (
        <div className="absolute inset-0 bg-muted flex items-center justify-center">
          <span className="text-muted-foreground">Failed to load</span>
        </div>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          className={cn(
            'object-cover transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100'
          )}
          sizes={sizes || '(max-width: 768px) 100vw, 50vw'}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
}
```

### **Code Splitting & Lazy Loading**

```typescript
// Lazy load heavy components
const ProfileEditor = lazy(() => import('./ProfileEditor'));
const PortfolioUploader = lazy(() => import('./PortfolioUploader'));
const MessagingInterface = lazy(() => import('./MessagingInterface'));

// Component with loading fallback
export function ProfilePage({ profileId }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <div className="space-y-6">
      <ProfileHeader profileId={profileId} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <ProfileOverview profileId={profileId} />
        </TabsContent>
        
        <TabsContent value="portfolio">
          <Suspense fallback={<PortfolioSkeleton />}>
            <PortfolioUploader profileId={profileId} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="edit">
          <Suspense fallback={<EditorSkeleton />}>
            <ProfileEditor profileId={profileId} />
          </Suspense>
        </TabsContent>
        
        <TabsContent value="messages">
          <Suspense fallback={<MessagesSkeleton />}>
            <MessagingInterface profileId={profileId} />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

---

## 🧪 Frontend Testing Patterns

### **Component Testing**

```typescript
// Testing with React Testing Library
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ModelCard } from '../ModelCard';

const createTestQueryClient = () => new QueryClient({
  defaultOptions: { queries: { retry: false } }
});

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('ModelCard', () => {
  const mockModel = {
    id: 1,
    name: 'Jane Doe',
    location: 'New York, NY',
    height: '5\'8"',
    weight: '125 lbs',
    profileImage: { secureUrl: '/test-image.jpg' }
  };

  it('renders model information correctly', () => {
    renderWithProviders(<ModelCard model={mockModel} />);
    
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('New York, NY')).toBeInTheDocument();
    expect(screen.getByText('H: 5\'8"')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'View Profile' })).toBeInTheDocument();
  });

  it('handles view profile click', async () => {
    const mockOnClick = jest.fn();
    renderWithProviders(<ModelCard model={mockModel} onViewProfile={mockOnClick} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'View Profile' }));
    
    await waitFor(() => {
      expect(mockOnClick).toHaveBeenCalledWith(mockModel.id);
    });
  });
});
```

### **Accessibility Testing**

```typescript
// Testing accessibility compliance
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

describe('ModelCard Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = renderWithProviders(<ModelCard model={mockModel} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('has proper ARIA labels', () => {
    renderWithProviders(<ModelCard model={mockModel} />);
    
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Jane Doe');
    expect(screen.getByRole('button')).toHaveAccessibleName('View Profile');
  });
});
```

---

## 📋 Frontend Development Checklist

### **Component Development**
- [ ] **TypeScript Interfaces:** Define proper props and state types
- [ ] **Responsive Design:** Test on mobile, tablet, and desktop
- [ ] **Accessibility:** WCAG 2.1 AA compliance with proper ARIA labels
- [ ] **Performance:** Optimize images and implement code splitting
- [ ] **Error Handling:** Graceful error states and loading indicators
- [ ] **Testing:** Unit tests with >90% coverage

### **State Management**
- [ ] **Server State:** Use TanStack Query for all API data
- [ ] **UI State:** Use Zustand only for client-side UI state
- [ ] **Cache Keys:** Follow consistent query key patterns
- [ ] **Optimistic Updates:** Implement for better UX
- [ ] **Error Recovery:** Handle network failures gracefully

### **Styling & Design**
- [ ] **ShadCN Components:** Use base components consistently
- [ ] **Tailwind Classes:** Follow utility-first patterns
- [ ] **Dark Mode:** Support both light and dark themes
- [ ] **Mobile First:** Design for mobile, enhance for desktop
- [ ] **Design Tokens:** Use CSS variables for consistent theming

---

## 🔗 Quick Reference Links

### **Essential Frontend Documentation**
- [ShadCN UI Components](https://ui.shadcn.com/) - Component library reference
- [Tailwind CSS Docs](https://tailwindcss.com/docs) - Utility classes reference
- [TanStack Query Docs](https://tanstack.com/query/latest) - Data fetching patterns
- [Next.js 15 Docs](https://nextjs.org/docs) - Framework features
- [React 19 Docs](https://react.dev/) - Latest React features

### **Internal Architecture**
- [Three-Layer Caching](../architecture/THREE_LAYER_CACHING_STRATEGY.md) - Performance patterns
- [Permission System](../features/PERMISSION_SYSTEM_IMPLEMENTATION.md) - Role-based UI
- [Design System Guidelines](../design/DESIGN_SYSTEM.md) - UI/UX standards
- [Testing Standards](../testing/FRONTEND_TESTING.md) - Quality requirements

### **Development Tools**
- [Component Storybook](http://localhost:6006) - Component playground
- [Design Tokens](../design/DESIGN_TOKENS.md) - Color and spacing system
- [Icon Library](../design/ICON_LIBRARY.md) - Available icons
- [Animation Guidelines](../design/ANIMATIONS.md) - Motion design

---

## 🎉 Success Metrics

After onboarding, you should be able to:

- [ ] **Build responsive components** using ShadCN UI and Tailwind CSS
- [ ] **Implement proper state management** with TanStack Query and Zustand
- [ ] **Handle multi-tenant data** with proper permission checks
- [ ] **Create accessible interfaces** meeting WCAG 2.1 AA standards
- [ ] **Optimize performance** with image optimization and code splitting
- [ ] **Write comprehensive tests** for components and interactions
- [ ] **Follow design system** patterns for consistent UI

---

**Ready to build amazing user experiences! 🎨** Your frontend work will directly impact hundreds of thousands of users in creative industries.

**Next Steps:** 
1. Complete the environment setup from [New Developers Guide](../for-new-developers/README.md)
2. Explore the ShadCN UI component library
3. Build your first responsive component
4. Join the frontend team meetings and design reviews

---

**Last Updated:** January 13, 2025  
**Guide Version:** 1.0.0  
**Focus:** Next.js 15 + React 19 + Modern Frontend Patterns