# itellico Mono: Consolidated Implementation Plan
## Complete Development Roadmap with All Systems Integrated

---

## 🎯 **Executive Summary**

This document consolidates ALL architectural decisions, existing systems, and new marketplace features into a single actionable implementation plan. It integrates:

- ✅ **Enhanced Platform Architecture** (Industry Templates, Subscriptions, Compiled Models)
- ✅ **5-Tier Navigation System** (Super Admin → Tenant → Agency → Talent → Client)
- ✅ **Dual-Sided Marketplace** (Flexible participation, advanced search, messaging)
- ✅ **Comprehensive Media Architecture** (Hierarchical storage with CDN)
- ✅ **Existing Strong Foundation** (RBAC, Components, Admin Patterns)

---

## 🏗️ **What We're Building**

### **Go Models: A Two-Sided Creative Marketplace**

```
SUPPLY SIDE (Talent)                    DEMAND SIDE (Clients)
├── Models                              ├── Casting Directors
├── Photographers*                      ├── Brands
├── Makeup Artists                      ├── Production Companies
├── Stylists                           └── Photographers*
└── Agencies                               (*can be on both sides)
```

**Key Features:**
- Advanced search with saved filters & notifications
- Direct & project-based messaging
- Booking & payment system
- Portfolio management with CDN
- White-label theming per tenant

---

## 📊 **Current State vs. Target State**

### **What We Have (Strong Foundation)**
- ✅ **RBAC System**: 100% complete with pattern-based permissions
- ✅ **Component Library**: 60+ reusable UI components
- ✅ **Admin Infrastructure**: Established patterns with AdminListPage/AdminEditPage
- ✅ **Data Models**: Comprehensive schemas for creative industries
- ✅ **Seeding System**: 200+ option sets, 15+ model schemas ready

### **What We Need to Build**
- 🔨 **Marketplace Core**: Search, profiles, bookings
- 🔨 **Dual-Sided Profiles**: Users can be both talent and client
- 🔨 **Messaging System**: Direct + project messages
- 🔨 **Media Architecture**: Hierarchical storage with CDN
- 🔨 **Industry Templates**: Installable marketplace configurations
- 🔨 **Compiled Models**: Performance-optimized schemas

---

## 🚀 **Implementation Phases**

### **Phase 1: Foundation Enhancement (Weeks 1-2)**

#### **Week 1: Database & Navigation**
```sql
-- Priority 1: Create new tables
CREATE TABLE industry_templates (...);
CREATE TABLE feature_sets (...);
CREATE TABLE tenant_branding (...);
CREATE TABLE marketplace_profiles (...);
CREATE TABLE saved_searches (...);
CREATE TABLE project_messages (...);
```

**Tasks:**
1. Create all new database tables
2. Consolidate 4 sidebar implementations → 5-tier system
3. Complete Fastify hybrid setup
4. Set up media directory structure

#### **Week 2: Core Marketplace Pages**
**Using existing components:**
```typescript
// Talent Search Page
<AdminListPage
  endpoint="/api/v1/marketplace/talents"
  columns={talentColumns}
  filters={schemaBasedFilters}
  customActions={['save-search', 'export', 'compare']}
/>

// Talent Profile Page  
<div className="profile-page">
  <ProfileHero />
  <MediaGallery />
  <BookingCalendar />
  <ReviewSection />
</div>
```

---

### **Phase 2: Marketplace Features (Weeks 3-4)**

#### **Week 3: Search & Discovery**
- Build schema-based dynamic filters
- Implement saved searches with notifications
- Create talent comparison tool
- Add export functionality

#### **Week 4: Profile System**
- Implement dual-sided profiles
- Build profile switching UI
- Create portfolio management
- Add verification system

---

### **Phase 3: Communication (Weeks 5-6)**

#### **Week 5: Messaging System**
- Implement direct messages (1-to-1)
- Build project messages (group chat)
- Add file sharing capabilities
- Create notification preferences

#### **Week 6: Email & Invitations**
- Set up platform email templates
- Build tenant email customization
- Implement multi-level invitations
- Create onboarding workflows

---

### **Phase 4: Advanced Features (Weeks 7-8)**

#### **Week 7: Industry Templates**
- Build Industry Template Manager UI
- Create modeling industry template
- Implement template installer
- Generate compiled models

#### **Week 8: Media & Theming**
- Implement hierarchical media storage
- Set up CDN integration
- Build tenant CSS theming
- Create branding configuration UI

---

## 🔧 **Technical Implementation Details**

### **1. API Structure (Fastify)**
```typescript
/api/v1/
├── marketplace/
│   ├── talents/           # Search and list
│   ├── talents/:id        # Profile details
│   ├── bookings/          # Booking management
│   ├── messages/          # Messaging endpoints
│   └── search/saved       # Saved searches
├── admin/
│   ├── industry-templates/
│   ├── feature-sets/
│   └── tenant-branding/
└── media/
    ├── upload/
    └── optimize/
```

### **2. Database Schema Additions**
```typescript
// New models to add to Prisma schema
model MarketplaceProfile {
  id          String   @id @default(uuid())
  userId      String
  profileType String   // 'talent' | 'client'
  category    String   // 'model' | 'photographer' etc
  canOffer    Boolean  // Supply side
  canBook     Boolean  // Demand side
  // ... profile data
}

model SavedSearch {
  id                    String   @id @default(uuid())
  userId                String
  name                  String
  entityType            String
  filters               Json
  notificationsEnabled  Boolean
  notificationFrequency String
  // ... notification settings
}

model ProjectMessage {
  id          String   @id @default(uuid())
  projectId   String
  projectName String
  participants Json    // Array of participants with roles
  channels    Json     // Different discussion channels
  // ... message data
}
```

### **3. Component Development Priority**
```typescript
// New components to build
const NEW_COMPONENTS = [
  // Week 1-2
  "ProfileSwitcher",      // Switch between talent/client profiles
  "TalentSearchBar",      // Advanced search with filters
  "TalentCard",          // Grid view display
  
  // Week 3-4
  "SavedSearchManager",   // Manage saved searches
  "NotificationSettings", // Configure alerts
  "ProfileVerification",  // Trust badges
  
  // Week 5-6
  "MessageComposer",      // Rich text messaging
  "ProjectChat",         // Group messaging UI
  "InvitationWizard",    // Multi-step invitations
  
  // Week 7-8
  "TemplateInstaller",   // Install industry templates
  "BrandingEditor",      // Customize tenant theme
  "MediaLibrary"         // Manage all media assets
];
```

---

## 📋 **Data Seeding Strategy**

### **Go Models Tenant Seed Data**
```typescript
// Phase 1: Platform setup
await seedIndustryTemplates(['modeling', 'photography']);
await seedFeatureSets(['ai_tools', 'analytics', 'media_advanced']);
await seedSubscriptionPlans(['starter', 'pro', 'enterprise']);

// Phase 2: Create Go Models tenant
const goModels = await createTenant({
  name: 'Go Models',
  domain: 'gomodels.com',
  industry: 'modeling',
  subscription: 'enterprise'
});

// Phase 3: Install modeling template
await installIndustryTemplate(goModels.id, 'modeling');

// Phase 4: Seed marketplace data
await seedCategories(goModels.id, modelingCategories);
await seedAccounts(goModels.id, [agencies, individuals]);
await seedProfiles(goModels.id, [models, photographers]);
await seedClients(goModels.id, [brands, castingDirectors]);

// Phase 5: Sample content
await seedCastingCalls(goModels.id, 20);
await seedBookings(goModels.id, 50);
await seedMessages(goModels.id, 200);
```

---

## ✅ **Implementation Checklist**

### **Week 1-2: Foundation**
- [ ] Create all database tables
- [ ] Consolidate navigation into 5-tier system
- [ ] Build marketplace search page
- [ ] Create talent profile page
- [ ] Set up media directory structure

### **Week 3-4: Core Features**
- [ ] Implement saved searches
- [ ] Build dual-sided profiles
- [ ] Create booking flow
- [ ] Add portfolio management

### **Week 5-6: Communication**
- [ ] Build messaging system
- [ ] Implement email templates
- [ ] Create invitation system
- [ ] Set up notifications

### **Week 7-8: Advanced**
- [ ] Create industry templates
- [ ] Build compiled models
- [ ] Implement theming
- [ ] Set up CDN

---

## 🎯 **Success Metrics**

### **Technical Goals**
- Page load: <2 seconds
- Search response: <200ms
- 99.9% uptime
- Support 10,000+ concurrent users

### **Business Goals**
- 10,000+ active talent profiles
- 1,000+ verified clients
- 500+ monthly bookings
- 60%+ mobile usage

---

## 🚦 **Ready to Start**

The architecture is now:
- ✅ **Complete**: All systems designed and documented
- ✅ **Integrated**: Building on existing strengths
- ✅ **Actionable**: Clear week-by-week implementation
- ✅ **Scalable**: Supports 700K+ users from day one

**First Step**: Create the database tables and start building the marketplace search page using existing AdminListPage component.