# Widget Architecture & Best Practices

## 🏗️ Complete Widget System Architecture

### Overview

The widget system implements a strict separation of concerns between Platform Owners and Tenants:

- **Platform Owners**: Create widgets, define schema connections, set restrictions
- **Tenants**: Use pre-approved widgets, configure them within allowed parameters
- **End Users**: Interact with rendered widgets on public pages

## 📊 Permission Hierarchy

```
Platform Owner (Super Admin)
├── Creates Widget Types
├── Defines Schema Connections
├── Sets Option Set Dependencies
├── Configures Tenant Options
├── Bundles into Industry Templates
└── Sets Usage Restrictions

Tenant Admin
├── Uses Approved Widgets
├── Configures Display Settings
├── Sets Data Filters (within allowed range)
├── Builds Pages with Widgets
└── Cannot modify widget core functionality
```

## 🔧 Platform Owner Responsibilities

### 1. Widget Creation

Platform owners create widgets with full control over:

```javascript
{
  "widget": {
    "id": "advanced-model-grid",
    "name": "Advanced Model Grid",
    "category": "model",
    "description": "Display models in responsive grid with filtering",
    
    // Schema connections - defines data access
    "allowed_schemas": [
      "fashion_model",
      "commercial_model", 
      "fitness_model"
    ],
    
    // Option sets - for dropdowns and filters
    "required_option_sets": [
      "height_cm",
      "eye_colors",
      "hair_colors",
      "dress_sizes",
      "locations"
    ],
    
    // What tenants can configure
    "tenant_config_options": {
      "display": {
        "columns": { "min": 2, "max": 6, "default": 3 },
        "items_per_page": { "min": 6, "max": 50, "default": 12 },
        "image_aspect": ["square", "portrait", "landscape"]
      },
      "fields": {
        "allowed": ["name", "height", "age", "location", "measurements"],
        "required": ["name"],
        "default": ["name", "height", "age"]
      },
      "features": {
        "quick_view": { "enabled": true, "configurable": true },
        "favorites": { "enabled": true, "configurable": true },
        "comparison": { "enabled": false, "configurable": false }
      }
    },
    
    // Security
    "required_permissions": ["models.list", "models.view"],
    
    // Industry template assignment
    "included_in_templates": [
      "modeling-agency",
      "fashion-agency",
      "commercial-talent"
    ]
  }
}
```

### 2. Schema Connection Management

Platform owners define exactly which data each widget can access:

```typescript
// Widget-Schema Mapping
const WIDGET_SCHEMA_MAP = {
  'model-grid': {
    allowed_schemas: ['fashion_model', 'commercial_model'],
    field_restrictions: {
      'fashion_model': {
        hidden_fields: ['personal_email', 'phone'], // Privacy
        read_only: ['created_at', 'updated_at']
      }
    }
  },
  
  'model-filter': {
    allowed_schemas: ['fashion_model', 'commercial_model'],
    filterable_fields: [
      'gender', 'height', 'age_range', 'hair_color',
      'eye_color', 'location', 'languages'
    ]
  },
  
  'registration-form': {
    allowed_schemas: ['model_application'],
    conditional_fields: {
      'child_model': ['guardian_name', 'guardian_contact'],
      'pet_model': ['breed', 'vaccinations']
    }
  }
};
```

### 3. Option Set Integration

Platform owners connect widgets to option sets:

```javascript
// Option Set Dependencies
{
  "widget_option_sets": {
    "model-grid": {
      "height_display": {
        "option_set": "height_cm",
        "features": ["regional_conversion", "range_filter"]
      },
      "location_filter": {
        "option_set": "locations_hierarchical",
        "features": ["country_state_city_cascade"]
      }
    }
  }
}
```

### 4. Industry Bundle Creation

Platform owners bundle widgets for specific industries:

```javascript
const MODELING_AGENCY_BUNDLE = {
  "id": "modeling-agency",
  "name": "Modeling Agency Complete",
  "widgets": [
    // Model Display Widgets
    { "id": "model-grid", "required": true },
    { "id": "model-carousel", "required": false },
    { "id": "model-search", "required": true },
    { "id": "model-filter", "required": true },
    { "id": "featured-models", "required": false },
    
    // Form Widgets
    { "id": "registration-form", "required": true },
    { "id": "casting-application", "required": true },
    { "id": "contact-form", "required": true },
    
    // Casting Widgets
    { "id": "casting-list", "required": false },
    { "id": "casting-calendar", "required": false }
  ],
  
  "default_pages": [
    {
      "title": "Our Models",
      "slug": "models",
      "widgets": ["model-filter", "model-grid"]
    },
    {
      "title": "Join Us",
      "slug": "join",
      "widgets": ["registration-form"]
    }
  ]
};
```

## 👥 Tenant Admin Capabilities

### 1. Widget Configuration (What Tenants CAN Do)

Tenants can only configure options exposed by the platform:

```javascript
// Tenant's widget configuration
{
  "page_section": {
    "widget_type": "model-grid", // Cannot change
    "configuration": {
      // Display settings - within allowed ranges
      "display": {
        "columns": 4, // Platform allows 2-6
        "items_per_page": 20, // Platform allows 6-50
        "image_aspect": "portrait" // From allowed options
      },
      
      // Field selection - from allowed fields only
      "fields": ["name", "height", "age", "location"],
      
      // Data filters - using allowed schemas
      "filters": {
        "schema": "fashion_model", // From allowed_schemas
        "gender": "female",
        "min_height": 170,
        "status": "active"
      },
      
      // Features - only if platform allows
      "features": {
        "quick_view": true, // Platform allows configuration
        "favorites": false  // Tenant chose to disable
        // "comparison": Not available - platform disabled
      }
    }
  }
}
```

### 2. What Tenants CANNOT Do

- ❌ Create new widget types
- ❌ Modify widget core functionality  
- ❌ Access schemas not assigned to widget
- ❌ Use option sets not connected to widget
- ❌ Change security permissions
- ❌ Access fields marked as hidden
- ❌ Override platform restrictions

## 🔄 Complete Data Flow

### 1. Widget Creation (Platform)
```
Platform Admin → Create Widget → Define Schemas → Set Option Sets → Configure Restrictions → Bundle in Templates
```

### 2. Widget Usage (Tenant)
```
Tenant Admin → Add Widget to Page → Configure (within limits) → Select Data Source → Set Display Options → Publish
```

### 3. Widget Rendering (Public)
```
User Visits Page → Load Widget Config → Fetch Schema Data → Apply Option Sets → Render with Regional Settings
```

## 🎯 Best Practices

### For Platform Owners

1. **Start with User Needs**
   - Research what tenants actually need
   - Don't over-engineer widgets
   - Provide sensible defaults

2. **Schema Design**
   - Keep schemas focused and specific
   - Use consistent field naming
   - Plan for extensibility

3. **Option Set Management**
   - Create reusable option sets
   - Include regional variations
   - Keep translations updated

4. **Security First**
   - Hide sensitive fields
   - Enforce permission checks
   - Validate all inputs

5. **Performance Considerations**
   - Limit maximum items
   - Implement pagination
   - Cache widget output

### For Tenant Admins

1. **Understand Your Widgets**
   - Read widget documentation
   - Test configurations thoroughly
   - Use preview before publishing

2. **Optimize for Users**
   - Choose appropriate display settings
   - Don't show too many fields
   - Enable helpful features

3. **Data Management**
   - Use filters effectively
   - Keep content updated
   - Monitor widget performance

## 🚀 Implementation Example

### Platform Creates "Model Showcase" Widget

```php
// Platform: Create Widget
$widget = [
    'id' => 'model-showcase',
    'name' => 'Model Showcase Grid',
    'allowed_schemas' => ['fashion_model', 'commercial_model'],
    'tenant_options' => [
        'layout' => ['grid', 'masonry', 'carousel'],
        'columns' => ['2', '3', '4', '5'],
        'show_fields' => [
            'name' => ['required' => true],
            'height' => ['required' => false],
            'location' => ['required' => false],
            'agency' => ['required' => false]
        ]
    ]
];
```

### Tenant Configures Widget

```javascript
// Tenant: Configure for their needs
const widgetConfig = {
  widget_type: 'model-showcase',
  settings: {
    layout: 'masonry', // Chose from platform options
    columns: '4',
    show_fields: ['name', 'height', 'location'], // Skipped 'agency'
    filters: {
      gender: 'female',
      min_height: 170,
      location: 'New York'
    }
  }
};
```

### Result: Optimized for Both

- Platform maintains control and consistency
- Tenant gets flexibility within boundaries
- End users get performant, relevant content

## 📈 Metrics & Monitoring

### Platform Should Track:
- Widget usage across tenants
- Performance metrics
- Error rates
- Schema query patterns

### Tenants Should Monitor:
- Page load times with widgets
- User engagement rates
- Conversion metrics
- Widget configuration effectiveness

## 🔮 Future Enhancements

1. **AI-Powered Widgets**
   - Auto-optimize based on user behavior
   - Suggest configuration improvements
   - Predictive content loading

2. **Widget Marketplace**
   - Third-party widget development
   - Revenue sharing model
   - Community contributions

3. **Advanced Personalization**
   - User-specific widget rendering
   - A/B testing framework
   - Dynamic configuration based on context

This architecture ensures a scalable, secure, and flexible widget system that serves the needs of platform owners, tenants, and end users effectively.