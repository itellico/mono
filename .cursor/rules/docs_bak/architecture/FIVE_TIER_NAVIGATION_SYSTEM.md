# itellico Mono: 5-Tier Navigation System
## Complete Marketplace Navigation Architecture

---

## 🎯 **Overview: Two-Sided Marketplace Structure**

The itellico Mono implements a **two-sided marketplace** connecting:
- **Supply Side**: Talent providers (Models, Photographers, Artists)
- **Demand Side**: Talent seekers (Casting Directors, Brands, Production Companies)

This creates **5 distinct user types**, each with their own navigation and features:

```
┌─────────────────────────────────────────────────────────────┐
│                    MONO PLATFORM (SUPER ADMIN)              │
├─────────────────────────────────────────────────────────────┤
│                    GO MODELS (TENANT ADMIN)                 │
├─────────────────────────────────────────────────────────────┤
│   SUPPLY SIDE                    │    DEMAND SIDE           │
├──────────────────────────────────┼──────────────────────────┤
│ • Agency Account                 │ • Client Account         │
│ • Individual Talent              │   (Casting Directors,    │
│   (Models, Photographers)        │    Brands, Productions)  │
└──────────────────────────────────┴──────────────────────────┘
```

---

## 🗂️ **Sidebar 1: Super Admin (Platform Level)**

**User**: itellico Mono administrators
**Purpose**: Manage the entire multi-tenant platform
**Color Theme**: Purple (Platform authority)

```
┌─────────────────────────────────┐
│ 🏢 SUPER ADMIN                  │
├─────────────────────────────────┤
│ PLATFORM MANAGEMENT             │
│ ├─ 📊 Dashboard                 │
│ ├─ 🏢 Tenants                  │
│ ├─ 📋 Industry Templates       │
│ ├─ 📦 Feature Sets             │
│ └─ 💳 Subscription Plans       │
│                                 │
│ TECHNICAL                       │
│ ├─ 🗄️ Model Schemas            │
│ ├─ ⚙️ Compiled Models          │
│ ├─ 🔌 API Management           │
│ └─ ❤️ System Health            │
│                                 │
│ OPERATIONS                      │
│ ├─ 📈 Usage Analytics          │
│ ├─ 💰 Billing Overview         │
│ ├─ 🎫 Support Tickets          │
│ └─ ⚙️ Platform Settings        │
└─────────────────────────────────┘
```

**Key Features**:
- Manage multiple marketplaces (tenants)
- Create industry templates
- Define feature sets and pricing
- Monitor platform health
- Handle billing across all tenants

---

## 🗂️ **Sidebar 2: Tenant Admin (Marketplace Level)**

**User**: Go Models administrators
**Purpose**: Manage their specific marketplace
**Color Theme**: Blue (Business authority)

```
┌─────────────────────────────────┐
│ 🏪 TENANT ADMIN (GO MODELS)    │
├─────────────────────────────────┤
│ MARKETPLACE MANAGEMENT          │
│ ├─ 📊 Dashboard                 │
│ ├─ 👥 Talent Database          │
│ ├─ 📢 Casting Calls            │
│ ├─ 📅 Bookings                 │
│ └─ 📬 Applications             │
│                                 │
│ CONTENT MANAGEMENT              │
│ ├─ 📁 Categories               │
│ ├─ 🏷️ Tags                     │
│ ├─ 📝 Option Sets              │
│ └─ 🖼️ Media Library            │
│                                 │
│ BUSINESS OPERATIONS             │
│ ├─ 💳 Subscriptions            │
│ ├─ 🧾 Invoicing                │
│ ├─ 💹 Commission Tracking      │
│ └─ 📄 Reports                  │
│                                 │
│ CONFIGURATION                   │
│ ├─ 🎨 Branding                 │
│ ├─ 📧 Email Templates          │
│ ├─ 🔄 Workflows                │
│ ├─ 🔌 Integrations             │
│ └─ ⚙️ Settings                 │
└─────────────────────────────────┘
```

**Key Features**:
- Manage all talent and clients
- Configure marketplace rules
- Handle financial operations
- Customize branding and workflows
- Generate business reports

---

## 🗂️ **Sidebar 3: Agency Account (Supply Side)**

**User**: Modeling agencies, talent management companies
**Purpose**: Manage multiple talents under one account
**Color Theme**: Green (Growth/Management)

```
┌─────────────────────────────────┐
│ 🏢 AGENCY ACCOUNT               │
├─────────────────────────────────┤
│ AGENCY OVERVIEW                 │
│ ├─ 📊 Dashboard                 │
│ ├─ 👥 Our Talents (25)         │
│ ├─ 📅 Active Bookings (8)      │
│ └─ ✉️ Applications (12)        │
│                                 │
│ TALENT MANAGEMENT               │
│ ├─ ➕ Add New Talent           │
│ ├─ 📸 Portfolios               │
│ ├─ 🕐 Availability             │
│ └─ 📄 Documents                │
│                                 │
│ BUSINESS                        │
│ ├─ 💰 Earnings                 │
│ ├─ 🧾 Invoices                 │
│ ├─ 📜 Contracts                │
│ └─ 📊 Statistics               │
│                                 │
│ AGENCY SETTINGS                 │
│ ├─ 🏢 Agency Profile           │
│ ├─ 👥 Team Members (5)         │
│ ├─ 🔔 Notifications            │
│ └─ ⚙️ Preferences              │
└─────────────────────────────────┘
```

**Key Features**:
- Manage roster of talents
- Handle bookings for all talents
- Track agency earnings
- Manage team permissions
- Bulk operations for efficiency

---

## 🗂️ **Sidebar 4: Individual Talent (Supply Side)**

**User**: Individual models, photographers, makeup artists
**Purpose**: Manage their own professional profile
**Color Theme**: Orange (Personal/Creative)

```
┌─────────────────────────────────┐
│ 👤 TALENT ACCOUNT               │
├─────────────────────────────────┤
│ MY CAREER                       │
│ ├─ 📊 Dashboard                 │
│ ├─ 👤 My Profile               │
│ ├─ 📸 Portfolio (45)           │
│ └─ 🎫 Comp Cards               │
│                                 │
│ WORK                            │
│ ├─ 💼 Job Board (New: 23)      │
│ ├─ ✉️ My Applications (5)      │
│ ├─ 📅 Bookings (3)             │
│ └─ 🕐 Availability             │
│                                 │
│ EARNINGS                        │
│ ├─ 💰 Income                   │
│ ├─ 🧾 Invoices                 │
│ └─ 📄 Tax Documents            │
│                                 │
│ ACCOUNT                         │
│ ├─ ⚙️ Settings                 │
│ ├─ 🔒 Privacy                  │
│ ├─ 🔔 Notifications            │
│ └─ 💳 Subscription             │
└─────────────────────────────────┘
```

**Key Features**:
- Professional profile management
- Portfolio showcase
- Apply for jobs
- Track earnings
- Manage availability

---

## 🗂️ **Sidebar 5: Client Account (Demand Side)**

**User**: Casting directors, brands, production companies
**Purpose**: Find and book talent for projects
**Color Theme**: Red (Action/Booking)

```
┌─────────────────────────────────┐
│ 🎬 CLIENT ACCOUNT               │
├─────────────────────────────────┤
│ DISCOVER TALENT                 │
│ ├─ 🔍 Search Talents           │
│ ├─ 🔖 Saved Searches (8)       │
│ ├─ ❤️ Favorites (45)           │
│ └─ 📁 Collections (12)         │
│                                 │
│ PROJECTS                        │
│ ├─ ➕ Create Casting           │
│ ├─ 📢 Active Castings (3)      │
│ ├─ 📬 Applications (127)       │
│ └─ 📅 Bookings (15)            │
│                                 │
│ MANAGEMENT                      │
│ ├─ 📜 Contracts                │
│ ├─ 🧾 Invoices                 │
│ ├─ 💬 Messages (23)            │
│ └─ ⭐ Reviews                  │
│                                 │
│ COMPANY                         │
│ ├─ 🏢 Company Profile          │
│ ├─ 👥 Team (8)                 │
│ ├─ 💳 Billing                  │
│ └─ ⚙️ Settings                 │
└─────────────────────────────────┘
```

**Key Features**:
- Advanced talent search
- Create and manage castings
- Book talent directly
- Manage project pipeline
- Team collaboration tools

---

## 🔄 **Navigation Flow Examples**

### **Example 1: Booking Flow**
```
Client searches talents → Views profile → Initiates booking →
Talent receives notification → Accepts/Negotiates → Booking confirmed →
Both parties see in their dashboards
```

### **Example 2: Application Flow**
```
Tenant creates casting → Talent sees in job board → Applies →
Application appears in client's inbox → Client reviews → 
Accepts/Rejects → Talent notified
```

### **Example 3: Agency Management**
```
Agency adds new talent → Creates profile → Uploads portfolio →
Profile visible in marketplace → Receives booking → 
Agency manages booking → Commission tracked
```

---

## 🎨 **Visual Differentiation Strategy**

### **Color Coding**
- **Purple**: Super Admin (Platform authority)
- **Blue**: Tenant Admin (Business authority)
- **Green**: Agency (Management/Growth)
- **Orange**: Individual Talent (Creative/Personal)
- **Red**: Client (Action/Urgency)

### **Icon System**
- Use consistent icons across all tiers
- Different icon styles for different user types
- Badge counts for actionable items
- Status indicators for real-time updates

### **Layout Variations**
- **Super Admin**: Dense, data-focused
- **Tenant Admin**: Business metrics prominent
- **Agency**: Roster management focused
- **Talent**: Visual portfolio emphasis
- **Client**: Search and discovery focused

---

## 📱 **Responsive Behavior**

### **Mobile Navigation**
- Bottom tab bar for primary sections
- Hamburger menu for secondary items
- Quick actions floating button
- Swipe gestures for common tasks

### **Tablet Optimization**
- Collapsible sidebar
- Split-view support
- Touch-optimized controls
- Landscape-specific layouts

### **Desktop Experience**
- Full sidebar always visible
- Keyboard shortcuts
- Multi-window support
- Advanced filtering options

---

## 🔐 **Permission-Based Visibility**

Each navigation item is controlled by RBAC permissions:

```typescript
// Example permission checks
const navigationItems = [
  {
    label: "Talent Database",
    href: "/admin/talents",
    permission: "talents.list",
    show: hasPermission(user, "talents.list")
  },
  {
    label: "Commission Tracking",
    href: "/admin/commissions",
    permission: "commissions.view",
    show: hasPermission(user, "commissions.view") && 
          hasFeature(tenant, "commission_tracking")
  }
];
```

---

## 🚀 **Implementation Priority**

### **Phase 1: Core Navigation**
1. Consolidate existing sidebar components
2. Implement 5-tier navigation structure
3. Add permission-based visibility
4. Create responsive mobile navigation

### **Phase 2: Enhanced Features**
1. Add real-time notification badges
2. Implement quick actions
3. Add search within navigation
4. Create customizable shortcuts

### **Phase 3: Advanced UX**
1. Add AI-powered suggestions
2. Implement usage-based ordering
3. Create contextual help system
4. Add navigation analytics

---

This 5-tier navigation system creates clear separation between user types while maintaining a cohesive marketplace experience. Each tier has distinct features and workflows optimized for their specific needs, creating an efficient and intuitive platform for all users.