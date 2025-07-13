# itellico Mono - Complete Technical Specification
## Modeling & Creative Industry Marketplace

---

## 📋 **Executive Summary**

itellico Mono is a sophisticated multi-tenant SaaS marketplace for the modeling, film, casting, and creative industries. The platform serves 700,000+ existing users with a 5-tier hierarchical architecture supporting complex workflows, AI-assisted processes, and global scalability.

### **Core Architecture**
```
Platform (Mono)
├── Super Admin (Platform Management)
├── Tenant (Platform Operators - e.g., Go Models)
│   ├── Account (Agencies, Photographers, Individual Professionals)
│   │   ├── User (Account Members, Invited Users)
│   │   │   └── Profile (Models, Specialists)
```

### **Key Differentiators**
- **Multi-Profile Users**: Single user can have fitness + hand model profiles
- **Flexible Ownership**: Users can have individual accounts + be invited to agency accounts
- **AI-Driven Workflows**: Human + LLM approval processes with PDF analysis reports
- **Global Marketplace**: US-based measurements with EU/Asian conversions, 700K user migration
- **Industry-Specific**: Sedcards, casting workflows, commission tracking, specialized model types

---

## 🏗️ **Architecture Overview**

### **1. Hierarchical Structure**

#### **Super Admin Level (Platform Management)**
- **Role**: Platform oversight across all tenants
- **Capabilities**:
  - Create industry templates (model schemas, workflows, email templates)
  - Set platform-wide limits and features
  - Monitor cross-tenant analytics
  - Manage global settings and compliance
  - Emergency access and support tools

#### **Tenant Level (Platform Operators)**
- **Role**: Organizations operating their own marketplace instance
- **Example**: Go Models operates platform but also acts as agency within it
- **Capabilities**:
  - White-label platform with subdomain (gomodels.platform.com)
  - Customize industry templates
  - Manage subscription plans for accounts
  - Set tenant-wide workflows and approval processes
  - Invite administrative users

#### **Account Level (Business Entities)**
- **Types**: Agency, Photographer, Individual Professional, Client/Brand
- **Capabilities**:
  - Custom domain support (eliteagency.com)
  - Invite users and assign roles
  - Create branded sedcard templates
  - Set commission rates and payment workflows
  - Configure registration and approval workflows
  - Add custom fields to profile types
  - Access workflow builder

#### **User Level (Individual People)**
- **Multi-Account Membership**: Can have individual account + be invited to multiple agencies
- **Role-Based Access**: Profile Manager, Viewer, Admin, Agency Booker, Parent/Guardian
- **Profile Creation**: Can create multiple profiles in different accounts

#### **Profile Level (Professional Identities)**
- **Types**: Fashion Model, Fitness Model, Hand Model, Voice Model, Pet Model, etc.
- **Ownership**: Determined by who invited the user to the account
- **Age Categories**: Baby (0-2), Child (3-12), Teen (13-17), Adult (18+)

### **2. Core Business Flows**

#### **Model Onboarding Flow**
1. **Registration**: Via custom domain, subdomain, or main platform
2. **Account Assignment**: Direct to agency or individual account creation
3. **Profile Creation**: Select model type(s) based on available templates
4. **AI Review Process**: Configurable workflow (auto, LLM, human-in-loop)
5. **Approval/Rejection**: PDF analysis report generated
6. **Portfolio Building**: Upload categorized media with approval workflows

#### **Casting & Project Flow**
1. **Casting Creation**: Multi-role castings with category-specific pricing
2. **Model Discovery**: Search/browse with regional measurement conversion
3. **Application Process**: Direct model application OR agency submission
4. **Selection Workflow**: Callbacks, go-sees, final selection
5. **Booking Management**: Contract terms, scheduling, payment processing
6. **Project Execution**: Chat coordination, file sharing, deliverable tracking

#### **Payment & Commission Flow**
1. **Agency-Represented**: Client → Agency → Model (agency deducts commission)
2. **Freelance**: Client → Model (direct payment via Stripe)
3. **Cross-Agency**: Configurable commission splits
4. **Invoice Generation**: Automatic or manual based on account settings

---

## 🗄️ **Database Schema Design**

### **Core Entity Relationships**

```sql
-- Enhanced Tenant Model
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  subdomain VARCHAR(100) UNIQUE,
  
  -- Industry Configuration
  industry_type VARCHAR(50), -- 'modeling', 'film', 'photography'
  subscription_tier VARCHAR(20),
  module_config JSONB DEFAULT '{}',
  
  -- White-label Settings
  branding_config JSONB DEFAULT '{}',
  custom_domain VARCHAR(255),
  
  -- Workflow Configuration
  default_workflows JSONB DEFAULT '{}',
  ai_integration_settings JSONB DEFAULT '{}',
  
  -- Multi-language Support
  supported_languages VARCHAR(10)[] DEFAULT ARRAY['en-US'],
  default_language VARCHAR(10) DEFAULT 'en-US',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Account Model
CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  tenant_id INTEGER REFERENCES tenants(id),
  
  -- Account Identity
  account_type VARCHAR(50), -- 'agency', 'photographer', 'individual_professional', 'client'
  business_name VARCHAR(255),
  display_name VARCHAR(255),
  slug VARCHAR(100),
  
  -- White-label & Domain
  custom_domain VARCHAR(255),
  branding_config JSONB DEFAULT '{}',
  
  -- Business Settings
  commission_rate DECIMAL(5,2), -- For agencies
  payment_terms JSONB DEFAULT '{}',
  business_settings JSONB DEFAULT '{}',
  
  -- Workflow Configuration
  registration_workflow VARCHAR(50) DEFAULT 'manual', -- 'auto', 'ai', 'manual'
  approval_workflows JSONB DEFAULT '{}',
  
  -- Features & Permissions
  enabled_features VARCHAR(50)[],
  custom_fields_config JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Model (People)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid UUID UNIQUE DEFAULT gen_random_uuid(),
  
  -- Identity
  email VARCHAR(255) UNIQUE,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(30),
  
  -- Authentication
  password_hash VARCHAR(255),
  email_verified BOOLEAN DEFAULT false,
  
  -- Preferences
  language_preference VARCHAR(10) DEFAULT 'en-US',
  timezone VARCHAR(50),
  regional_preferences JSONB DEFAULT '{}',
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account Memberships (Users can belong to multiple accounts)
CREATE TABLE account_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id INTEGER REFERENCES accounts(id),
  user_id INTEGER REFERENCES users(id),
  
  -- Role & Permissions
  role VARCHAR(50), -- 'owner', 'admin', 'profile_manager', 'viewer', 'agency_booker'
  permissions JSONB DEFAULT '{}',
  
  -- Invitation Details
  invited_by INTEGER REFERENCES users(id),
  invitation_token VARCHAR(255),
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'active', 'suspended'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(account_id, user_id)
);

-- Model Profiles
CREATE TABLE model_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id INTEGER REFERENCES accounts(id),
  user_id INTEGER REFERENCES users(id),
  
  -- Profile Identity
  profile_type VARCHAR(50), -- 'fashion', 'fitness', 'hand', 'voice', 'pet', etc.
  profile_subtype VARCHAR(50), -- 'commercial', 'editorial', 'runway', etc.
  stage_name VARCHAR(255),
  slug VARCHAR(255) UNIQUE,
  
  -- Age Category
  age_category VARCHAR(20), -- 'baby', 'child', 'teen', 'adult'
  date_of_birth DATE,
  
  -- Physical Measurements (US base system)
  height_inches INTEGER, -- Base: inches (convert to cm for display)
  weight_lbs DECIMAL(5,2), -- Base: pounds (convert to kg for display)
  
  -- Size Measurements (US base)
  bust_inches INTEGER,
  waist_inches INTEGER,
  hips_inches INTEGER,
  dress_size_us VARCHAR(10), -- Base: US sizing
  shoe_size_us DECIMAL(4,1), -- Base: US sizing
  
  -- Professional Details
  experience_level VARCHAR(30), -- 'new_face', 'experienced', 'professional'
  specialties VARCHAR(50)[],
  job_interests VARCHAR(50)[], -- Types of work they want
  
  -- Rates (in account's default currency)
  hourly_rate_editorial DECIMAL(10,2),
  hourly_rate_commercial DECIMAL(10,2),
  daily_rate_fashion DECIMAL(10,2),
  
  -- Location & Availability
  location_city VARCHAR(100),
  location_country VARCHAR(2),
  travel_radius_miles INTEGER,
  willing_to_travel BOOLEAN DEFAULT false,
  
  -- Portfolio & Media
  profile_photo_id UUID,
  portfolio_config JSONB DEFAULT '{}',
  sedcard_config JSONB DEFAULT '{}',
  sedcard_generated_at TIMESTAMPTZ,
  
  -- Status & Approval
  status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'pending', 'active', 'suspended'
  approval_status VARCHAR(30), -- 'pending', 'approved', 'rejected'
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Child Model Specific
  guardian_name VARCHAR(255),
  guardian_contact VARCHAR(255),
  work_permit_valid_until DATE,
  restrictions TEXT[],
  
  -- Search & Discovery
  search_vector tsvector,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Measurement Conversion Tables
CREATE TABLE measurement_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measurement_type VARCHAR(50), -- 'height', 'weight', 'dress_size', 'shoe_size'
  region VARCHAR(10), -- 'us', 'eu', 'uk', 'asia'
  gender VARCHAR(10), -- 'male', 'female', 'unisex', 'child'
  age_category VARCHAR(20), -- 'baby', 'child', 'teen', 'adult'
  
  -- Conversion mapping
  us_value VARCHAR(20), -- Base US value
  regional_value VARCHAR(20), -- Regional equivalent
  regional_display VARCHAR(50), -- Display format
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio System
CREATE TABLE portfolio_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES model_profiles(id),
  
  section_type VARCHAR(50), -- 'headshots', 'fashion', 'commercial', 'editorial', 'runway', 'beauty'
  title VARCHAR(255),
  description TEXT,
  display_order INTEGER,
  is_public BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE portfolio_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID REFERENCES portfolio_sections(id),
  
  -- Media Details
  media_type VARCHAR(20), -- 'image', 'video'
  file_url TEXT,
  thumbnail_url TEXT,
  file_size_bytes BIGINT,
  dimensions JSONB, -- {width: 1920, height: 1080}
  
  -- Metadata
  caption TEXT,
  photographer_name VARCHAR(255),
  photographer_credit TEXT,
  shoot_date DATE,
  location VARCHAR(255),
  
  -- Organization
  display_order INTEGER,
  is_cover_media BOOLEAN DEFAULT false,
  is_sedcard_eligible BOOLEAN DEFAULT false,
  
  -- Approval Status
  approval_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by INTEGER REFERENCES users(id),
  feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Casting & Projects
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id INTEGER REFERENCES accounts(id),
  created_by INTEGER REFERENCES users(id),
  
  -- Project Details
  project_type VARCHAR(50), -- 'casting', 'editorial', 'commercial', 'campaign', 'runway'
  title VARCHAR(255),
  description TEXT,
  client_name VARCHAR(255),
  
  -- Requirements (can have multiple roles)
  role_requirements JSONB, -- Array of role objects with requirements
  
  -- Timeline
  submission_deadline TIMESTAMPTZ,
  shoot_dates DATERANGE,
  callback_date DATE,
  
  -- Location & Logistics
  location TEXT,
  travel_required BOOLEAN DEFAULT false,
  
  -- Pricing (per role)
  pricing_structure JSONB, -- {role_type: {price_type: 'fixed'|'range'|'negotiable', amount: ...}}
  
  -- Status
  status VARCHAR(30) DEFAULT 'draft', -- 'draft', 'open', 'submissions_closed', 'completed'
  is_public BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Model Applications to Castings
CREATE TABLE casting_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id),
  profile_id UUID REFERENCES model_profiles(id),
  
  -- Application Details
  applied_for_role VARCHAR(50),
  submitted_by INTEGER REFERENCES users(id), -- Could be model or agency
  application_type VARCHAR(20), -- 'direct', 'agency_submitted'
  
  -- Submission Content
  submitted_media_ids UUID[],
  cover_letter TEXT,
  rate_quoted DECIMAL(10,2),
  availability_confirmed BOOLEAN,
  
  -- Status Tracking
  status VARCHAR(30) DEFAULT 'submitted', -- 'submitted', 'under_review', 'callback', 'selected', 'rejected'
  callback_scheduled_at TIMESTAMPTZ,
  callback_location TEXT,
  selection_notes TEXT,
  rejection_reason TEXT,
  
  -- Workflow
  approval_required BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES users(id),
  
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  status_updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Engine
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id INTEGER REFERENCES tenants(id),
  account_id INTEGER REFERENCES accounts(id), -- NULL for tenant-level workflows
  
  -- Workflow Definition
  workflow_type VARCHAR(50), -- 'model_approval', 'media_approval', 'registration', 'application'
  name VARCHAR(255),
  description TEXT,
  
  -- Configuration
  trigger_events VARCHAR(50)[],
  workflow_steps JSONB, -- Array of step definitions
  ai_integration_config JSONB DEFAULT '{}',
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Executions
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES workflows(id),
  
  -- Execution Context
  entity_type VARCHAR(50), -- 'model_profile', 'portfolio_media', 'casting_application'
  entity_id UUID,
  triggered_by INTEGER REFERENCES users(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  current_step INTEGER DEFAULT 1,
  
  -- Results
  execution_log JSONB DEFAULT '[]',
  ai_analysis_result JSONB,
  human_decisions JSONB DEFAULT '{}',
  final_decision VARCHAR(20), -- 'approved', 'rejected', 'pending'
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Saved Searches (Hierarchical)
CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership (hierarchical)
  tenant_id INTEGER REFERENCES tenants(id),
  account_id INTEGER REFERENCES accounts(id), -- NULL for tenant-wide
  user_id INTEGER REFERENCES users(id), -- NULL for account-wide
  
  -- Search Definition
  search_type VARCHAR(50), -- 'models', 'castings', 'agencies'
  name VARCHAR(255),
  description TEXT,
  search_criteria JSONB,
  
  -- Notifications
  notifications_enabled BOOLEAN DEFAULT false,
  notification_frequency VARCHAR(20), -- 'instant', 'daily', 'weekly'
  last_notification_sent TIMESTAMPTZ,
  
  -- Sharing
  is_public BOOLEAN DEFAULT false,
  shared_with_accounts INTEGER[], -- Array of account IDs
  
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites System
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER REFERENCES users(id),
  
  -- Favorited Entity
  entity_type VARCHAR(50), -- 'model_profile', 'project', 'account', 'casting'
  entity_id UUID,
  
  -- Organization
  folder_name VARCHAR(100),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat System
CREATE TABLE chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Conversation Type
  conversation_type VARCHAR(20), -- 'personal', 'project', 'group'
  project_id UUID REFERENCES projects(id), -- For project-related chats
  
  -- Participants
  participant_ids INTEGER[], -- Array of user IDs
  created_by INTEGER REFERENCES users(id),
  
  -- Settings
  title VARCHAR(255),
  description TEXT,
  is_archived BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES chat_conversations(id),
  sender_id INTEGER REFERENCES users(id),
  
  -- Message Content
  message_type VARCHAR(20) DEFAULT 'text', -- 'text', 'image', 'file', 'system'
  content TEXT,
  
  -- File Attachments
  attachments JSONB DEFAULT '[]', -- Array of file objects
  
  -- Status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  
  -- Read Receipts
  read_by JSONB DEFAULT '{}', -- {user_id: timestamp}
  
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Template System
CREATE TABLE template_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Hierarchy
  created_by_level VARCHAR(20), -- 'super_admin', 'tenant', 'account'
  tenant_id INTEGER REFERENCES tenants(id),
  account_id INTEGER REFERENCES accounts(id),
  
  -- Template Details
  template_type VARCHAR(50), -- 'model_schema', 'email', 'sedcard', 'workflow'
  template_category VARCHAR(50), -- 'baby_model', 'fitness_model', 'casting_confirmation'
  name VARCHAR(255),
  description TEXT,
  
  -- Template Content
  template_data JSONB,
  
  -- Customization Rules
  customizable_fields VARCHAR(100)[], -- Which fields can be modified by inheritors
  required_fields VARCHAR(100)[], -- Fields that must be present
  
  -- Language Support
  languages VARCHAR(10)[],
  default_language VARCHAR(10),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_default BOOLEAN DEFAULT false,
  
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Templates (Inherits from template system)
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_definition_id UUID REFERENCES template_definitions(id),
  
  -- Email Specific
  subject_template TEXT,
  body_template TEXT, -- HTML template
  variables JSONB DEFAULT '{}', -- Available template variables
  
  -- Sending Configuration
  sender_name VARCHAR(255),
  sender_email VARCHAR(255),
  reply_to VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhooks
CREATE TABLE webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ownership
  tenant_id INTEGER REFERENCES tenants(id),
  account_id INTEGER REFERENCES accounts(id), -- NULL for tenant-level
  
  -- Webhook Configuration
  name VARCHAR(255),
  endpoint_url TEXT,
  secret_key VARCHAR(255),
  
  -- Events
  subscribed_events VARCHAR(50)[], -- Events this webhook listens to
  
  -- Settings
  is_active BOOLEAN DEFAULT true,
  timeout_seconds INTEGER DEFAULT 30,
  retry_attempts INTEGER DEFAULT 3,
  
  -- Security
  verify_ssl BOOLEAN DEFAULT true,
  
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Webhook Deliveries (for monitoring)
CREATE TABLE webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id UUID REFERENCES webhooks(id),
  
  -- Event Details
  event_type VARCHAR(50),
  event_data JSONB,
  
  -- Delivery Status
  status VARCHAR(20), -- 'pending', 'delivered', 'failed'
  http_status_code INTEGER,
  response_body TEXT,
  error_message TEXT,
  
  -- Timing
  delivered_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔧 **Core Features & Workflows**

### **1. Multi-Profile User System**

#### **User Registration Flow**
```typescript
interface RegistrationFlow {
  // Entry Point Detection
  entryDomain: string; // 'platform.com', 'gomodels.platform.com', 'eliteagency.com'
  
  // Account Assignment Logic
  if (customDomain) {
    // Register directly to account
    assignToAccount(getAccountByDomain(domain));
    triggerWorkflow('account_registration', account.workflow_config);
  } else if (subdomain) {
    // Register to tenant with account choice
    assignToTenant(getTenantBySubdomain(subdomain));
    showAccountOptions(); // Individual or existing accounts
  } else {
    // Main platform registration
    createIndividualAccount();
  }
}
```

#### **Multi-Account Membership**
```typescript
interface UserAccountStructure {
  user: {
    id: number;
    email: string;
    personal_preferences: RegionalPreferences;
  };
  
  memberships: AccountMembership[];
}

interface AccountMembership {
  account_id: number;
  role: 'owner' | 'admin' | 'profile_manager' | 'viewer' | 'agency_booker';
  permissions: string[];
  profiles: ProfileSummary[]; // Profiles this user has in this account
}
```

### **2. AI-Driven Approval Workflows**

#### **Configurable Workflow System**
```typescript
interface WorkflowStep {
  step_type: 'ai_analysis' | 'human_review' | 'automatic_approval' | 'notification';
  ai_config?: {
    model_type: 'image_quality' | 'content_moderation' | 'profile_completeness';
    confidence_threshold: number;
    auto_approve_above: number;
    auto_reject_below: number;
  };
  human_config?: {
    required_role: string[];
    approval_count: number;
    escalation_timeout_hours: number;
  };
  notification_config?: {
    recipients: string[]; // 'user', 'account_admin', 'tenant_admin'
    channels: ('email' | 'sms' | 'webhook')[];
  };
}

interface WorkflowDefinition {
  trigger_events: string[]; // 'profile_created', 'media_uploaded', 'application_submitted'
  steps: WorkflowStep[];
  fallback_behavior: 'approve' | 'reject' | 'escalate';
}
```

#### **AI Analysis Integration**
```typescript
interface AIAnalysisResult {
  overall_score: number; // 0-100
  analysis_details: {
    image_quality_score: number;
    content_appropriateness: boolean;
    profile_completeness: number;
    recommendation: 'approve' | 'reject' | 'review';
    confidence: number;
  };
  improvement_suggestions: string[];
  risk_factors: string[];
}

// Generated PDF Report
interface PDFAnalysisReport {
  decision: 'approved' | 'rejected' | 'pending_review';
  overall_assessment: string;
  strengths: string[];
  areas_for_improvement: string[];
  next_steps: string[];
  contact_information: ContactInfo;
}
```

### **3. Regional Measurement System**

#### **Conversion Service Architecture**
```typescript
class RegionalMeasurementService {
  // Store everything in US base system
  private baseSystem = {
    height: 'inches',
    weight: 'pounds', 
    clothing: 'us_sizes',
    shoes: 'us_sizes'
  };
  
  // Conversion lookup tables (no formulas)
  async convertForDisplay(
    baseValue: number,
    measurementType: string,
    targetRegion: string,
    gender?: string,
    ageCategory?: string
  ): Promise<string> {
    
    const conversion = await this.lookupConversion({
      measurement_type: measurementType,
      region: targetRegion,
      gender: gender || 'unisex',
      age_category: ageCategory || 'adult',
      us_value: baseValue.toString()
    });
    
    return conversion?.regional_display || `${baseValue} (US)`;
  }
  
  async convertToBase(
    regionalValue: string,
    measurementType: string,
    sourceRegion: string,
    gender?: string,
    ageCategory?: string
  ): Promise<number> {
    
    const conversion = await this.reverseConversion({
      measurement_type: measurementType,
      region: sourceRegion,
      gender: gender || 'unisex',
      age_category: ageCategory || 'adult',
      regional_value: regionalValue
    });
    
    return parseFloat(conversion?.us_value || '0');
  }
  
  // Search always uses base values for consistency
  async searchWithRegionalFilters(filters: SearchFilters): Promise<ModelProfile[]> {
    // Convert all inputs to base US values
    const baseFilters = await this.convertFiltersToBase(filters);
    
    // Search using base values
    return this.searchWithBaseValues(baseFilters);
  }
}
```

### **4. Hierarchical Template System**

#### **Template Inheritance**
```typescript
interface TemplateInheritance {
  // Super Admin creates base industry templates
  createIndustryTemplate(templateData: {
    template_type: 'model_schema';
    category: 'fashion_model' | 'fitness_model' | 'child_model';
    base_fields: SchemaField[];
    required_fields: string[];
    customizable_fields: string[];
    languages: string[];
  }): IndustryTemplate;
  
  // Tenants customize for their market
  customizeForTenant(
    baseTemplate: IndustryTemplate,
    customizations: {
      additional_fields?: SchemaField[];
      field_modifications?: FieldModification[];
      language_customizations?: LanguageCustomization[];
      regional_adaptations?: RegionalAdaptation[];
    }
  ): TenantTemplate;
  
  // Accounts add specific requirements
  customizeForAccount(
    tenantTemplate: TenantTemplate,
    customizations: {
      custom_fields?: CustomField[];
      branding?: BrandingConfig;
      workflow_overrides?: WorkflowOverride[];
    }
  ): AccountTemplate;
}
```

### **5. Sedcard Generation System**

#### **Dynamic Template Selection**
```typescript
interface SedcardGenerator {
  generateSedcard(profile: ModelProfile): Promise<SedcardResult> {
    // 1. Determine model type and template
    const template = await this.selectTemplate({
      profile_type: profile.profile_type,
      age_category: profile.age_category,
      account_id: profile.account_id
    });
    
    // 2. Select optimal photos
    const photos = await this.selectSedcardPhotos({
      profile_id: profile.id,
      required_shots: template.required_shot_types, // ['headshot', 'full_body', 'profile']
      max_photos: template.max_photos || 4
    });
    
    // 3. Format measurements for target region
    const measurements = await this.formatMeasurements(
      profile,
      template.target_region
    );
    
    // 4. Generate PDF with account branding
    const pdf = await this.generatePDF({
      template,
      photos,
      measurements,
      branding: await this.getAccountBranding(profile.account_id)
    });
    
    return {
      sedcard_url: pdf.url,
      generated_at: new Date(),
      template_used: template.id
    };
  }
}

// Different templates for different model types
interface SedcardTemplate {
  model_types: string[]; // ['baby_model', 'fashion_model', 'hand_model']
  required_shot_types: string[];
  layout_config: LayoutConfig;
  measurement_fields: string[];
  branding_areas: BrandingArea[];
  print_specifications: PrintSpecs;
}
```

---

## 📱 **4-Tier Sidebar System**

### **Super Admin Sidebar Features**
```typescript
interface SuperAdminSidebar {
  platform_analytics: {
    tenant_overview: TenantMetrics[];
    user_growth: GrowthMetrics;
    revenue_tracking: RevenueMetrics;
    system_performance: PerformanceMetrics;
  };
  
  tenant_management: {
    tenant_creation: TenantCreationFlow;
    subscription_management: SubscriptionOverview;
    compliance_monitoring: ComplianceStatus[];
    support_tools: SupportTools;
  };
  
  industry_templates: {
    model_schema_templates: SchemaTemplate[];
    workflow_templates: WorkflowTemplate[];
    email_templates: EmailTemplate[];
    sedcard_templates: SedcardTemplate[];
  };
  
  global_settings: {
    platform_features: FeatureFlag[];
    industry_standards: IndustryStandard[];
    compliance_rules: ComplianceRule[];
    api_configuration: APIConfig;
  };
  
  support_tools: {
    emergency_access: EmergencyAccessLog[];
    cross_tenant_issues: SupportTicket[];
    system_health: SystemHealthMetrics;
    audit_logs: AuditLog[];
  };
}
```

### **Tenant Admin Sidebar Features**
```typescript
interface TenantAdminSidebar {
  tenant_overview: {
    account_metrics: AccountMetrics;
    user_analytics: UserAnalytics;
    revenue_summary: RevenueSummary;
    system_usage: UsageMetrics;
  };
  
  account_management: {
    account_directory: Account[];
    subscription_plans: SubscriptionPlan[];
    billing_overview: BillingOverview;
    account_onboarding: OnboardingFlow;
  };
  
  platform_customization: {
    branding_settings: BrandingConfig;
    template_customization: TemplateCustomization;
    workflow_configuration: WorkflowConfig;
    feature_management: FeatureManagement;
  };
  
  administrative_users: {
    admin_directory: AdminUser[];
    role_management: RoleManagement;
    invitation_system: InvitationSystem;
    permission_templates: PermissionTemplate[];
  };
  
  industry_configuration: {
    model_type_definitions: ModelTypeDefinition[];
    approval_workflows: ApprovalWorkflow[];
    ai_integration_settings: AIIntegrationConfig;
    webhook_management: WebhookConfig[];
  };
}
```

### **Account Admin Sidebar Features**
```typescript
interface AccountAdminSidebar {
  account_overview: {
    business_metrics: BusinessMetrics;
    model_roster: ModelRosterSummary;
    project_pipeline: ProjectPipeline;
    financial_summary: FinancialSummary;
  };
  
  user_management: {
    team_directory: TeamMember[];
    model_relationships: ModelRelationship[];
    invitation_management: InvitationManagement;
    role_assignments: RoleAssignment[];
  };
  
  casting_operations: {
    active_castings: ActiveCasting[];
    model_submissions: SubmissionOverview;
    client_relationships: ClientRelationship[];
    project_coordination: ProjectCoordination;
  };
  
  business_operations: {
    commission_tracking: CommissionTracking;
    payment_management: PaymentManagement;
    contract_management: ContractManagement;
    invoice_generation: InvoiceGeneration;
  };
  
  brand_management: {
    sedcard_templates: SedcardTemplate[];
    portfolio_guidelines: PortfolioGuideline[];
    approval_workflows: ApprovalWorkflow[];
    branding_assets: BrandingAsset[];
  };
}
```

### **User Sidebar Features**
```typescript
interface UserSidebar {
  // Different features based on user role and profile types
  
  // For Models
  model_features?: {
    profile_management: {
      my_profiles: ModelProfile[];
      portfolio_builder: PortfolioBuilder;
      measurement_tracking: MeasurementHistory;
      availability_calendar: AvailabilityCalendar;
    };
    
    career_tracking: {
      application_history: ApplicationHistory;
      booking_history: BookingHistory;
      earnings_summary: EarningsSummary;
      career_progression: CareerMetrics;
    };
    
    opportunities: {
      casting_discovery: CastingDiscovery;
      saved_searches: SavedSearch[];
      application_tracking: ApplicationTracking;
      recommendations: JobRecommendation[];
    };
    
    portfolio_tools: {
      photo_upload: PhotoUpload;
      sedcard_generator: SedcardGenerator;
      model_book_builder: ModelBookBuilder;
      instagram_import: InstagramImport;
    };
  };
  
  // For Agency Staff
  agency_features?: {
    model_management: {
      assigned_models: ModelProfile[];
      model_development: ModelDevelopment;
      performance_tracking: PerformanceTracking;
      submission_management: SubmissionManagement;
    };
    
    casting_operations: {
      casting_discovery: CastingDiscovery;
      bulk_submissions: BulkSubmission;
      callback_coordination: CallbackCoordination;
      client_communication: ClientCommunication;
    };
  };
  
  // Universal Features
  universal_features: {
    communication: {
      message_center: MessageCenter;
      project_chats: ProjectChat[];
      notifications: NotificationCenter;
      contact_directory: ContactDirectory;
    };
    
    preferences: {
      profile_settings: ProfileSettings;
      regional_preferences: RegionalPreferences;
      notification_settings: NotificationSettings;
      privacy_controls: PrivacyControls;
    };
  };
}
```

---

## 🔗 **Integration Architecture**

### **Essential Launch Integrations**

#### **1. Stripe Payment Integration**
```typescript
interface StripeIntegration {
  // Multi-party payments for agency commission splits
  setupConnectedAccounts(account: Account): Promise<StripeConnectedAccount>;
  
  // Payment flows
  processDirectPayment(client: Client, model: Model, amount: number): Promise<Payment>;
  processAgencyPayment(
    client: Client, 
    agency: Account, 
    model: Model, 
    totalAmount: number,
    commissionRate: number
  ): Promise<Payment>;
  
  // Commission handling
  splitPayment(
    totalAmount: number,
    agencyCommission: number,
    modelPayout: number,
    platformFee: number
  ): Promise<PaymentSplit>;
}
```

#### **2. Calendar Integration**
```typescript
interface CalendarIntegration {
  // Cal.com integration for go-see scheduling
  scheduleGoSee(
    casting: CastingCall,
    model: ModelProfile,
    availableSlots: TimeSlot[]
  ): Promise<ScheduledEvent>;
  
  // Google Calendar sync for availability
  syncAvailability(
    user: User,
    googleCalendar: GoogleCalendarAPI
  ): Promise<AvailabilitySlots>;
}
```

#### **3. Instagram Portfolio Import**
```typescript
interface InstagramIntegration {
  importPortfolio(
    instagramHandle: string,
    userToken: string
  ): Promise<ImportResult>;
  
  categorizeImages(
    images: InstagramImage[]
  ): Promise<CategorizedPortfolio>;
  
  // AI-powered categorization
  aiCategorization(image: ImageData): Promise<{
    category: 'headshot' | 'fashion' | 'commercial' | 'editorial';
    confidence: number;
    sedcard_suitable: boolean;
  }>;
}
```

#### **4. Communication System**
```typescript
interface CommunicationSystem {
  // Internal chat
  createConversation(
    participants: User[],
    type: 'personal' | 'project',
    project?: Project
  ): Promise<Conversation>;
  
  // Multi-channel notifications
  sendNotification(
    recipient: User,
    message: NotificationMessage,
    channels: ('email' | 'sms' | 'push' | 'webhook')[]
  ): Promise<NotificationResult>;
  
  // Email templates with workflow integration
  sendWorkflowEmail(
    template: EmailTemplate,
    recipient: User,
    context: WorkflowContext
  ): Promise<EmailResult>;
}
```

---

## 🚀 **Implementation Roadmap**

### **Phase 1: Core Foundation (Weeks 1-8)**

#### **Week 1-2: Multi-Account Architecture**
- [ ] Implement enhanced tenant/account/user/profile schema
- [ ] Build account membership system with roles
- [ ] Create invitation workflow system
- [ ] Set up basic multi-profile support

#### **Week 3-4: Model Profile System**
- [ ] Implement model profiles with type-specific attributes
- [ ] Build measurement system with US base storage
- [ ] Create regional conversion lookup tables
- [ ] Implement age-category-specific schemas

#### **Week 5-6: Portfolio & Media System**
- [ ] Build portfolio categorization system
- [ ] Implement media upload with approval workflows
- [ ] Create basic sedcard generation
- [ ] Add Instagram import functionality

#### **Week 7-8: 4-Tier Sidebar System**
- [ ] Implement role-based sidebar navigation
- [ ] Build Super Admin dashboard and analytics
- [ ] Create Tenant Admin management interface
- [ ] Develop Account Admin business tools
- [ ] Design User interface for different user types

### **Phase 2: Casting & Project Management (Weeks 9-16)**

#### **Week 9-10: Casting System**
- [ ] Build multi-role casting call creation
- [ ] Implement model application system (direct + agency)
- [ ] Create casting discovery and search
- [ ] Add callback and selection workflows

#### **Week 11-12: AI Workflow Engine**
- [ ] Implement configurable workflow system
- [ ] Build AI analysis integration (image quality, content moderation)
- [ ] Create human-in-loop approval processes
- [ ] Generate PDF analysis reports

#### **Week 13-14: Communication System**
- [ ] Build internal chat system (personal + project)
- [ ] Implement file sharing within chats
- [ ] Create notification system with multi-channel support
- [ ] Add email template system with workflow integration

#### **Week 15-16: Project Management**
- [ ] Implement project coordination tools
- [ ] Build timeline and deliverable tracking
- [ ] Add client relationship management
- [ ] Create booking and scheduling system

### **Phase 3: Business Operations (Weeks 17-24)**

#### **Week 17-18: Payment & Commission System**
- [ ] Integrate Stripe for payments and payouts
- [ ] Build commission tracking and automatic splits
- [ ] Implement invoice generation system
- [ ] Add financial reporting and analytics

#### **Week 19-20: Advanced Features**
- [ ] Build saved search system with hierarchical sharing
- [ ] Implement smart notifications and recommendations
- [ ] Create favorites and organization tools
- [ ] Add calendar integration (Cal.com, Google Calendar)

#### **Week 21-22: Template & Workflow System**
- [ ] Complete hierarchical template inheritance
- [ ] Build workflow builder interface
- [ ] Implement webhook system
- [ ] Add email template customization

#### **Week 23-24: White Label & Customization**
- [ ] Implement custom domain support
- [ ] Build account branding system
- [ ] Create tenant-level customization tools
- [ ] Add multi-language support

### **Phase 4: Scale & Optimization (Weeks 25-32)**

#### **Week 25-26: Performance Optimization**
- [ ] Implement three-layer caching strategy
- [ ] Optimize database queries and indexing
- [ ] Add Redis caching for hot data
- [ ] Implement CDN for media assets

#### **Week 27-28: Migration & Data Import**
- [ ] Build migration tools for 700K existing users
- [ ] Implement data validation and cleanup
- [ ] Create user onboarding flow for migrated accounts
- [ ] Add bulk import tools for existing portfolios

#### **Week 29-30: Analytics & Reporting**
- [ ] Build comprehensive analytics dashboards
- [ ] Implement custom reporting tools
- [ ] Add business intelligence features
- [ ] Create performance tracking and KPIs

#### **Week 31-32: Launch Preparation**
- [ ] Complete security audit and penetration testing
- [ ] Implement monitoring and alerting systems
- [ ] Create admin tools and support systems
- [ ] Prepare documentation and training materials

---

## 📊 **Success Metrics & KPIs**

### **Technical KPIs**
- **Performance**: Page load time < 2s, API response time < 200ms
- **Reliability**: 99.9% uptime, < 0.1% error rate
- **Scalability**: Support 10K concurrent users, 1M+ profiles
- **Security**: Zero data breaches, GDPR/COPPA compliance

### **Business KPIs**
- **User Growth**: 700K migrated users + 50% growth in Year 1
- **Tenant Success**: 100+ active tenants, 95% retention rate
- **Marketplace Activity**: 10K+ monthly castings, 100K+ applications
- **Revenue**: $2M ARR, 25% platform commission on transactions

### **User Experience KPIs**
- **Adoption**: 80% profile completion rate, 60% monthly active users
- **Engagement**: 5+ portfolio updates per month, 3+ applications per model
- **Satisfaction**: 4.5+ star rating, < 5% churn rate
- **Conversion**: 30% application-to-callback rate, 15% callback-to-booking rate

---

## 🔒 **Security & Compliance**

### **Data Protection**
- **Encryption**: All data encrypted at rest and in transit
- **GDPR Compliance**: Right to deletion, data portability, consent management
- **COPPA Compliance**: Parental consent for under-13 users, limited data collection
- **Child Protection**: Age verification, guardian controls, content moderation

### **Platform Security**
- **Authentication**: Multi-factor authentication, OAuth integration
- **Authorization**: Role-based access control, resource-level permissions
- **API Security**: Rate limiting, request validation, audit logging
- **Infrastructure**: SOC 2 compliance, regular security audits

---

## 🌍 **Global Scalability**

### **Multi-Language Support**
```typescript
interface LanguageSupport {
  // Platform UI translations
  ui_translations: {
    base_language: 'en-US';
    supported_languages: string[];
    translation_keys: TranslationKey[];
    fallback_strategy: 'cascade' | 'base_only';
  };
  
  // Database content translations
  content_translations: {
    translatable_entities: ('model_profiles' | 'casting_calls' | 'templates')[];
    translation_inheritance: 'super_admin' → 'tenant' → 'account';
    auto_translation_ai: boolean;
    human_review_required: boolean;
  };
}
```

### **Regional Adaptations**
- **Measurement Systems**: US base with EU, UK, Asian conversions
- **Currency Support**: Multi-currency with automatic conversion
- **Legal Compliance**: Region-specific child protection laws
- **Cultural Adaptation**: Region-appropriate content guidelines

---

This comprehensive specification provides the complete technical foundation for implementing itellico Mono as a sophisticated, scalable, and feature-rich modeling industry marketplace. The platform's innovative multi-profile architecture, AI-driven workflows, and hierarchical management system position it to revolutionize how the modeling and creative industries operate globally.