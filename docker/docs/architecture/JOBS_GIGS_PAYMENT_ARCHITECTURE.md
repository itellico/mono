# itellico Mono: Jobs, Gigs & Payment Architecture
## Complete Marketplace Economy System

---

## 🎯 **Overview: Two Types of Marketplace Transactions**

The platform supports **TWO distinct marketplace models**:

### **1. Job Postings (Client-Initiated)**
- Clients post jobs/castings
- Talents apply
- Client selects from applicants
- Payment upon completion

### **2. Gig Offerings (Talent-Initiated)**
- Talents create service packages (Fiverr-style)
- Clients browse and purchase
- Instant booking available
- Platform handles payment

---

## 💼 **Job Posting System**

### **Who Can Create Jobs?**

```typescript
interface JobCreationPermissions {
  // Client-side users
  castingDirector: {
    canCreate: true,
    jobTypes: ['casting', 'audition', 'commercial', 'film']
  },
  
  brand: {
    canCreate: true,
    jobTypes: ['campaign', 'product_shoot', 'social_media']
  },
  
  productionCompany: {
    canCreate: true,
    jobTypes: ['film', 'tv', 'commercial', 'music_video']
  },
  
  // Dual-sided users
  photographer: {
    canCreate: true,  // When acting as client
    jobTypes: ['model_shoot', 'collaboration', 'tfp'] // Time for Print
  },
  
  // Supply-side users
  model: {
    canCreate: false, // Models don't typically post jobs
    canApply: true
  },
  
  agency: {
    canCreate: true,  // Can post on behalf of clients
    jobTypes: ['any'],
    requiresClientAuthorization: true
  }
}
```

### **Job Posting Structure**

```typescript
interface JobPosting {
  id: string;
  tenantId: string;
  postedBy: {
    userId: string;
    profileId: string;
    profileType: 'client' | 'agency';
    companyName: string;
    verified: boolean;
  };
  
  // Job details
  title: string;
  category: JobCategory;
  type: JobType;
  description: string;
  requirements: string[];
  
  // Who can apply
  targetProfiles: {
    categories: string[];        // ['fashion_model', 'commercial_model']
    gender: string[];           // ['male', 'female', 'non-binary']
    ageRange: { min: number; max: number };
    location: {
      city: string;
      radius: number;
      remote: boolean;
    };
    experience: ExperienceLevel;
    specificRequirements: {     // Dynamic based on model schema
      height?: { min: number; max: number };
      languages?: string[];
      skills?: string[];
    };
  };
  
  // Application settings
  applicationDeadline: Date;
  maxApplications?: number;      // Limit applications
  autoCloseOnMax: boolean;
  applicationQuestions: Question[]; // Custom questions
  
  // Schedule
  jobDates: {
    type: 'specific' | 'flexible' | 'ongoing';
    dates?: Date[];
    duration?: string;
    schedule?: string;
  };
  
  // Compensation
  compensation: {
    type: 'paid' | 'tfp' | 'volunteer';
    amount?: {
      value: number;
      currency: string;
      per: 'hour' | 'day' | 'project';
    };
    expenses?: boolean;
    travelIncluded?: boolean;
    usageRights?: string;
  };
  
  // Visibility
  visibility: 'public' | 'invite_only' | 'agency_only';
  featured: boolean;
  boost: {
    enabled: boolean;
    budget?: number;
    targetReach?: number;
  };
  
  // Status
  status: 'draft' | 'active' | 'paused' | 'filled' | 'completed' | 'cancelled';
  publishedAt?: Date;
  filledAt?: Date;
  
  // Analytics
  stats: {
    views: number;
    applications: number;
    saved: number;
    shares: number;
  };
}
```

### **Job Categories & Types**

```typescript
const JOB_CATEGORIES = {
  modeling: {
    fashion: ['runway', 'editorial', 'catalog', 'showroom'],
    commercial: ['print', 'tv_commercial', 'online_ad'],
    fitness: ['athletic_wear', 'gym_shoot', 'sports_brand'],
    specialty: ['hand_model', 'foot_model', 'hair_model']
  },
  
  photography: {
    portrait: ['headshot', 'family', 'professional'],
    event: ['wedding', 'corporate', 'party'],
    commercial: ['product', 'real_estate', 'food']
  },
  
  production: {
    film: ['feature', 'short', 'documentary'],
    tv: ['series', 'commercial', 'reality'],
    digital: ['youtube', 'social_media', 'web_series']
  }
};
```

---

## 🎪 **Gig System (Fiverr-Style)**

### **Talent Service Offerings**

```typescript
interface GigOffering {
  id: string;
  talentId: string;
  profileId: string;
  
  // Gig basics
  title: string;              // "Professional Fashion Photoshoot"
  category: string;
  subcategory: string;
  tags: string[];
  
  // Description
  description: string;
  highlights: string[];       // Bullet points
  requirements: string[];     // What client needs to provide
  
  // Packages (Bronze/Silver/Gold style)
  packages: {
    basic: GigPackage;
    standard?: GigPackage;
    premium?: GigPackage;
  };
  
  // Media
  gallery: {
    images: string[];
    videos?: string[];
    coverImage: string;
  };
  
  // Availability
  availability: {
    instantBook: boolean;
    requiresApproval: boolean;
    advanceNotice: number;    // Days required
    blackoutDates: Date[];
  };
  
  // Location
  serviceLocation: {
    type: 'talent_location' | 'client_location' | 'remote';
    travelRadius?: number;
    additionalFee?: number;
  };
  
  // Reviews & Stats
  rating: number;
  completedOrders: number;
  responseTime: string;
  completionRate: number;
  
  // Status
  status: 'active' | 'paused' | 'under_review';
  featured: boolean;
}

interface GigPackage {
  name: string;               // "Basic", "Standard", "Premium"
  title: string;              // "1 Look Photoshoot"
  description: string;
  price: {
    amount: number;
    currency: string;
  };
  
  deliverables: {
    item: string;
    quantity: number;
  }[];
  
  // What's included
  features: {
    feature: string;
    included: boolean;
  }[];
  
  duration: {
    value: number;
    unit: 'hours' | 'days';
  };
  
  revisions: number;
  
  // Add-ons
  extras: {
    id: string;
    title: string;
    price: number;
    duration?: number;
  }[];
}

// Example: Model's Photography Gig
const modelPhotoGig: GigOffering = {
  title: "Professional Model Portfolio Shoot",
  packages: {
    basic: {
      name: "Basic",
      title: "1 Look Portfolio",
      price: { amount: 150, currency: "EUR" },
      deliverables: [
        { item: "Edited photos", quantity: 5 },
        { item: "Looks/Outfits", quantity: 1 }
      ],
      duration: { value: 1, unit: "hours" },
      revisions: 1
    },
    standard: {
      name: "Standard",
      title: "3 Looks Portfolio",
      price: { amount: 350, currency: "EUR" },
      deliverables: [
        { item: "Edited photos", quantity: 15 },
        { item: "Looks/Outfits", quantity: 3 }
      ],
      duration: { value: 3, unit: "hours" },
      revisions: 2
    },
    premium: {
      name: "Premium",
      title: "Full Day Shoot",
      price: { amount: 800, currency: "EUR" },
      deliverables: [
        { item: "Edited photos", quantity: 40 },
        { item: "Looks/Outfits", quantity: 6 },
        { item: "Composite card", quantity: 1 }
      ],
      duration: { value: 8, unit: "hours" },
      revisions: 3
    }
  }
};
```

---

## 🔔 **Job Matching & Notifications**

### **Profile Job Preferences**

```typescript
interface TalentJobPreferences {
  profileId: string;
  
  // What jobs interest them
  interestedIn: {
    categories: string[];
    types: string[];
    compensationTypes: ('paid' | 'tfp' | 'both')[];
    minimumRate?: number;
  };
  
  // Availability
  availability: {
    status: 'available' | 'busy' | 'selective';
    calendar: AvailabilityCalendar;
    advanceNotice: number; // Days
  };
  
  // Location preferences
  location: {
    basedIn: string;
    willingToTravel: boolean;
    travelRadius: number;
    requiresExpenses: boolean;
  };
  
  // Notification settings
  notifications: {
    instantJobMatch: boolean;
    dailyDigest: boolean;
    weeklyRoundup: boolean;
    
    channels: {
      email: boolean;
      push: boolean;
      sms: boolean;
      inApp: boolean;
    };
    
    // Filters for notifications
    onlyNotifyFor: {
      minimumBudget?: number;
      verifiedClients?: boolean;
      specificClients?: string[];
      keywords?: string[];
    };
  };
}
```

### **Job Matching Algorithm**

```typescript
class JobMatchingService {
  async matchJobToTalents(job: JobPosting): Promise<MatchedTalent[]> {
    const matches = await this.findMatchingProfiles({
      // Required matches
      category: job.targetProfiles.categories,
      location: this.calculateLocationMatch(job.targetProfiles.location),
      availability: this.checkAvailability(job.jobDates),
      
      // Scored matches
      experience: this.scoreExperience(job.requirements),
      physicalAttributes: this.matchAttributes(job.targetProfiles.specificRequirements),
      skills: this.matchSkills(job.requirements),
      
      // Preferences
      compensation: this.matchCompensation(job.compensation),
      clientReputation: this.getClientScore(job.postedBy)
    });
    
    return matches.sort((a, b) => b.matchScore - a.matchScore);
  }
  
  async notifyMatchedTalents(job: JobPosting, matches: MatchedTalent[]) {
    for (const match of matches) {
      if (match.matchScore >= match.notificationThreshold) {
        await this.sendNotification({
          talentId: match.talentId,
          type: 'job_match',
          priority: this.calculatePriority(match.matchScore),
          channels: match.preferredChannels,
          content: this.generateJobMatchMessage(job, match)
        });
      }
    }
  }
}
```

---

## 📝 **Application System**

### **Application Flow**

```typescript
interface JobApplication {
  id: string;
  jobId: string;
  applicantId: string;
  profileId: string;
  
  // Application content
  coverLetter?: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
  
  // Supporting materials
  portfolio: {
    selectedImages: string[];
    customUploads?: string[];
    externalLinks?: string[];
  };
  
  // Availability confirmation
  availability: {
    confirmedDates: boolean;
    alternativeDates?: Date[];
    notes?: string;
  };
  
  // Rate negotiation
  proposedRate?: {
    amount: number;
    currency: string;
    notes?: string;
  };
  
  // Status
  status: ApplicationStatus;
  statusHistory: {
    status: ApplicationStatus;
    changedAt: Date;
    changedBy: string;
    reason?: string;
  }[];
  
  // Communication
  messages: ApplicationMessage[];
  
  // Timestamps
  appliedAt: Date;
  viewedAt?: Date;
  shortlistedAt?: Date;
  rejectedAt?: Date;
  acceptedAt?: Date;
}

enum ApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  VIEWED = 'viewed',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn'
}
```

### **Application Limits & Rules**

```typescript
interface ApplicationRules {
  // Per talent
  maxActiveApplications: number;       // Prevent spam
  cooldownPeriod: number;             // Hours between applications to same client
  
  // Per job
  maxApplicationsPerJob?: number;      // Client can limit
  earlyApplicationBonus: boolean;      // First X applicants get priority
  
  // Quality controls
  minimumProfileCompleteness: number;  // 80% profile required
  requiresVerification: boolean;       // Verified profiles only
  portfolioRequired: boolean;          // Must have portfolio images
}
```

---

## 💰 **Payment System**

### **Payment Models**

```typescript
interface PaymentModels {
  // Job payments (escrow-based)
  jobPayment: {
    flow: 'escrow';
    steps: [
      'client_deposits',      // Client pays upfront
      'platform_holds',       // Platform holds in escrow
      'work_completed',       // Job is done
      'client_approves',      // Client confirms completion
      'platform_releases',    // Platform releases to talent
      'talent_receives'       // Minus platform fee
    ];
    platformFee: 0.15;        // 15% commission
    payoutTiming: '3-5 days';
  };
  
  // Gig payments (instant)
  gigPayment: {
    flow: 'instant';
    steps: [
      'client_pays',          // Client pays for gig
      'platform_processes',   // Instant processing
      'work_scheduled',       // Booking confirmed
      'platform_holds',       // Hold until completion
      'auto_release'          // Auto-release after timeframe
    ];
    platformFee: 0.20;        // 20% for instant booking
    payoutTiming: '48 hours after completion';
  };
  
  // Subscription model
  talentSubscription: {
    tiers: {
      basic: { price: 0, commission: 0.25 },      // Free, 25% commission
      pro: { price: 29, commission: 0.15 },       // €29/mo, 15% commission
      premium: { price: 99, commission: 0.10 }    // €99/mo, 10% commission
    };
  };
}
```

### **Payment Processing**

```typescript
interface PaymentFlow {
  // Stripe Connect integration
  stripeConnect: {
    // Each talent has connected account
    talentAccount: {
      type: 'express';
      capabilities: ['transfers', 'card_payments'];
      payoutSchedule: 'daily';
    };
    
    // Platform controls flow
    platformAccount: {
      applicationFee: 'percentage';
      holdPeriod: 7; // Days before release
    };
  };
  
  // Escrow management
  escrow: {
    statuses: [
      'awaiting_deposit',
      'deposit_received',
      'in_progress',
      'pending_approval',
      'approved',
      'released',
      'disputed'
    ];
    
    disputeResolution: {
      mediationPeriod: 7,    // Days
      evidenceRequired: true,
      platformDecision: 'final'
    };
  };
  
  // Invoicing
  invoicing: {
    automatic: true,
    includesVAT: true,
    languages: ['en', 'de', 'fr'],
    formats: ['pdf', 'xml']
  };
}
```

---

## 📊 **Job Board Features**

### **Search & Discovery**

```typescript
interface JobSearchFeatures {
  // Smart filters
  filters: {
    category: MultiSelect;
    location: LocationRadius;
    compensation: RangeSlider;
    dateRange: Calendar;
    clientType: Checkboxes;
    experienceLevel: Radio;
  };
  
  // Sorting options
  sortBy: [
    'newest',
    'deadline_soon',
    'highest_paid',
    'most_relevant',
    'client_rating'
  ];
  
  // Saved searches
  savedSearches: {
    name: string;
    filters: FilterSet;
    notifications: boolean;
    frequency: 'instant' | 'daily' | 'weekly';
  }[];
  
  // Job alerts
  alerts: {
    matchScore: number;      // Minimum match % for notification
    maxPerDay: number;       // Limit notifications
    quietHours: TimeRange;   // No notifications during sleep
  };
}
```

### **Job Board Layout**

```typescript
interface JobBoardUI {
  // List view
  listView: {
    layout: 'cards' | 'table' | 'compact';
    showPreview: boolean;
    quickApply: boolean;
    compareMode: boolean;
  };
  
  // Map view
  mapView: {
    enabled: boolean;
    clustering: boolean;
    radiusDisplay: boolean;
  };
  
  // Calendar view
  calendarView: {
    enabled: boolean;
    showAvailability: boolean;
    syncWithPersonal: boolean;
  };
}
```

---

## 🎯 **Implementation Priority**

### **Phase 1: Job System**
1. Create job posting schema
2. Build job creation UI for clients
3. Implement job search for talents
4. Create application flow

### **Phase 2: Gig System**
1. Design gig creation interface
2. Build package pricing system
3. Create gig marketplace
4. Implement instant booking

### **Phase 3: Payments**
1. Integrate Stripe Connect
2. Build escrow system
3. Create invoice generation
4. Implement dispute resolution

### **Phase 4: Advanced Features**
1. Job matching algorithm
2. Smart notifications
3. Analytics dashboard
4. Mobile optimization

---

## 🏷️ **Universal Tagging System**

### **Database Architecture**

```typescript
// Universal tag system for any entity
model Tag {
  id          String   @id @default(uuid())
  tenantId    String
  name        String
  slug        String   // URL-friendly version
  category    String?  // Optional: group tags (skills, styles, etc.)
  usageCount  Int      @default(0)
  isSystem    Boolean  @default(false) // Platform-provided vs user-created
  
  @@unique([tenantId, slug])
  @@index([tenantId, category])
}

// Junction table for ANY entity
model EntityTag {
  id         String   @id @default(uuid())
  tenantId   String
  tagId      String
  entityType String   // 'model', 'job', 'gig', 'media', 'list', etc.
  entityId   String   // UUID of the tagged entity
  addedBy    String   // User who added the tag
  addedAt    DateTime @default(now())
  
  tag        Tag      @relation(fields: [tagId], references: [id])
  
  @@unique([tagId, entityType, entityId])
  @@index([entityType, entityId])
  @@index([tenantId, entityType])
}

// For user-specific collections (favorites, lists)
model UserCollection {
  id          String   @id @default(uuid())
  userId      String
  name        String
  type        String   // 'favorites', 'wishlist', 'shortlist', etc.
  isPublic    Boolean  @default(false)
  
  items       CollectionItem[]
}

model CollectionItem {
  id           String   @id @default(uuid())
  collectionId String
  entityType   String   // 'model', 'gig', 'job', etc.
  entityId     String
  notes        String?  // Personal notes
  addedAt      DateTime @default(now())
  
  collection   UserCollection @relation(fields: [collectionId], references: [id])
  
  @@unique([collectionId, entityType, entityId])
}
```

### **Tag Usage Across Entities**

```typescript
// Tagging service implementation
class UniversalTaggingService {
  // Add tags to any entity
  async tagEntity(params: {
    entityType: string;
    entityId: string;
    tags: string[];
    userId: string;
    tenantId: string;
  }) {
    // Create tags if they don't exist
    const tagRecords = await this.findOrCreateTags(params.tags, params.tenantId);
    
    // Create entity-tag relationships
    const entityTags = tagRecords.map(tag => ({
      tagId: tag.id,
      entityType: params.entityType,
      entityId: params.entityId,
      tenantId: params.tenantId,
      addedBy: params.userId
    }));
    
    await this.db.entityTag.createMany({
      data: entityTags,
      skipDuplicates: true
    });
    
    // Update usage counts
    await this.updateTagUsageCounts(tagRecords.map(t => t.id));
  }
  
  // Get all entities with specific tags
  async getEntitiesByTags(params: {
    tags: string[];
    entityType: string;
    tenantId: string;
    operator: 'AND' | 'OR';
  }) {
    if (params.operator === 'AND') {
      // Find entities that have ALL specified tags
      return this.db.$queryRaw`
        SELECT entity_id
        FROM entity_tags et
        JOIN tags t ON et.tag_id = t.id
        WHERE et.entity_type = ${params.entityType}
          AND et.tenant_id = ${params.tenantId}
          AND t.slug = ANY(${params.tags})
        GROUP BY entity_id
        HAVING COUNT(DISTINCT t.slug) = ${params.tags.length}
      `;
    } else {
      // Find entities that have ANY of the specified tags
      return this.db.entityTag.findMany({
        where: {
          entityType: params.entityType,
          tenantId: params.tenantId,
          tag: {
            slug: { in: params.tags }
          }
        },
        distinct: ['entityId']
      });
    }
  }
  
  // Suggest tags based on context
  async suggestTags(params: {
    entityType: string;
    existingTags: string[];
    tenantId: string;
  }) {
    // Get frequently used together tags
    const relatedTags = await this.db.$queryRaw`
      SELECT t2.slug, t2.name, COUNT(*) as co_occurrence
      FROM entity_tags et1
      JOIN entity_tags et2 ON et1.entity_id = et2.entity_id 
        AND et1.entity_type = et2.entity_type
      JOIN tags t1 ON et1.tag_id = t1.id
      JOIN tags t2 ON et2.tag_id = t2.id
      WHERE et1.entity_type = ${params.entityType}
        AND et1.tenant_id = ${params.tenantId}
        AND t1.slug = ANY(${params.existingTags})
        AND t2.slug != ALL(${params.existingTags})
      GROUP BY t2.slug, t2.name
      ORDER BY co_occurrence DESC
      LIMIT 10
    `;
    
    return relatedTags;
  }
}
```

### **Tag Categories for Different Entities**

```typescript
const TAG_CATEGORIES = {
  // Model/talent tags
  profile: {
    skills: ['runway', 'editorial', 'commercial', 'fitness'],
    styles: ['high-fashion', 'streetwear', 'vintage', 'casual'],
    experience: ['beginner', 'intermediate', 'professional', 'expert'],
    availability: ['immediate', 'weekends', 'flexible', 'traveling']
  },
  
  // Job posting tags
  job: {
    urgency: ['urgent', 'flexible', 'planned', 'recurring'],
    type: ['paid', 'tfp', 'volunteer', 'internship'],
    duration: ['half-day', 'full-day', 'multi-day', 'ongoing'],
    team_size: ['solo', 'small-team', 'large-production']
  },
  
  // Gig service tags
  gig: {
    service_type: ['portfolio', 'headshots', 'lifestyle', 'product'],
    turnaround: ['24-hours', '3-days', '1-week', 'flexible'],
    includes: ['editing', 'retouching', 'prints', 'digital-only'],
    level: ['budget', 'standard', 'premium', 'luxury']
  },
  
  // Media tags
  media: {
    content: ['portfolio', 'behind-scenes', 'polaroid', 'test-shoot'],
    usage: ['web', 'print', 'social-media', 'billboard'],
    style: ['color', 'black-white', 'film', 'digital'],
    mood: ['dramatic', 'natural', 'artistic', 'commercial']
  }
};
```

---

## 💬 **Enhanced Communication System**

### **Gig-Specific Communication**

```typescript
// Enhanced message types for different contexts
enum MessageContext {
  DIRECT = 'direct',        // 1-to-1 personal
  PROJECT = 'project',      // Group project discussion
  GIG = 'gig',             // Gig-specific communication
  BOOKING = 'booking',      // Booking-related messages
  JOB_APPLICATION = 'job_application' // Job application discussions
}

model Conversation {
  id           String         @id @default(uuid())
  tenantId     String
  type         MessageContext
  
  // Context references
  gigId        String?        // For gig conversations
  bookingId    String?        // For booking conversations
  projectId    String?        // For project conversations
  jobId        String?        // For job application conversations
  
  // Conversation settings
  allowFiles   Boolean        @default(true)
  maxFileSize  Int           @default(10485760) // 10MB default
  allowedFileTypes Json?      // ['pdf', 'doc', 'jpg', etc.]
  
  // Translation settings
  autoTranslate Boolean      @default(false)
  primaryLanguage String     @default('en')
  
  participants ConversationParticipant[]
  messages     Message[]
}

model Message {
  id             String   @id @default(uuid())
  conversationId String
  senderId       String
  
  // Original message
  content        String
  language       String   // ISO language code (auto-detected)
  
  // Translations (cached)
  translations   Json?    // { "es": "Hola", "fr": "Bonjour" }
  translationQuality Json? // { "es": 0.95, "fr": 0.92 } confidence scores
  
  // Rich content
  richContent    Json?    // For formatted text, mentions, etc.
  
  // Attachments
  attachments    MessageAttachment[]
  
  // Gig/Job specific
  gigMilestone   String?  // Reference to gig milestone
  contractUpdate Boolean  @default(false)
  
  sentAt         DateTime @default(now())
  editedAt       DateTime?
  deletedAt      DateTime?
}

model MessageAttachment {
  id         String   @id @default(uuid())
  messageId  String
  type       String   // 'document', 'image', 'contract', 'brief', 'invoice'
  fileName   String
  fileUrl    String
  fileSize   Int
  mimeType   String
  
  // For gig/job documents
  documentType String?  // 'contract', 'brief', 'invoice', 'reference'
  requiresSignature Boolean @default(false)
  signatureStatus Json?   // Track multiple signatures if needed
  
  // Version control for contracts
  version     Int      @default(1)
  previousVersionId String?
  
  uploadedAt  DateTime @default(now())
}
```

### **Real-Time Translation Service**

```typescript
class MessageTranslationService {
  private llmProviders: Map<string, LLMProvider>;
  private translationCache: Redis;
  
  async translateMessage(
    message: Message,
    targetLanguage: string,
    userId: string,
    conversationContext?: ConversationContext
  ): Promise<TranslatedMessage> {
    // Check subscription tier
    const subscription = await this.checkUserSubscription(userId);
    
    if (!this.hasTranslationAccess(subscription)) {
      throw new Error('Translation requires Professional subscription or higher');
    }
    
    // Check translation limits
    const monthlyUsage = await this.getMonthlyTranslationUsage(userId);
    const limit = this.getTranslationLimit(subscription);
    
    if (monthlyUsage >= limit && limit !== -1) {
      throw new Error('Monthly translation limit reached');
    }
    
    // Check cache
    const cacheKey = `translation:${message.id}:${targetLanguage}`;
    const cached = await this.translationCache.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    // Detect source language if not provided
    const sourceLanguage = message.language || await this.detectLanguage(message.content);
    
    // Get industry-specific glossary
    const glossary = await this.getIndustryGlossary(
      conversationContext?.industry || 'modeling',
      sourceLanguage,
      targetLanguage
    );
    
    // Translate with context
    const translation = await this.performTranslation({
      text: message.content,
      sourceLanguage,
      targetLanguage,
      glossary,
      context: conversationContext,
      previousMessages: await this.getConversationContext(message.conversationId, 5)
    });
    
    // Cache translation
    await this.cacheTranslation(message.id, targetLanguage, translation);
    
    // Track usage
    await this.trackTranslationUsage(userId, message.content.length);
    
    return translation;
  }
  
  // Industry-specific glossary
  private async getIndustryGlossary(
    industry: string,
    sourceLang: string,
    targetLang: string
  ): Promise<TranslationGlossary> {
    const glossaryKey = `glossary:${industry}:${sourceLang}:${targetLang}`;
    
    // Common modeling/fashion terms that shouldn't be translated
    const preserveTerms = [
      'TFP', 'Time for Print',
      'Polaroid',
      'Sedcard', 'Comp Card',
      'Call Sheet',
      'Lookbook',
      'Editorial',
      'Commercial'
    ];
    
    // Industry-specific translations
    const industryTerms = {
      modeling: {
        'casting': { 
          'es': 'casting', // Keep English in Spanish
          'de': 'Casting',
          'fr': 'casting'
        },
        'runway': {
          'es': 'pasarela',
          'de': 'Laufsteg',
          'fr': 'défilé'
        }
      }
    };
    
    return {
      preserveTerms,
      industryTerms: industryTerms[industry] || {},
      contextRules: this.getContextRules(industry)
    };
  }
}
```

### **Communication Features by Context**

```typescript
// Gig-specific communication features
interface GigCommunicationFeatures {
  // Document management
  documentSharing: {
    contracts: {
      upload: boolean;
      versioning: boolean;
      signatures: boolean;
      templates: string[];
    };
    briefs: {
      templates: boolean;
      collaborative: boolean;
      approval: boolean;
    };
    references: {
      moodboards: boolean;
      examples: boolean;
      brandGuidelines: boolean;
    };
  };
  
  // Milestone communication
  milestoneThreads: {
    automatic: boolean;         // Auto-create threads for milestones
    statusUpdates: boolean;
    deliveryNotifications: boolean;
    revisionRequests: boolean;
  };
  
  // Translation features
  translation: {
    available: boolean;
    languages: string[];
    autoDetect: boolean;
    glossary: boolean;
    voiceNotes: boolean;       // Translate voice messages
  };
  
  // Quick responses
  quickResponses: {
    templates: string[];
    customizable: boolean;
    contextAware: boolean;      // Suggest based on conversation
  };
  
  // Scheduling integration
  scheduling: {
    availabilityShare: boolean;
    meetingLinks: boolean;
    calendarSync: boolean;
    timezoneHandling: boolean;
  };
}
```

### **Subscription Tiers for Communication**

```typescript
const CommunicationSubscriptionFeatures = {
  starter: {
    messaging: {
      directMessages: true,
      gigMessages: true,
      maxConversations: 50,
      maxParticipantsPerConversation: 10
    },
    fileSharing: {
      enabled: true,
      maxFileSize: 5 * 1024 * 1024,  // 5MB
      allowedTypes: ['jpg', 'png', 'pdf'],
      monthlyStorageLimit: 100 * 1024 * 1024  // 100MB
    },
    translation: {
      enabled: false
    },
    templates: {
      system: true,
      custom: 0
    }
  },
  
  professional: {
    messaging: {
      allTypes: true,
      maxConversations: 500,
      maxParticipantsPerConversation: 50,
      priority: 'high'
    },
    fileSharing: {
      enabled: true,
      maxFileSize: 50 * 1024 * 1024,  // 50MB
      allowedTypes: 'all',
      monthlyStorageLimit: 5 * 1024 * 1024 * 1024  // 5GB
    },
    translation: {
      enabled: true,
      languages: ['en', 'es', 'fr', 'de', 'it', 'pt'],
      monthlyCharacterLimit: 100000,
      autoDetect: true,
      glossary: true
    },
    templates: {
      system: true,
      custom: 20,
      variables: true
    },
    features: {
      voiceMessages: true,
      videoMessages: true,
      screenSharing: true,
      messageScheduling: true
    }
  },
  
  enterprise: {
    messaging: {
      unlimited: true,
      priority: 'highest',
      dedicatedSupport: true
    },
    fileSharing: {
      unlimited: true,
      maxFileSize: 500 * 1024 * 1024,  // 500MB
      directCloudIntegration: true
    },
    translation: {
      enabled: true,
      languages: 'all',  // 50+ languages
      unlimitedTranslation: true,
      customGlossary: true,
      voiceTranslation: true,
      realTimeTranslation: true  // Live chat translation
    },
    templates: {
      unlimited: true,
      aiGenerated: true,
      brandCustomization: true
    },
    features: {
      apiAccess: true,
      webhooks: true,
      customIntegrations: true,
      whiteLabel: true,
      analytics: true
    }
  }
};
```

### **Communication UI Components**

```typescript
// Enhanced gig conversation interface
const GigConversationUI = () => {
  const [showTranslation, setShowTranslation] = useState(false);
  const { subscription } = useSubscription();
  const { userLanguage } = useUserPreferences();
  
  return (
    <div className="flex h-full">
      {/* Gig context sidebar */}
      <aside className="w-80 border-r">
        <GigDetails gig={gig} />
        <MilestoneTracker milestones={milestones} />
        <DocumentManager documents={documents} />
        <ParticipantList participants={participants} />
      </aside>
      
      {/* Main conversation area */}
      <div className="flex-1 flex flex-col">
        {/* Conversation header with translation toggle */}
        <header className="border-b p-4 flex justify-between">
          <h2>{conversation.title}</h2>
          {subscription.translation.enabled && (
            <TranslationToggle
              enabled={showTranslation}
              onChange={setShowTranslation}
              targetLanguage={userLanguage}
            />
          )}
        </header>
        
        {/* Messages */}
        <MessageList className="flex-1 overflow-y-auto">
          {messages.map(message => (
            <MessageBubble
              key={message.id}
              message={message}
              showTranslation={showTranslation && message.language !== userLanguage}
              onTranslate={() => translateMessage(message.id, userLanguage)}
              canEdit={message.senderId === currentUser.id}
            />
          ))}
        </MessageList>
        
        {/* Rich message composer */}
        <MessageComposer
          onSend={sendMessage}
          features={{
            attachments: true,
            voiceNote: subscription.features?.voiceMessages,
            templates: gigMessageTemplates,
            scheduling: subscription.features?.messageScheduling,
            translation: subscription.translation.enabled
          }}
        />
      </div>
      
      {/* Quick actions sidebar */}
      <aside className="w-64 border-l p-4">
        <QuickActions>
          <ShareAvailability />
          <SendContract />
          <RequestRevision />
          <ScheduleMeeting />
        </QuickActions>
      </aside>
    </div>
  );
};
```

---

This enhanced architecture provides:

1. **Universal Tagging System**
   - Works across all entities (models, jobs, gigs, media, etc.)
   - Efficient junction table design
   - Tag suggestions based on co-occurrence
   - Collections for user favorites and lists

2. **Enhanced Communication**
   - Context-aware conversations (gig, job, project)
   - Real-time translation with industry glossaries
   - Document versioning and signatures
   - Subscription-based features

3. **Gig-Specific Features**
   - Milestone-based communication threads
   - Contract and brief management
   - Integrated scheduling
   - Quick response templates

The system is designed to scale efficiently while providing rich features for professional creative industry communication.