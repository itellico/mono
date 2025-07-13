# itellico Mono: Unified Marketplace Architecture
## Complete System Integration & 5-Tier Navigation Design

---

## 📋 **Executive Summary**

This document consolidates the **Enhanced Platform Architecture** with existing systems to create a complete two-sided marketplace for the creative industries. It defines the 5-tier navigation system, integrates all components, and provides a clear implementation roadmap.

### **Two-Sided Marketplace Structure**
- **Supply Side**: Models, Photographers, Makeup Artists, Agencies (Service Providers)
- **Demand Side**: Casting Directors, Brands, Production Companies (Service Seekers)

---

## 🏗️ **System Integration Overview**

### **1. Architecture Consolidation**

```typescript
// Unified System Architecture
itellico Mono {
  // Core Systems (Existing)
  Foundation: {
    Database: PostgreSQL + Prisma
    Cache: Redis (3-layer strategy)
    Auth: JWT + Session optimization
    RBAC: 7-table pattern-based system
    API: Next.js + Fastify hybrid
  }
  
  // Enhanced Systems (New)
  Marketplace: {
    IndustryTemplates: Full-stack industry configs
    Subscriptions: FeatureSets + ResourceLimits
    CompiledModels: Performance-optimized schemas
    TenantTheming: CSS + Media spaces
    BillingIntegration: Stripe Connect
  }
  
  // Component Library (Existing)
  UIComponents: {
    Admin: AdminListPage, AdminEditPage
    Data: DataTable, SearchableSelect
    Media: MediaUpload, ProfilePicture
    Status: LoadingState, EmptyState
  }
}
```

### **2. RBAC Integration with Enhanced Features**

```typescript
// Extended Permission Patterns for Marketplace
const MARKETPLACE_PERMISSIONS = {
  // Platform Level
  'platform.industry_templates.manage': 'Manage industry templates',
  'platform.feature_sets.manage': 'Manage feature sets',
  'platform.subscriptions.create': 'Create subscription plans',
  
  // Tenant Level
  'tenant.branding.manage': 'Manage tenant branding',
  'tenant.compiled_models.view': 'View compiled models',
  'tenant.marketplace.configure': 'Configure marketplace settings',
  
  // Marketplace Permissions
  'marketplace.listings.create': 'Create talent listings',
  'marketplace.listings.search': 'Search talent database',
  'marketplace.bookings.create': 'Book talent',
  'marketplace.bookings.manage': 'Manage bookings',
  
  // Account Level
  'account.profiles.manage': 'Manage model profiles',
  'account.portfolio.upload': 'Upload portfolio items',
  'account.availability.set': 'Set availability calendar',
  'account.rates.configure': 'Configure pricing'
};
```

---

## 🎯 **5-Tier Navigation System**

### **Tier 1: Super Admin Sidebar**
**For: Platform Operators (itellico Mono team)**

```typescript
const SUPER_ADMIN_NAVIGATION = [
  {
    section: "Platform Management",
    items: [
      { label: "Dashboard", href: "/super-admin", icon: "dashboard" },
      { label: "Tenants", href: "/super-admin/tenants", icon: "building" },
      { label: "Industry Templates", href: "/super-admin/industry-templates", icon: "template" },
      { label: "Feature Sets", href: "/super-admin/feature-sets", icon: "package" },
      { label: "Subscription Plans", href: "/super-admin/subscriptions", icon: "credit-card" }
    ]
  },
  {
    section: "Technical",
    items: [
      { label: "Model Schemas", href: "/super-admin/schemas", icon: "database" },
      { label: "Compiled Models", href: "/super-admin/compiled-models", icon: "code" },
      { label: "API Management", href: "/super-admin/api", icon: "api" },
      { label: "System Health", href: "/super-admin/health", icon: "activity" }
    ]
  },
  {
    section: "Operations",
    items: [
      { label: "Usage Analytics", href: "/super-admin/analytics", icon: "chart" },
      { label: "Billing Overview", href: "/super-admin/billing", icon: "dollar" },
      { label: "Support Tickets", href: "/super-admin/support", icon: "help" },
      { label: "Platform Settings", href: "/super-admin/settings", icon: "settings" }
    ]
  }
];
```

### **Tier 2: Tenant Admin Sidebar**
**For: Marketplace Operators (e.g., Go Models administrators)**

```typescript
const TENANT_ADMIN_NAVIGATION = [
  {
    section: "Marketplace Management",
    items: [
      { label: "Dashboard", href: "/admin", icon: "dashboard" },
      { label: "Talent Database", href: "/admin/talents", icon: "users" },
      { label: "Casting Calls", href: "/admin/castings", icon: "megaphone" },
      { label: "Bookings", href: "/admin/bookings", icon: "calendar" },
      { label: "Applications", href: "/admin/applications", icon: "inbox" }
    ]
  },
  {
    section: "Content Management",
    items: [
      { label: "Categories", href: "/admin/categories", icon: "folder" },
      { label: "Tags", href: "/admin/tags", icon: "tag" },
      { label: "Option Sets", href: "/admin/option-sets", icon: "list" },
      { label: "Media Library", href: "/admin/media", icon: "image" }
    ]
  },
  {
    section: "Business Operations",
    items: [
      { label: "Subscriptions", href: "/admin/subscriptions", icon: "credit-card" },
      { label: "Invoicing", href: "/admin/invoices", icon: "receipt" },
      { label: "Commission Tracking", href: "/admin/commissions", icon: "percentage" },
      { label: "Reports", href: "/admin/reports", icon: "file-text" }
    ]
  },
  {
    section: "Configuration",
    items: [
      { label: "Branding", href: "/admin/branding", icon: "palette" },
      { label: "Email Templates", href: "/admin/emails", icon: "mail" },
      { label: "Workflows", href: "/admin/workflows", icon: "git-branch" },
      { label: "Integrations", href: "/admin/integrations", icon: "plug" },
      { label: "Settings", href: "/admin/settings", icon: "settings" }
    ]
  }
];
```

### **Tier 3: Agency Account Sidebar**
**For: Agencies managing multiple talents**

```typescript
const AGENCY_ACCOUNT_NAVIGATION = [
  {
    section: "Agency Overview",
    items: [
      { label: "Dashboard", href: "/agency", icon: "dashboard" },
      { label: "Our Talents", href: "/agency/talents", icon: "users" },
      { label: "Active Bookings", href: "/agency/bookings", icon: "calendar" },
      { label: "Applications", href: "/agency/applications", icon: "send" }
    ]
  },
  {
    section: "Talent Management",
    items: [
      { label: "Add New Talent", href: "/agency/talents/new", icon: "user-plus" },
      { label: "Portfolios", href: "/agency/portfolios", icon: "image" },
      { label: "Availability", href: "/agency/availability", icon: "clock" },
      { label: "Documents", href: "/agency/documents", icon: "file" }
    ]
  },
  {
    section: "Business",
    items: [
      { label: "Earnings", href: "/agency/earnings", icon: "dollar" },
      { label: "Invoices", href: "/agency/invoices", icon: "receipt" },
      { label: "Contracts", href: "/agency/contracts", icon: "file-contract" },
      { label: "Statistics", href: "/agency/stats", icon: "chart" }
    ]
  },
  {
    section: "Agency Settings",
    items: [
      { label: "Agency Profile", href: "/agency/profile", icon: "building" },
      { label: "Team Members", href: "/agency/team", icon: "users" },
      { label: "Notifications", href: "/agency/notifications", icon: "bell" },
      { label: "Preferences", href: "/agency/preferences", icon: "settings" }
    ]
  }
];
```

### **Tier 4: Individual Talent Sidebar**
**For: Individual models/photographers/artists**

```typescript
const TALENT_ACCOUNT_NAVIGATION = [
  {
    section: "My Career",
    items: [
      { label: "Dashboard", href: "/talent", icon: "dashboard" },
      { label: "My Profile", href: "/talent/profile", icon: "user" },
      { label: "Portfolio", href: "/talent/portfolio", icon: "image" },
      { label: "Comp Cards", href: "/talent/compcards", icon: "id-card" }
    ]
  },
  {
    section: "Work",
    items: [
      { label: "Job Board", href: "/talent/jobs", icon: "briefcase" },
      { label: "My Applications", href: "/talent/applications", icon: "send" },
      { label: "Bookings", href: "/talent/bookings", icon: "calendar" },
      { label: "Availability", href: "/talent/availability", icon: "clock" }
    ]
  },
  {
    section: "Earnings",
    items: [
      { label: "Income", href: "/talent/income", icon: "dollar" },
      { label: "Invoices", href: "/talent/invoices", icon: "receipt" },
      { label: "Tax Documents", href: "/talent/tax", icon: "file-text" }
    ]
  },
  {
    section: "Account",
    items: [
      { label: "Settings", href: "/talent/settings", icon: "settings" },
      { label: "Privacy", href: "/talent/privacy", icon: "lock" },
      { label: "Notifications", href: "/talent/notifications", icon: "bell" },
      { label: "Subscription", href: "/talent/subscription", icon: "credit-card" }
    ]
  }
];
```

### **Tier 5: Client/Buyer Sidebar**
**For: Casting directors, brands, production companies (Demand side)**

```typescript
const CLIENT_NAVIGATION = [
  {
    section: "Discover Talent",
    items: [
      { label: "Search Talents", href: "/client/search", icon: "search" },
      { label: "Saved Searches", href: "/client/saved-searches", icon: "bookmark" },
      { label: "Favorites", href: "/client/favorites", icon: "heart" },
      { label: "Collections", href: "/client/collections", icon: "folder" }
    ]
  },
  {
    section: "Projects",
    items: [
      { label: "Create Casting", href: "/client/castings/new", icon: "plus" },
      { label: "Active Castings", href: "/client/castings", icon: "megaphone" },
      { label: "Applications", href: "/client/applications", icon: "inbox" },
      { label: "Bookings", href: "/client/bookings", icon: "calendar" }
    ]
  },
  {
    section: "Management",
    items: [
      { label: "Contracts", href: "/client/contracts", icon: "file-contract" },
      { label: "Invoices", href: "/client/invoices", icon: "receipt" },
      { label: "Messages", href: "/client/messages", icon: "message" },
      { label: "Reviews", href: "/client/reviews", icon: "star" }
    ]
  },
  {
    section: "Company",
    items: [
      { label: "Company Profile", href: "/client/company", icon: "building" },
      { label: "Team", href: "/client/team", icon: "users" },
      { label: "Billing", href: "/client/billing", icon: "credit-card" },
      { label: "Settings", href: "/client/settings", icon: "settings" }
    ]
  }
];
```

---

## 🛍️ **Marketplace Core Pages**

### **1. Talent Search & Discovery**

```typescript
// Main marketplace search page
interface TalentSearchPage {
  components: {
    SearchBar: "Advanced search with filters"
    FilterPanel: {
      categories: ["Models", "Photographers", "Makeup Artists"]
      attributes: ["Height", "Age", "Location", "Skills"]
      availability: "Date range picker"
      rates: "Price range slider"
    }
    ResultsGrid: "Card or list view toggle"
    Pagination: "Load more or traditional"
  }
  
  features: [
    "Save searches",
    "Export results",
    "Quick view modal",
    "Compare talents"
  ]
}
```

### **2. Talent Profile Page**

```typescript
interface TalentProfilePage {
  sections: {
    Hero: {
      profilePhoto: "Main image",
      basicInfo: "Name, category, location",
      quickStats: "Experience, rating, response time"
      actionButtons: ["Book Now", "Message", "Save"]
    }
    
    Portfolio: {
      photos: "Gallery with lightbox",
      videos: "Embedded player",
      documents: "Comp cards, resume"
    }
    
    Details: {
      measurements: "Physical attributes",
      skills: "Special abilities",
      experience: "Work history",
      availability: "Calendar view"
    }
    
    Reviews: {
      rating: "Average score",
      testimonials: "Client feedback",
      verifiedJobs: "Completed bookings"
    }
  }
}
```

### **3. Booking Flow**

```typescript
interface BookingFlow {
  steps: [
    {
      name: "Select Dates",
      components: ["AvailabilityCalendar", "TimeSlotPicker"]
    },
    {
      name: "Project Details",
      components: ["ProjectForm", "LocationPicker", "RequirementsChecklist"]
    },
    {
      name: "Terms & Pricing",
      components: ["RateCalculator", "ContractTerms", "AddOns"]
    },
    {
      name: "Payment",
      components: ["PaymentMethod", "InvoicePreview", "DepositOptions"]
    },
    {
      name: "Confirmation",
      components: ["BookingSummary", "NextSteps", "CalendarInvite"]
    }
  ]
}
```

---

## 🗂️ **Data Architecture & Seeding**

### **1. Complete Data Hierarchy**

```typescript
// Go Models Tenant Example
const GO_MODELS_SEED = {
  tenant: {
    name: "Go Models",
    domain: "gomodels.com",
    industry: "modeling",
    subscription: "enterprise",
    features: ["ai_tools", "analytics_advanced", "custom_branding"]
  },
  
  categories: [
    { name: "Fashion Models", slug: "fashion-models" },
    { name: "Commercial Models", slug: "commercial-models" },
    { name: "Fitness Models", slug: "fitness-models" },
    { name: "Child Models", slug: "child-models" }
  ],
  
  accounts: [
    {
      type: "agency",
      name: "Elite Model Management",
      users: [
        { role: "agency_admin", name: "John Manager" },
        { role: "agent", name: "Sarah Agent" }
      ],
      profiles: [
        { type: "fashion_model", name: "Emma Wilson", age: 22 },
        { type: "fashion_model", name: "Sophie Chen", age: 24 }
      ]
    },
    {
      type: "individual",
      name: "Michael Photography",
      users: [
        { role: "account_owner", name: "Michael Photo" }
      ],
      profiles: [
        { type: "photographer", specialties: ["fashion", "portrait"] }
      ]
    }
  ],
  
  clients: [
    {
      company: "Vogue Magazine",
      type: "publisher",
      users: [
        { role: "casting_director", name: "Anna Director" }
      ]
    },
    {
      company: "Nike Sports",
      type: "brand",
      users: [
        { role: "creative_director", name: "Mark Creative" }
      ]
    }
  ]
};
```

### **2. Seeding Strategy**

```typescript
class MarketplaceSeeder {
  async seed() {
    // Phase 1: Platform Setup
    await this.seedIndustryTemplates();
    await this.seedFeatureSets();
    await this.seedSubscriptionPlans();
    
    // Phase 2: Tenant Creation
    const tenant = await this.createGoModelsTenant();
    
    // Phase 3: Install Industry Template
    await this.installModelingTemplate(tenant.id);
    
    // Phase 4: Seed Marketplace Data
    await this.seedCategories(tenant.id);
    await this.seedOptionSets(tenant.id);
    await this.seedAccounts(tenant.id);
    await this.seedProfiles(tenant.id);
    await this.seedClients(tenant.id);
    
    // Phase 5: Sample Content
    await this.seedCastingCalls(tenant.id);
    await this.seedBookings(tenant.id);
    await this.seedReviews(tenant.id);
  }
}
```

---

## 📊 **Component Usage Strategy**

### **1. Leverage Existing Components**

```typescript
// Example: Talent List Page using existing AdminListPage
export function TalentListPage() {
  const columns = [
    { key: 'photo', label: 'Photo', type: 'image' },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'category', label: 'Category', filterable: true },
    { key: 'location', label: 'Location', filterable: true },
    { key: 'rating', label: 'Rating', type: 'rating' },
    { key: 'availability', label: 'Available', type: 'badge' }
  ];
  
  return (
    <AdminListPage
      title="Talent Database"
      endpoint="/api/v1/talents"
      columns={columns}
      searchPlaceholder="Search by name, skills..."
      filters={['category', 'location', 'availability']}
      bulkActions={['export', 'message', 'tag']}
      addNewLink="/admin/talents/new"
      addNewLabel="Add New Talent"
    />
  );
}
```

### **2. New Marketplace Components Needed**

```typescript
// Components to build for marketplace
const NEW_COMPONENTS = [
  "TalentCard",          // Display talent in grid view
  "BookingCalendar",     // Availability and booking widget
  "RatingStars",         // Review rating display
  "PriceDisplay",        // Rate formatting with currency
  "AvailabilityBadge",   // Quick availability indicator
  "CompCardGenerator",   // Industry-specific comp card creator
  "ChatWidget",          // Real-time messaging component
  "BookingWizard",       // Multi-step booking flow
  "TalentComparison",    // Side-by-side comparison tool
  "CastingCallCard"      // Job posting display
];
```

---

## 🚀 **Implementation Roadmap Integration**

### **Phase 1: Foundation Enhancement (Weeks 1-4)**
- ✅ Use existing RBAC system
- ✅ Leverage current component library
- 🔨 Create new database tables (IndustryTemplate, FeatureSet, etc.)
- 🔨 Consolidate sidebar implementations into 5-tier system
- 🔨 Complete Fastify hybrid setup

### **Phase 2: Marketplace Core (Weeks 5-8)**
- 🔨 Build talent search and discovery pages
- 🔨 Create profile management system
- 🔨 Implement booking flow
- 🔨 Add marketplace-specific components
- 🔨 Integrate with existing admin patterns

### **Phase 3: Industry Templates (Weeks 9-12)**
- 🔨 Create modeling industry template
- 🔨 Build template installer
- 🔨 Implement compiled model generation
- 🔨 Seed Go Models tenant with full data

### **Phase 4: Advanced Features (Weeks 13-16)**
- 🔨 Implement messaging system (GoCare)
- 🔨 Add workflow automation (Temporal)
- 🔨 Create tenant CSS theming
- 🔨 Build commission tracking

### **Phase 5: Polish & Launch (Weeks 17-20)**
- 🔨 Complete two-sided marketplace features
- 🔨 Performance optimization
- 🔨 Security audit
- 🔨 Launch preparation

---

## 🎯 **Key Success Metrics**

### **Marketplace KPIs**
1. **Supply Side**: 10,000+ active talent profiles
2. **Demand Side**: 1,000+ verified clients
3. **Bookings**: 500+ monthly transactions
4. **Search Performance**: <200ms response time
5. **Mobile Usage**: 60%+ mobile traffic

### **Technical Metrics**
1. **Page Load**: <2 seconds
2. **API Response**: <100ms average
3. **Uptime**: 99.9%
4. **Concurrent Users**: 10,000+
5. **Database Queries**: <50ms average

---

## 🔧 **Technical Integration Points**

### **1. Fastify Integration**
```typescript
// Marketplace API routes structure
/api/v1/marketplace/
  /talents          # Search and list talents
  /talents/:id      # Individual talent details
  /bookings         # Booking management
  /castings         # Casting call management
  /reviews          # Review system
  /messages         # Messaging endpoints
```

### **2. CLAUDE.md Compliance**
- ✅ Follow mandatory workflow (research → confirm → implement)
- ✅ Use existing patterns and components
- ✅ Maintain tenant isolation
- ✅ Follow performance best practices
- ✅ Document all architectural decisions

### **3. Redis Caching Strategy**
```typescript
// Marketplace-specific cache keys
'marketplace:search:results:{hash}'     # Search result caching
'marketplace:talent:{id}:profile'       # Talent profile cache
'marketplace:talent:{id}:availability'  # Availability cache
'marketplace:featured:talents'          # Featured talents cache
'marketplace:categories:tree'           # Category hierarchy cache
```

---

## 📝 **Conclusion**

This unified architecture creates a complete two-sided marketplace by:
1. **Building on existing strengths**: RBAC, components, admin patterns
2. **Adding marketplace essentials**: Search, profiles, bookings, reviews
3. **Supporting all user types**: 5-tier navigation system
4. **Maintaining performance**: Compiled models, caching, optimization
5. **Enabling customization**: Industry templates, tenant theming

The Go Models tenant will showcase the full platform capabilities with a thriving marketplace for the modeling industry, serving as the blueprint for expansion into other creative industries.