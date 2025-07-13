# MASTER: Multi-Brand Industry Platform Architecture

## 🎯 Vision Statement
Create a **multi-brand platform architecture** where developers build core models and schemas through code, while business users manage categories, tags, and configurations through intuitive UI interfaces. 

**Business Model**: Platform for YOUR multiple brands (go-models.com, go-pets.com, voice-agents.com, etc.) where YOU are always the tenant, but each brand serves different industries.

**Key Insights**: 
- This platform will only be used for our own projects initially
- Later possibility to offer tenant access to external companies  
- Each brand operates as separate tenant with different industry needs
- Shared infrastructure with cross-brand API integration

---

## 📊 Click-Dummy Audit Summary
**77 prototypes analyzed across 5 tiers:**
- **Platform Tier (37)**: Schema builders, global option sets, feature management
- **Tenant Tier (18)**: Industry features (talent mgmt, marketplace, categories)
- **Account Tier (14)**: Team coordination, project management
- **User Tier (12)**: Individual workspaces, portfolios
- **Public Tier (6)**: Industry showcases (Go Models, OvercrewAI)

---

## 🏭 Discovered Industry Verticals

### Modeling Agency Vertical (Most Comprehensive)
- **Talent Categories**: Tattoo models, fitness, curvy, kids (0-24 months), 50+ models
- **Features**: Guardian management, comp cards, casting calls, portfolio management
- **Marketplace**: Talent database, booking system, earnings tracking

### AI Workers Vertical (Emerging)
- **Service Categories**: Customer service agents, automation tools
- **Features**: 24/7 support, multilingual capabilities, per-agent pricing

---

## ❓ QUESTIONS & ANSWERS

### Question 1: Industry Vertical Strategy ✅ ANSWERED

**Options:**
- **A**: Template-Based (Quick setup, proven patterns)
- **B**: Modular Features (Maximum flexibility)
- **C**: Hybrid Approach (Templates + customization)

**@mm Answer:** Option C - We will develop modules, but set option sets and values through interface and installers. No spaghetti code, need to set things straight.

---

### Question 2: Option Set Management Scope ✅ ANSWERED

**Levels:**
- **Level 1**: Value customization only
- **Level 2**: Field addition to existing models
- **Level 3**: Full schema control

**@mm Answer:** We will add all as developers, but tenant should control content. Database concept more important than GUI. If we find new features, develop in core and push to tenants. Tenants control content, workflows, templates, translations, categories, tags (multi-tier).

---

### Question 3: Industry Priority ✅ ANSWERED

**Options:**
- Modeling Agency (most complete prototypes)
@claude its a modelling platform not an agency - but agecies can have an account of type agency in the go-models.com Tenant.
- AI Workers (emerging market)
- Generic Marketplace (broad appeal)

**@mm Answer:** YES, we start with Model Platform.

---

### Question 4: Developer vs UI Boundary ✅ ANSWERED

**Custom Fields & Validation Rules:**
- Hard-coded by developers vs Configurable by admins

**@mm Answer:** Hybrid approach.

---

### Question 5: Technical Implementation ✅ ANSWERED

**Storage & Architecture:**
- JSON fields vs Normalized tables
- Redis caching strategy

**@mm Answer:** We are using Redis. If we want to be flexible we can't go for normalization. Give me your thoughts?
@claude: what are the implications

---

## 🏗️ FINALIZED ARCHITECTURE

### Core Principles
1. **Multi-Brand Platform** - go-models.com, go-pets.com, voice-agents.com, etc.
2. **YOU as Tenant** - Complete control over all tenants initially
3. **Developer-Built Core** - Features implemented by developers in code
4. **Tenant Content Control** - Categories, tags, workflows, translations via UI
5. **Generic Modules** - Reusable across industries with smart configuration
6. **Cross-Brand Integration** - Runtime API calls for data sharing between brands
7. **Redis + Performance** - Flexible JSON configs, avoid over-normalization
8. **Clean Architecture** - No spaghetti code, proper separation of concerns

### Multi-Brand Tenant Structure
```typescript
Platform Level: YOUR core system
├── Tenant: go-models.com (modeling industry)
├── Tenant: go-pets.com (pet industry) 
├── Tenant: voice-agents.com (AI/voice industry)
├── Tenant: go-makeup.com (beauty industry) - future
└── Future: External companies as tenants (monetization)
```

### Database Strategy (Generic + Industry Config)
```typescript
// Core Models (industry-agnostic, normalized for querying)
User, Tenant, Account, Profile, Project, Media, Booking, Gig

// Generic models that adapt to any industry
interface Gig {
  id: string;
  title: string;
  tenant_id: string;
  requirements: jsonb;     // Industry-specific requirements
  industry_data: jsonb;    // Industry-specific fields
}

// Industry Configuration (JSON + Redis caching)
tenant.industry_config = {
  industry: "modeling" | "pets" | "voice" | "beauty",
  categories: ["Fashion", "Commercial", "Editorial"],
  custom_fields: [
    { name: "height", type: "number", required: true },
    { name: "experience", type: "select", options: ["Beginner", "Pro"] }
  ],
  gig_templates: {
    fashion_shoot: { required_fields: [...], compensation_types: [...] }
  },
  workflows: { portfolio_approval: true }
}

// Redis Strategy
- L1: Application cache (TanStack Query)
- L2: Redis hot data (active tenant configs)  
- L3: PostgreSQL source of truth
```

---

## 🎨 GENERIC PLATFORM FEATURES

### 1. Core Generic Models (Developer-Built, Industry-Agnostic)
```typescript
// Generic models that work for all industries
interface User {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  account_id: string;
  // Industry-specific data in JSON
  profile_data: jsonb;        // Height, measurements, skills, etc.
  custom_data: jsonb;         // Account-level custom fields
}

interface Gig {
  id: string;
  title: string;
  description: string;
  tenant_id: string;
  status: "draft" | "active" | "closed";
  requirements: jsonb;        // Industry-specific requirements
  industry_data: jsonb;       // Industry-specific fields
  compensation: Compensation;
  location: Location;
  deadline: Date;
}

// Other generic models
Profile, Project, Media, Booking, Portfolio
```

### 2. Industry Templates (Developer-Built, Tenant-Configured)
```typescript
// Modeling Industry Template
{
  industry: "modeling",
  profile_fields: [
    { name: "height", type: "number", unit: "cm", required: true },
    { name: "measurements", type: "object", required: true },
    { name: "experience_level", type: "select", options: ["Beginner", "Professional"] }
  ],
  gig_templates: {
    fashion_shoot: {
      required_fields: ["age_range", "measurements", "experience"],
      compensation_types: ["hourly", "day_rate", "buyout"]
    },
    runway_show: {
      required_fields: ["height", "measurements", "walking_experience"],
      compensation_types: ["show_fee", "fittings_fee"]
    }
  },
  workflows: ["portfolio_approval", "guardian_consent"],
  categories: ["Fashion", "Commercial", "Editorial", "Runway"]
}

// Pet Industry Template  
{
  industry: "pets",
  profile_fields: [
    { name: "pet_type", type: "select", options: ["dog", "cat", "exotic"] },
    { name: "breed", type: "string", required: true },
    { name: "age", type: "number", unit: "years", required: true },
    { name: "training_level", type: "select", options: ["basic", "advanced", "tricks"] }
  ],
  gig_templates: {
    photo_shoot: {
      required_fields: ["pet_type", "breed", "training_level"],
      compensation_types: ["hourly", "day_rate"]
    },
    commercial: {
      required_fields: ["temperament", "vaccination_status"],
      compensation_types: ["day_rate", "usage_fee"]
    }
  },
  workflows: ["vaccination_verification", "behavioral_assessment"],
  categories: ["Photography", "Commercial", "Shows", "Training"]
}

// Voice Industry Template
{
  industry: "voice",
  profile_fields: [
    { name: "vocal_range", type: "select", options: ["soprano", "alto", "tenor", "bass"] },
    { name: "accents", type: "multi_select", options: ["american", "british", "australian"] },
    { name: "voice_age_range", type: "range", min: 0, max: 100 },
    { name: "studio_quality", type: "select", options: ["professional", "home", "mobile"] }
  ],
  gig_templates: {
    narrator: {
      required_fields: ["vocal_range", "accents", "demo_reel"],
      compensation_types: ["per_word", "per_hour", "flat_rate"]
    },
    character_voice: {
      required_fields: ["voice_age_range", "character_types"],
      compensation_types: ["per_line", "per_session", "buyout"]
    }
  },
  workflows: ["demo_approval", "client_review"],
  categories: ["Narrator", "Character", "Commercial", "Audiobook"]
}
```

### 3. Cross-Brand Integration (Runtime API Calls)
```typescript
// Display voice profile on modeling platform
GET /api/v2/tenant/go-voice/users/{userId}/voice-profile

// Show modeling work on voice platform  
GET /api/v2/tenant/go-models/users/{userId}/modeling-profile

// Cross-platform gigs
{
  title: "Commercial with Voice-Over",
  requirements: {
    modeling: { type: "commercial", age_range: [20, 35] },
    voice: { type: "narrator", accent: "american" }
  }
}
```

### 4. Admin Panel Strategy
```typescript
// Platform Panel (YOU - platform owner)
- Manage all tenants
- Create new brands/tenants  
- Configure cross-tenant permissions
- Monitor system-wide metrics

// Tenant Admin Panel (per brand - go-models.com, go-pets.com, etc.)
- Manage categories and tags for that industry
- Configure workflows for that brand
- Brand-specific settings and customization
- Request features from other tenants via API
```

---

## 🔧 DETAILED TECHNICAL QUESTIONS

### Redis + JSON vs Normalization Strategy

Since you prefer Redis and flexibility over normalization, I suggest:

```typescript
// Option A: Heavy JSON approach (Maximum flexibility)
tenant.config = {
  industry: "modeling_agency",
  model_categories: [
    { id: 1, name: "Fashion", min_age: 16, max_age: 35 },
    { id: 2, name: "Kids", min_age: 0, max_age: 17, requires_guardian: true }
  ],
  custom_fields: [
    { name: "height", type: "number", unit: "cm", required: true },
    { name: "experience", type: "select", options: ["Beginner", "Pro"] }
  ],
  workflows: {
    portfolio_approval: { enabled: true, auto_approve_after: 7 },
    guardian_consent: { enabled: true, digital_signature: true }
  }
}

// Option B: Hybrid (Core entities + JSON config)
Core Tables: User, Casting, Portfolio, Booking
Config Tables: TenantConfig (JSON), Categories, Tags
```

## 🎯 FINALIZED ANSWERS & DECISIONS

### ✅ Technical Implementation Decisions

**1. Database Strategy: Hybrid Approach**
- **Core entities**: Normalized PostgreSQL tables (User, Gig, Profile, etc.)
- **Industry configs**: JSON fields with Redis caching
- **Complex queries**: PostgreSQL with JSON operators
- **Hot data**: Redis L2 cache for performance

**2. Permission Strategy: Platform-Controlled**
- **Platform owners** create roles from hard-coded permissions
- **Tenants** use predefined roles (no custom permission creation)
- **Accounts** get basic module access control (not fine-grained)
- **Pattern**: `tenant.{industry}.{resource}.{action}`

**3. Custom Fields: Account-Level Only**
```typescript
// Custom fields only available at account level, not tenant level
{
  id: 1,
  name: "Jane Model",
  // Standard fields (tenant/industry template)
  profile_data: { height: 175, measurements: {...} },
  // Account-specific custom fields
  custom_data: { 
    agency_notes: "Preferred for luxury brands",
    internal_rating: 9,
    custom_measurements: {...}
  }
}
```

**4. Generic Gig Module: Single Module for All Industries**
- ✅ **One gig system** that adapts to any industry via JSON configuration
- ✅ **Industry templates** define required fields and workflows
- ✅ **Code reuse** across all brands (go-models, go-pets, go-voice)
- ✅ **Cross-industry gigs** possible (model + voice work)

**5. No GUI Builders Needed**
- ❌ **Skip form/page builders** - too complex and unnecessary
- ✅ **Developer-built React components** with tenant configuration
- ✅ **Category/tag management UI** for business users
- ✅ **Smart configuration interfaces** for workflows and settings

**6. Category/Tag Strategy: Installer + System Categories**
- ✅ Start with **installer-provided** categories and tags per industry
- ✅ Include **system categories** that cannot be deleted
- ✅ Allow **customization** on top of foundation
- ✅ **Multi-tier inheritance**: Platform → Tenant → Account

---

## 🚀 IMPLEMENTATION ROADMAP

### Phase 1: Generic Platform Foundation ⭐ **START HERE**
- [ ] **Generic Core Models**: User, Gig, Profile, Media, Booking (industry-agnostic)
- [ ] **Industry Template System**: JSON-based configuration for modeling/pets/voice
- [ ] **Tenant Configuration API**: CRUD for categories, tags, workflows
- [ ] **Redis Caching Strategy**: L1 (TanStack) + L2 (Redis) + L3 (PostgreSQL)
- [ ] **Permission System**: Hard-coded permissions with role management
- [ ] **Basic Admin UI**: Category/tag management for tenants

### Phase 2: go-models.com (First Brand) 
- [ ] **Modeling Industry Template**: Profile fields, gig templates, workflows
- [ ] **Portfolio System**: Photo uploads, categorization, approval workflows
- [ ] **Generic Gig System**: Casting calls with modeling-specific templates
- [ ] **Account Custom Fields**: Agency-specific customization
- [ ] **Public Profile Pages**: SEO-optimized model profiles
- [ ] **Search & Discovery**: Advanced filtering and matching

### Phase 3: Multi-Brand Expansion
- [ ] **go-pets.com**: Pet industry template and gig system
- [ ] **Cross-Brand API Integration**: Runtime data sharing between tenants
- [ ] **Brand-Specific Admin Panels**: Separate admin interfaces per tenant
- [ ] **Template Installers**: One-click setup for new industry brands
- [ ] **Voice Features on go-models**: Add voice capabilities to modeling profiles

### Phase 4: Advanced Platform Features
- [ ] **go-voice.com**: Dedicated voice platform with full feature set
- [ ] **Cross-Platform Gigs**: Multi-industry casting calls
- [ ] **Advanced Workflows**: Guardian consent, approval processes
- [ ] **Analytics & Reporting**: Business intelligence across all brands
- [ ] **External Tenant Support**: Prepare for offering platform to other companies

### Phase 5: Optimization & Scale
- [ ] **Performance Optimization**: Advanced caching, query optimization
- [ ] **Advanced Integrations**: Payment processing, third-party tools
- [ ] **Mobile Applications**: Native apps for iOS/Android
- [ ] **White-Label Solutions**: Package platform for external sales
- [ ] **AI/ML Features**: Smart matching, content analysis, recommendations

---

## 🎯 STRATEGIC BENEFITS

### **Multi-Brand Advantages**
- ✅ **Rapid Brand Expansion**: Launch new industries in days, not months
- ✅ **Shared Development Costs**: One codebase serves all brands
- ✅ **Cross-Pollination**: Users discover opportunities across industries
- ✅ **Unified Infrastructure**: Shared auth, payments, analytics
- ✅ **Future Monetization**: White-label platform for external companies

### **Technical Advantages**  
- ✅ **Generic Architecture**: One system adapts to any industry
- ✅ **Redis Performance**: Fast configuration access with caching
- ✅ **Clean Separation**: Core code vs business configuration
- ✅ **API-Driven Integration**: Flexible cross-brand data sharing
- ✅ **Scalable Design**: Ready for growth and new industries

### **Business Advantages**
- ✅ **Industry Expertise**: Apply deep knowledge across verticals  
- ✅ **Competitive Moat**: First truly multi-industry talent platform
- ✅ **Revenue Diversification**: Multiple income streams from different markets
- ✅ **Market Testing**: Validate new industries with minimal investment
- ✅ **Platform Network Effects**: Users attract more users across brands

---

## 🚀 IMMEDIATE NEXT STEPS

**Ready to implement Phase 1: Generic Platform Foundation**

### Priority Tasks:
1. **Database Schema Design**: Generic models (User, Gig, Profile) with JSON fields
2. **Industry Template System**: Configuration structure for modeling/pets/voice
3. **NestJS API Architecture**: Generic endpoints with tenant-aware logic
4. **Redis Integration**: Caching strategy for tenant configurations
5. **Permission System**: Hard-coded permissions with role management

### First Implementation:
- Start with **generic Gig module** (works for all industries)
- Build **tenant configuration API** (categories, tags, workflows)  
- Create **basic admin UI** for category management
- Set up **Redis caching** for performance
- Implement **cross-tenant API** foundation

**This architecture is now finalized and ready for implementation!** 🎯

The multi-brand platform with generic modules, industry templates, and cross-brand integration provides maximum flexibility with minimal complexity - exactly what you need for scaling across different industries while maintaining clean, maintainable code.