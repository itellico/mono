# ClickDummy Structure Documentation

## Overview
The clickdummy is a PHP-based interactive prototype that demonstrates the full 5-tier architecture of the itellico Mono platform. It's located at `/php/click-dummy/` and runs on port 4040.

## Access URLs

### Main Entry Point
- **URL**: http://localhost:4040
- **Description**: Homepage showcasing all 5 tiers with interactive navigation

### 5-Tier Architecture URLs

#### 1. Platform Tier (Super Admin)
- **URL**: http://localhost:4040/platform/
- **Features**:
  - Tenant Management
  - Revenue Analytics
  - System Monitoring
  - API Management
  - Settings & Configuration
  - Support Dashboard

#### 2. Tenant Tier (Marketplace Admin)
- **URL**: http://localhost:4040/tenant/
- **Features**:
  - Talent Database Management
  - Casting Calls
  - Applications Management
  - Marketplace Analytics
  - Blog/Content Management
  - Settings & Integrations

#### 3. Account Tier (Agency/Company)
- **URL**: http://localhost:4040/account/
- **Subtypes**:
  - `/account/agency/` - Modeling Agency Dashboard
  - `/account/client.html` - Client Company Dashboard
  - `/account/guardian/` - Parent/Guardian Dashboard
  - `/account/professional/` - Professional Services Dashboard
- **Features**:
  - Project Management
  - Team Management
  - Talent Roster
  - Subscription & Invoicing
  - Settings

#### 4. User Tier (Individual Users)
- **URL**: http://localhost:4040/user/
- **User Types**:
  - `/user/model.php` - Model Dashboard
  - `/user/photographer.php` - Photographer Dashboard
  - `/user/stylist.html` - Stylist Dashboard
  - `/user/makeup-artist.html` - Makeup Artist Dashboard
  - `/user/voice-talent.html` - Voice Talent Dashboard
- **Features**:
  - Portfolio Management
  - Applications
  - Calendar/Bookings
  - Messages
  - Media Management
  - Profile & Settings

#### 5. Public Tier (No Authentication)
- **URL**: http://localhost:4040/public/
- **Pages**:
  - `/public/browse.html` - Browse Talent
  - `/public/login.html` - Login Page
  - `/public/gomodels/` - Example Marketplace (Go Models)
  - `/public/overcrewai/` - Example AI Service Marketplace
- **Features**:
  - Public Browsing
  - Talent Discovery
  - Registration
  - Industry-specific Landing Pages

## Special Features in Platform Tier

### Schema & Page Builder System
- **URL**: http://localhost:4040/platform/schemas/
- **Components**:
  - Schema Builder
  - Component Library
  - Template Engine
  - Multi-step Wizard Builder
  - Context-aware Renderer

### Plans & Feature Management
- **URL**: http://localhost:4040/platform/plans/
- **Tools**:
  - Plan Builder
  - Feature Set Builder
  - Permissions Builder
  - Limits Builder
  - Unified Builder (combines all)

### Template Engine
- **URL**: http://localhost:4040/platform/templates/
- **Features**:
  - Template Builder v2
  - Version Manager
  - Template Editor

## Technical Structure

### Directory Layout
```
/php/click-dummy/
├── index.php              # Main homepage
├── platform/              # Platform tier pages
├── tenant/                # Tenant tier pages
├── account/               # Account tier pages
├── user/                  # User tier pages
├── public/                # Public tier pages
├── includes/              # Shared PHP components
│   ├── header.php
│   ├── footer.php
│   ├── sidebar.php
│   ├── components.php
│   └── media-components.php
├── assets/                # Static assets
│   ├── css/
│   │   └── global.css
│   └── js/
│       └── global.js
└── docs/                  # Clickdummy documentation
```

## Navigation Flow

1. **Homepage** (index.php) → Shows all 5 tiers as clickable cards
2. **Each Tier** → Has its own landing page with feature navigation
3. **Features** → Link to specific functionality pages
4. **Cross-tier Navigation** → Header shows current tier and allows switching

## Industry Verticals Demonstrated

1. **Fashion Modeling** (Go Models NYC)
2. **Fitness & Sports**
3. **Voice Talent**
4. **Photography Services**
5. **Child Modeling**
6. **Pet Modeling**

## Key Components

### Header (includes/header.php)
- Dynamic navigation based on current tier
- User info display
- Tier indicator
- Global search

### Sidebar (includes/sidebar.php)
- Context-sensitive menu
- Feature navigation
- Quick actions

### Components (includes/components.php)
- Reusable UI components
- Form builders
- Data tables
- Charts and analytics

## Development Notes

- The clickdummy is a static PHP prototype
- It demonstrates UI/UX flows without backend functionality
- Uses Bootstrap 5 for styling
- Includes FontAwesome icons
- Responsive design for all screen sizes
- Interactive elements use JavaScript for demo purposes

## How to Use

1. Start Docker services: `docker-compose up -d`
2. Access clickdummy at: http://localhost:4040
3. Navigate through different tiers to explore features
4. Use browser DevTools to inspect implementation
5. Reference PHP files for specific page structures

## Related Documentation

- Platform Architecture: `/docs/architecture/`
- API Design: `/docs/development/`
- Component Examples: `/dev/components`
- Main Documentation: http://localhost:3005