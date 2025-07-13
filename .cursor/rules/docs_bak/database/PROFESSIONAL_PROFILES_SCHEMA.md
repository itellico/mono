# Professional Profiles Database Schema

This document defines the database schema for industry-specific professional profiles in the Mono Platform marketplace.

## 🎯 Overview

The professional profiles system extends the basic user profile with industry-specific data for:
- **Models**: Measurements, experience, specialties
- **Photographers**: Equipment, style, portfolio  
- **Agencies**: Talent roster, company info, services
- **Clients**: Booking preferences, history, requirements

## 📊 Database Schema

### Core Tables

#### 1. `professional_profiles`
Main table for all professional profile types:

```sql
CREATE TABLE professional_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Profile Type and Status
  profile_type VARCHAR(20) NOT NULL CHECK (profile_type IN ('model', 'photographer', 'agency', 'client')),
  status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'active', 'suspended', 'deactivated')),
  
  -- Core Professional Data
  professional_name VARCHAR(255), -- Stage name, agency name, etc.
  tagline TEXT, -- Brief professional description
  years_experience INTEGER,
  specialties TEXT[], -- Array of specialties/skills
  
  -- Contact & Availability
  professional_email VARCHAR(255),
  professional_phone VARCHAR(50),
  website_url VARCHAR(255),
  social_media JSONB, -- {instagram: '', twitter: '', linkedin: '', etc}
  
  -- Location & Travel
  base_location VARCHAR(255),
  travel_radius INTEGER, -- Miles willing to travel
  travel_internationally BOOLEAN DEFAULT false,
  available_locations TEXT[], -- Cities/regions available
  
  -- Rates & Pricing
  rate_structure JSONB, -- {hourly: 150, half_day: 800, full_day: 1500, etc}
  currency VARCHAR(3) DEFAULT 'USD',
  rate_negotiable BOOLEAN DEFAULT true,
  
  -- Availability
  availability_type VARCHAR(20) DEFAULT 'flexible' CHECK (availability_type IN ('flexible', 'weekdays', 'weekends', 'evenings', 'custom')),
  availability_calendar JSONB, -- Calendar data for booking
  
  -- Industry-Specific Data (JSONB for flexibility)
  industry_data JSONB NOT NULL DEFAULT '{}',
  
  -- Verification & Trust
  verification_status VARCHAR(20) DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'rejected')),
  verification_level VARCHAR(20) DEFAULT 'basic' CHECK (verification_level IN ('basic', 'professional', 'premium')),
  verified_at TIMESTAMPTZ,
  verified_by INTEGER REFERENCES users(id),
  
  -- Profile Completeness
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  last_updated_section VARCHAR(50),
  
  -- SEO & Discovery
  slug VARCHAR(255) UNIQUE, -- URL-friendly identifier
  keywords TEXT[], -- Search keywords
  featured BOOLEAN DEFAULT false,
  profile_views INTEGER DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(tenant_id, user_id, profile_type), -- One profile per type per user per tenant
  INDEX idx_professional_profiles_user_tenant (user_id, tenant_id),
  INDEX idx_professional_profiles_type_status (profile_type, status),
  INDEX idx_professional_profiles_location (base_location),
  INDEX idx_professional_profiles_featured (featured, status),
  INDEX idx_professional_profiles_slug (slug)
);
```

#### 2. `profile_media`
Media files associated with professional profiles:

```sql
CREATE TABLE profile_media (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Media Information
  media_type VARCHAR(30) NOT NULL CHECK (media_type IN ('headshot', 'portfolio', 'behind_scenes', 'equipment', 'resume', 'certification', 'mood_board')),
  category VARCHAR(50), -- e.g., 'fashion', 'commercial', 'portrait'
  
  -- File Data
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  file_name VARCHAR(255),
  file_size INTEGER,
  mime_type VARCHAR(100),
  
  -- Image Metadata
  width INTEGER,
  height INTEGER,
  aspect_ratio DECIMAL(4,2),
  
  -- Organization
  title VARCHAR(255),
  description TEXT,
  alt_text VARCHAR(500),
  tags TEXT[],
  
  -- Status & Approval
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'rejected', 'archived')),
  approved_at TIMESTAMPTZ,
  approved_by INTEGER REFERENCES users(id),
  
  -- Display Options
  sort_order INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  visible_to_public BOOLEAN DEFAULT true,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  
  -- Metadata
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_profile_media_profile (profile_id),
  INDEX idx_profile_media_type (media_type, status),
  INDEX idx_profile_media_featured (featured, sort_order)
);
```

#### 3. `profile_verifications`
Track verification status and documents:

```sql
CREATE TABLE profile_verifications (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Verification Type
  verification_type VARCHAR(50) NOT NULL CHECK (verification_type IN ('identity', 'professional', 'background_check', 'reference', 'portfolio_review')),
  
  -- Verification Data
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'expired')),
  verification_method VARCHAR(50), -- 'document_upload', 'video_call', 'third_party', etc.
  
  -- Documents & Proof
  document_urls TEXT[], -- Array of uploaded document URLs
  document_types TEXT[], -- Types of documents provided
  notes TEXT, -- Verification notes from reviewer
  
  -- Review Information
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  expiry_date TIMESTAMPTZ, -- Some verifications expire
  
  -- External Integration
  external_verification_id VARCHAR(255), -- For third-party verification services
  external_provider VARCHAR(100), -- Name of verification provider
  
  -- Metadata
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  INDEX idx_profile_verifications_profile (profile_id),
  INDEX idx_profile_verifications_type_status (verification_type, status)
);
```

#### 4. `profile_analytics`
Track profile performance and engagement:

```sql
CREATE TABLE profile_analytics (
  id SERIAL PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES professional_profiles(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Date for daily aggregation
  date DATE NOT NULL,
  
  -- View Metrics
  profile_views INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  media_views INTEGER DEFAULT 0,
  contact_button_clicks INTEGER DEFAULT 0,
  
  -- Engagement Metrics
  favorites_added INTEGER DEFAULT 0,
  shortlist_additions INTEGER DEFAULT 0,
  profile_shares INTEGER DEFAULT 0,
  booking_inquiries INTEGER DEFAULT 0,
  
  -- Search Performance
  search_appearances INTEGER DEFAULT 0,
  search_clicks INTEGER DEFAULT 0,
  search_conversion_rate DECIMAL(5,2) DEFAULT 0.00,
  
  -- Geographic Data
  top_viewer_locations JSONB, -- {"US": 45, "UK": 23, "CA": 12}
  top_traffic_sources JSONB, -- {"direct": 60, "search": 30, "social": 10}
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(profile_id, date),
  INDEX idx_profile_analytics_profile_date (profile_id, date),
  INDEX idx_profile_analytics_date (date)
);
```

## 🎨 Industry-Specific Data Schemas

### Model Profile (`industry_data` JSONB structure):

```json
{
  "measurements": {
    "height": {"value": 175, "unit": "cm"},
    "weight": {"value": 60, "unit": "kg"},
    "bust": {"value": 86, "unit": "cm"},
    "waist": {"value": 61, "unit": "cm"},
    "hips": {"value": 91, "unit": "cm"},
    "dress_size": {"value": "8", "region": "US"},
    "shoe_size": {"value": "8", "region": "US"}
  },
  "physical_attributes": {
    "hair_color": "Brown",
    "eye_color": "Green",
    "skin_tone": "Medium",
    "build": "Athletic",
    "tattoos": false,
    "piercings": false
  },
  "experience": {
    "modeling_since": "2020",
    "notable_clients": ["Brand A", "Brand B"],
    "campaign_types": ["fashion", "commercial", "lifestyle"],
    "runway_experience": true,
    "print_experience": true,
    "commercial_experience": true
  },
  "preferences": {
    "work_types": ["fashion", "commercial", "beauty"],
    "unwilling_to_do": ["swimwear", "lingerie"],
    "travel_available": true,
    "overnight_shoots": true
  },
  "representation": {
    "has_agent": true,
    "agency_name": "Elite Models",
    "agency_contact": "agent@elite.com",
    "exclusive_representation": false
  }
}
```

### Photographer Profile (`industry_data` JSONB structure):

```json
{
  "equipment": {
    "camera_brands": ["Canon", "Sony"],
    "lens_collection": ["24-70mm", "85mm", "50mm"],
    "lighting_equipment": ["Profoto", "Godox"],
    "studio_access": true,
    "mobile_setup": true
  },
  "specialties": {
    "photography_types": ["portrait", "fashion", "commercial", "wedding"],
    "editing_software": ["Lightroom", "Photoshop", "Capture One"],
    "shooting_styles": ["natural light", "studio lighting", "environmental"],
    "post_processing_included": true
  },
  "services": {
    "session_types": ["headshots", "portfolio", "commercial", "events"],
    "deliverables": ["high_res_digital", "print_ready", "web_optimized"],
    "turnaround_time": "7-14 days",
    "revision_rounds": 2,
    "usage_rights": "commercial_license"
  },
  "portfolio_highlights": {
    "featured_work": ["fashion_campaign_2023", "celebrity_portrait_series"],
    "published_in": ["Vogue", "Harper's Bazaar"],
    "awards": ["Photography Award 2023"],
    "exhibition_history": ["Gallery Show 2022"]
  },
  "business_info": {
    "business_license": true,
    "insurance_coverage": true,
    "contracts_provided": true,
    "deposit_required": 50,
    "cancellation_policy": "48_hours"
  }
}
```

### Agency Profile (`industry_data` JSONB structure):

```json
{
  "company_info": {
    "legal_name": "Elite Talent Agency LLC",
    "business_license_number": "BL123456",
    "founded_year": 2010,
    "company_size": "50-100 employees",
    "headquarters": "New York, NY"
  },
  "services": {
    "talent_management": true,
    "casting_services": true,
    "model_development": true,
    "brand_partnerships": true,
    "international_placements": true
  },
  "talent_roster": {
    "total_talent_count": 150,
    "model_count": 80,
    "photographer_count": 35,
    "other_talent_count": 35,
    "featured_talent_ids": [123, 456, 789]
  },
  "client_portfolio": {
    "major_brands": ["Nike", "L'Oreal", "Calvin Klein"],
    "campaign_types": ["fashion", "beauty", "lifestyle", "commercial"],
    "international_clients": ["European Fashion Week", "Asian Beauty Brands"]
  },
  "credentials": {
    "industry_memberships": ["Modeling Association of America"],
    "certifications": ["Talent Management Certification"],
    "awards": ["Agency of the Year 2023"],
    "accreditations": ["Better Business Bureau A+"]
  },
  "booking_process": {
    "minimum_booking_notice": "48 hours",
    "booking_confirmation_process": "contract_and_deposit",
    "payment_terms": "50% upfront, 50% completion",
    "cancellation_policy": "24_hour_notice"
  }
}
```

### Client Profile (`industry_data` JSONB structure):

```json
{
  "company_info": {
    "company_name": "Fashion Brand Inc",
    "industry": "Fashion & Apparel",
    "company_size": "100-500 employees",
    "website": "https://fashionbrand.com",
    "company_description": "Leading fashion retailer"
  },
  "project_preferences": {
    "typical_project_types": ["product photography", "lifestyle shoots", "campaigns"],
    "budget_ranges": {
      "photography": {"min": 5000, "max": 50000, "currency": "USD"},
      "modeling": {"min": 500, "max": 5000, "currency": "USD"}
    },
    "preferred_locations": ["studio", "on_location", "international"],
    "project_frequency": "monthly"
  },
  "booking_history": {
    "total_bookings": 25,
    "successful_projects": 23,
    "average_project_value": 15000,
    "repeat_collaborators": ["photographer_123", "model_456"],
    "satisfaction_rating": 4.8
  },
  "requirements": {
    "contract_requirements": true,
    "insurance_required": true,
    "usage_rights_needed": "commercial_global",
    "deliverable_format": "high_res_digital",
    "typical_timeline": "2-4 weeks"
  },
  "team_info": {
    "primary_contact": "Creative Director",
    "decision_makers": ["Creative Director", "Brand Manager"],
    "team_size": "5-10 people",
    "approval_process": "internal_review_required"
  }
}
```

## 🔗 Relationships & Constraints

### Foreign Key Relationships
- `professional_profiles.user_id` → `users.id`
- `professional_profiles.tenant_id` → `tenants.id`
- `profile_media.profile_id` → `professional_profiles.id`
- `profile_verifications.profile_id` → `professional_profiles.id`
- `profile_analytics.profile_id` → `professional_profiles.id`

### Business Rules
1. **One Profile Per Type**: Each user can have only one professional profile per type per tenant
2. **Status Progression**: Profiles must go through draft → pending → active workflow
3. **Verification Requirements**: Some features require minimum verification level
4. **Media Approval**: Uploaded media may require approval before going live
5. **Analytics Aggregation**: Daily analytics are computed via background jobs

## 📈 Performance Considerations

### Indexing Strategy
- Primary indexes on all foreign keys
- Composite indexes for common query patterns
- JSONB indexes for frequently searched industry_data fields
- Full-text search indexes for text fields

### JSONB Optimization
```sql
-- Index for searching model measurements
CREATE INDEX idx_model_height ON professional_profiles 
USING gin ((industry_data->'measurements'->'height')) 
WHERE profile_type = 'model';

-- Index for photographer specialties
CREATE INDEX idx_photographer_types ON professional_profiles 
USING gin ((industry_data->'specialties'->'photography_types')) 
WHERE profile_type = 'photographer';
```

## 🔄 Migration Strategy

### Phase 1: Core Tables
1. Create `professional_profiles` table
2. Migrate existing profile data
3. Add basic industry_data structures

### Phase 2: Media & Verification
1. Create `profile_media` table
2. Create `profile_verifications` table
3. Implement media upload workflow

### Phase 3: Analytics & Optimization
1. Create `profile_analytics` table
2. Add performance indexes
3. Implement background jobs for analytics

This schema provides the foundation for a comprehensive professional profiles system that can scale across different creative industries while maintaining data integrity and performance.