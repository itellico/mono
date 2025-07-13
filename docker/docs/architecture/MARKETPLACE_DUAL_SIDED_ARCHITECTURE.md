# itellico Mono: Dual-Sided Marketplace Architecture
## Flexible Marketplace Participation & Media Strategy

---

## 🔄 **Critical Insight: Dual-Sided Participation**

Users can participate on **BOTH sides** of the marketplace:
- **Photographers** can offer services (supply) AND book models (demand)
- **Models** primarily supply but might book other services (makeup artists)
- **Agencies** can represent talent AND book talent for projects

### **Solution: Profile-Based Marketplace Side**

```typescript
interface MarketplaceProfile {
  id: string;
  userId: string;              // Links to user account
  profileType: 'talent' | 'client';  // Which side of marketplace
  category: string;            // 'model', 'photographer', 'casting_director'
  
  // Profile decides marketplace behavior
  canOffer: boolean;          // Can offer services (supply side)
  canBook: boolean;           // Can book services (demand side)
  
  // Some profiles do both
  dualSided: boolean;         // True for photographers, agencies
}

// Example: Photographer with dual profiles
const photographerUser = {
  id: "user_123",
  name: "John Smith",
  profiles: [
    {
      id: "profile_1",
      profileType: "talent",
      category: "photographer",
      displayName: "John Smith Photography",
      canOffer: true,       // Offers photography services
      canBook: false
    },
    {
      id: "profile_2", 
      profileType: "client",
      category: "photographer",
      displayName: "JS Creative Studio",
      canOffer: false,
      canBook: true        // Books models for shoots
    }
  ]
};
```

---

## 💬 **Enhanced Messaging System**

### **Two Types of Messaging**

### **1. Direct Messages (1-to-1)**
```typescript
interface DirectMessage {
  id: string;
  participants: [senderId: string, receiverId: string];
  subject?: string;
  messages: Message[];
  
  // Context
  relatedBooking?: string;
  relatedProfile?: string;
  
  // Features
  readReceipts: boolean;
  attachments: MediaAttachment[];
  archived: boolean;
}
```

### **2. Project Messages (Group Chat)**
```typescript
interface ProjectMessage {
  id: string;
  projectId: string;
  projectName: string;
  
  // Multiple participants
  participants: {
    role: 'client' | 'talent' | 'agency';
    userId: string;
    profileId: string;
    permissions: ['read', 'write', 'admin'];
  }[];
  
  // Project context
  bookingId?: string;
  castingId?: string;
  
  // Features
  channels: MessageChannel[];  // General, Logistics, Creative, etc.
  files: SharedFile[];
  timeline: ProjectEvent[];
}

// Example: Fashion shoot project chat
const fashionShootChat: ProjectMessage = {
  projectName: "Vogue Summer Campaign",
  participants: [
    { role: 'client', userId: 'vogue_creative', permissions: ['admin'] },
    { role: 'talent', userId: 'model_emma', permissions: ['read', 'write'] },
    { role: 'talent', userId: 'photographer_mike', permissions: ['read', 'write'] },
    { role: 'agency', userId: 'elite_agency', permissions: ['read', 'write'] }
  ],
  channels: [
    { name: 'general', description: 'General discussion' },
    { name: 'logistics', description: 'Location, timing, transport' },
    { name: 'creative', description: 'Mood boards, concepts' }
  ]
};
```

---

## 🔍 **Search & Filter System**

### **Dynamic Filters Based on Model Schemas**

```typescript
// Search configuration generated from compiled model schemas
interface SearchConfiguration {
  entityType: 'fashion_model' | 'photographer' | 'makeup_artist';
  
  filters: {
    // From option sets
    categorical: {
      name: string;
      field: string;
      options: OptionValue[];
      multiSelect: boolean;
    }[];
    
    // From numeric fields
    range: {
      name: string;
      field: string;
      min: number;
      max: number;
      unit?: string;
    }[];
    
    // From boolean fields
    toggles: {
      name: string;
      field: string;
      label: string;
    }[];
    
    // Special filters
    availability: {
      dateRange: boolean;
      instantBook: boolean;
    };
    
    location: {
      radius: number;
      units: 'km' | 'miles';
    };
  };
  
  // Saved search with notifications
  savedSearches: {
    allowNotifications: boolean;
    notificationFrequency: 'instant' | 'daily' | 'weekly';
  };
}

// Example: Fashion model search filters
const fashionModelSearch: SearchConfiguration = {
  entityType: 'fashion_model',
  filters: {
    categorical: [
      {
        name: 'Gender',
        field: 'gender',
        options: genderOptionSet.values,
        multiSelect: false
      },
      {
        name: 'Eye Color',
        field: 'eye_color',
        options: eyeColorOptionSet.values,
        multiSelect: true
      }
    ],
    range: [
      {
        name: 'Height',
        field: 'height_cm',
        min: 150,
        max: 200,
        unit: 'cm'  // Converts to ft/in for US users
      },
      {
        name: 'Age',
        field: 'age',
        min: 16,
        max: 35
      }
    ],
    toggles: [
      {
        name: 'Portfolio',
        field: 'has_portfolio',
        label: 'Has portfolio images'
      },
      {
        name: 'Verified',
        field: 'is_verified',
        label: 'Verified profiles only'
      }
    ]
  }
};
```

### **Saved Searches with Notifications**

```typescript
interface SavedSearchWithNotification {
  id: string;
  userId: string;
  name: string;
  
  // Search criteria
  entityType: string;
  filters: Record<string, any>;
  sortBy?: string;
  
  // Notification settings
  notificationsEnabled: boolean;
  notificationFrequency: 'instant' | 'daily' | 'weekly';
  lastNotificationSent?: Date;
  
  // What triggers notifications
  notifyOn: {
    newProfiles: boolean;      // New talents matching criteria
    profileUpdates: boolean;   // Existing talents update to match
    priceChanges: boolean;     // Rate changes
    availabilityChanges: boolean;
  };
  
  // Delivery preferences
  deliveryChannels: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
}
```

---

## 📁 **Comprehensive Media Architecture**

### **1. Media Storage Hierarchy**

```
/media/
├── platform/                      # Platform-level assets
│   ├── defaults/                  # Default avatars, placeholders
│   └── templates/                 # Email templates, layouts
│
├── tenants/{tenantId}/           # Tenant-level (Go Models)
│   ├── static/                   # Rarely changes
│   │   ├── branding/            # Logo, favicon, brand assets
│   │   ├── email-templates/     # Tenant email designs
│   │   └── documents/           # Terms, policies
│   │
│   ├── dynamic/                  # Frequently changes
│   │   ├── banners/             # Marketing banners
│   │   ├── featured/            # Featured content
│   │   └── campaigns/           # Campaign assets
│   │
│   └── accounts/{accountId}/     # Account-level
│       ├── agency/              # Agency-specific
│       │   ├── logo/           # Agency branding
│       │   ├── documents/      # Contracts, forms
│       │   └── marketing/      # Agency materials
│       │
│       └── profiles/{profileId}/ # Profile-level
│           ├── avatar/          # Profile pictures
│           ├── portfolio/       # Main portfolio
│           │   ├── images/     # Photos
│           │   ├── videos/     # Video reels
│           │   └── documents/ # Comp cards, resumes
│           ├── private/        # Private media
│           └── temp/           # Upload processing
```

### **2. Media Service Architecture**

```typescript
class MediaStorageService {
  // Smart path resolution based on context
  getStoragePath(context: MediaContext): string {
    const { tenantId, accountId, profileId, mediaType, privacy } = context;
    
    // Build hierarchical path
    let path = `/media/tenants/${tenantId}`;
    
    if (accountId) {
      path += `/accounts/${accountId}`;
      
      if (profileId) {
        path += `/profiles/${profileId}`;
      }
    }
    
    // Add media type subfolder
    path += `/${mediaType}`;
    
    // Add privacy level
    if (privacy === 'private') {
      path += '/private';
    }
    
    return path;
  }
  
  // Access control
  async canAccessMedia(
    userId: string,
    mediaPath: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    const pathInfo = this.parseMediaPath(mediaPath);
    
    // Platform assets are public read
    if (pathInfo.level === 'platform') {
      return action === 'read' || this.isSuperAdmin(userId);
    }
    
    // Tenant static content
    if (pathInfo.level === 'tenant' && pathInfo.type === 'static') {
      return action === 'read' || this.isTenantAdmin(userId, pathInfo.tenantId);
    }
    
    // Profile media
    if (pathInfo.level === 'profile') {
      return this.checkProfileMediaAccess(userId, pathInfo, action);
    }
    
    return false;
  }
}
```

### **3. CDN Integration Strategy**

```typescript
interface CDNConfiguration {
  // Public content served via CDN
  public: {
    baseUrl: 'https://cdn.gomodels.com';
    paths: [
      '/media/tenants/*/static/**',
      '/media/tenants/*/accounts/*/profiles/*/portfolio/images/**'
    ];
    caching: {
      maxAge: 86400;  // 24 hours
      staleWhileRevalidate: 3600;
    };
  };
  
  // Private content served directly
  private: {
    baseUrl: 'https://app.gomodels.com';
    paths: [
      '/media/tenants/*/accounts/*/profiles/*/private/**'
    ];
    authentication: 'required';
    signedUrls: true;
    urlExpiration: 3600; // 1 hour
  };
  
  // Image optimization
  imageProcessing: {
    sizes: ['thumb', 'small', 'medium', 'large', 'original'];
    formats: ['webp', 'jpg'];
    lazyGeneration: true;
  };
}
```

---

## 🔄 **Workflow Integration**

### **Onboarding Workflow with Human-in-the-Loop**

```typescript
// Temporal workflow definition
interface ModelOnboardingWorkflow {
  steps: [
    {
      id: 'application_submission',
      type: 'user_action',
      form: 'model_application_form'
    },
    {
      id: 'ai_pre_screening',
      type: 'automated',
      actions: ['check_age', 'verify_photos', 'detect_duplicates']
    },
    {
      id: 'human_review',
      type: 'human_task',
      assignTo: 'content_moderator',
      actions: ['approve', 'reject', 'request_more_info']
    },
    {
      id: 'document_verification',
      type: 'human_task',
      condition: 'age < 18',
      assignTo: 'compliance_team',
      actions: ['verify_guardian_consent', 'check_work_permit']
    },
    {
      id: 'profile_activation',
      type: 'automated',
      actions: ['create_profile', 'send_welcome_email', 'assign_trial']
    }
  ];
  
  // Configurable per tenant
  configuration: {
    autoApproveThreshold: 0.95,  // AI confidence score
    requireHumanReview: true,
    reviewSLA: '24 hours',
    notifications: ['email', 'slack']
  };
}
```

### **Visual Workflow Editor Integration**

```typescript
// Reactflow nodes for marketplace workflows
const MARKETPLACE_WORKFLOW_NODES = [
  // Triggers
  { type: 'trigger_application', label: 'Application Received' },
  { type: 'trigger_booking', label: 'Booking Request' },
  { type: 'trigger_payment', label: 'Payment Received' },
  
  // Actions
  { type: 'action_ai_analysis', label: 'AI Analysis' },
  { type: 'action_human_review', label: 'Human Review' },
  { type: 'action_send_email', label: 'Send Email' },
  { type: 'action_create_profile', label: 'Create Profile' },
  
  // Conditions
  { type: 'condition_age_check', label: 'Age Verification' },
  { type: 'condition_document_check', label: 'Document Check' },
  { type: 'condition_payment_check', label: 'Payment Verified' },
  
  // Integrations
  { type: 'integration_stripe', label: 'Process Payment' },
  { type: 'integration_sendgrid', label: 'Send Email' },
  { type: 'integration_ai_service', label: 'AI Analysis' }
];
```

---

## 📧 **Email Template System**

### **Two-Level Email Templates**

```typescript
interface EmailTemplateSystem {
  // Platform templates (Super Admin)
  platformTemplates: {
    tenant_welcome: 'Welcome new tenant admins';
    subscription_created: 'Subscription confirmation';
    payment_received: 'Payment confirmation';
    system_maintenance: 'Maintenance notifications';
  };
  
  // Tenant templates (Tenant Admin)
  tenantTemplates: {
    // Talent emails
    talent_welcome: 'Welcome new talents';
    application_received: 'Application confirmation';
    application_approved: 'Profile approved';
    booking_request: 'New booking request';
    
    // Client emails
    client_welcome: 'Welcome new clients';
    talent_suggestion: 'Talent recommendations';
    booking_confirmation: 'Booking confirmed';
    invoice_ready: 'Invoice available';
    
    // Can override with tenant branding
    customization: {
      logo: 'tenant_logo_url';
      colors: 'tenant_color_scheme';
      footer: 'tenant_contact_info';
    };
  };
}
```

---

## 👥 **User Invitation System**

### **Multi-Level Invitation Flow**

```typescript
interface InvitationSystem {
  // Tenant invites agencies
  tenantToAgency: {
    inviteType: 'agency_partnership';
    permissions: ['account.create', 'talent.manage'];
    customMessage: string;
    onboarding: 'agency_onboarding_workflow';
  };
  
  // Agency invites talents
  agencyToTalent: {
    inviteType: 'join_agency';
    permissions: ['profile.create', 'profile.manage'];
    prefilledData: { agency: 'agency_id', category: 'model' };
    onboarding: 'talent_onboarding_workflow';
  };
  
  // Client invites team members
  clientToTeam: {
    inviteType: 'team_member';
    permissions: ['castings.view', 'bookings.create'];
    role: 'casting_assistant' | 'creative_director';
  };
  
  // Invitation tracking
  tracking: {
    sentAt: Date;
    expiresAt: Date;
    acceptedAt?: Date;
    onboardingCompleted?: Date;
  };
}
```

---

## 🌍 **Translation Strategy**

### **Multi-Level Translation System**

```typescript
interface TranslationArchitecture {
  // Content requiring translation
  levels: {
    platform: {
      ui: 'Platform UI strings';
      emails: 'System email templates';
      documentation: 'Help docs';
    };
    
    tenant: {
      ui_overrides: 'Tenant UI customizations';
      categories: 'Category names/descriptions';
      tags: 'Tag labels';
      emails: 'Tenant email templates';
      content: 'Marketing content';
    };
    
    profile: {
      descriptions: 'Profile descriptions';
      portfolio_captions: 'Image captions';
      skills: 'Skill descriptions';
    };
  };
  
  // Translation workflow
  workflow: {
    automatic: 'LLM translation for instant availability';
    review: 'Human review queue for quality';
    approval: 'Tenant admin approval for public content';
  };
}
```

---

## 📋 **Updated Implementation Priorities**

### **Phase 1: Core Marketplace (Weeks 1-4)**
1. ✅ Implement dual-sided profile system
2. ✅ Build advanced search with schema-based filters
3. ✅ Create saved searches with notifications
4. ✅ Set up media storage architecture

### **Phase 2: Communication (Weeks 5-8)**
1. ✅ Implement direct messaging (1-to-1)
2. ✅ Build project messaging (group chat)
3. ✅ Create notification system
4. ✅ Integrate email templates

### **Phase 3: Workflows (Weeks 9-12)**
1. ✅ Set up Temporal workflows
2. ✅ Build visual workflow editor
3. ✅ Create onboarding workflows
4. ✅ Implement human-in-the-loop tasks

### **Phase 4: Platform Features (Weeks 13-16)**
1. ✅ Complete user invitation system
2. ✅ Implement translation workflows
3. ✅ Build white-label theming
4. ✅ Create tenant email customization

---

This architecture addresses all your key points:
- **Dual-sided participation** with profile-based marketplace sides
- **Project messaging** for group collaboration
- **Advanced filters** based on model schemas
- **Comprehensive media handling** with clear hierarchy
- **Workflow integration** with human-in-the-loop
- **Email templates** at platform and tenant levels
- **User invitation** with proper permissions

Ready to consolidate into the roadmap?