# 📧 mono Platform Email System

This directory contains the **simplified MJML + Nunjucks email system** - the finalized architecture for mono Platform email functionality.

## 🏗️ Architecture Overview

### Core Components

1. **Template Renderer** (`services/template-renderer.ts`)
   - MJML compilation to responsive HTML
   - Nunjucks template engine with Smarty-like syntax
   - Automatic text version generation
   - Layout and component inheritance
   - Custom filters and template utilities

2. **Simplified Email Service** (`services/simplified-email-service.ts`)
   - Unified API for all email sending
   - Mailgun integration (production)
   - Mailpit integration (development)
   - Redis-based email queue
   - Tenant branding support
   - Email scheduling and analytics

### Template Structure

```
src/emails/templates/
├── system/           # Developer-managed templates (never edited by tenants)
│   ├── auth/         # Authentication emails
│   ├── platform/     # Platform notifications
│   └── admin/        # Admin system emails
├── tenant/          # Tenant admin-customizable templates
│   ├── workflow/    # Workflow notifications
│   ├── messaging/   # User communications
│   └── marketing/   # Marketing campaigns
├── layouts/         # Base layouts (base.mjml, system.mjml, tenant.mjml)
└── components/      # Reusable components (button.mjml, alert.mjml)
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { emailService } from '@/emails/services/simplified-email-service';

// Send a welcome email
await emailService.sendEmail({
  to: 'user@example.com',
  templatePath: 'system/auth/welcome',
  variables: {
    userName: 'John Doe',
    userEmail: 'user@example.com',
    userType: 'model'
  },
  tenantId: 123,
  category: 'authentication',
  priority: 'high'
});
```

### Convenience Functions

```typescript
import { 
  sendWelcomeEmail, 
  sendPasswordResetEmail, 
  sendEmailVerification 
} from '@/emails/services/simplified-email-service';

// Welcome email
await sendWelcomeEmail(
  'user@example.com', 
  'John Doe', 
  'photographer', 
  123
);

// Password reset
await sendPasswordResetEmail(
  'user@example.com',
  'John Doe', 
  'https://platform.com/reset?token=abc123',
  123
);

// Email verification
await sendEmailVerification(
  'user@example.com',
  'John Doe',
  'https://platform.com/verify?token=xyz789',
  'agency',
  123
);
```

### Template String Usage

```typescript
// Send email with custom template string
await emailService.sendEmail({
  to: 'user@example.com',
  templateString: `
    {% extends "layouts/base.mjml" %}
    {% block content %}
    <mj-text>
      <h2>Hello {{ userName }}!</h2>
      <p>Your project "{{ projectName }}" has been updated.</p>
    </mj-text>
    {% endblock %}
  `,
  variables: {
    userName: 'John Doe',
    projectName: 'Summer Campaign'
  },
  subject: 'Project Update: {{ projectName }}',
  tenantId: 123
});
```

## 📝 Creating Templates

### System Templates

System templates are managed by developers and follow this structure:

**Template File:** `system/auth/welcome.mjml`
```mjml
{% extends "layouts/base.mjml" %}

{% block content %}
<mj-text font-size="28px" font-weight="600" color="#1f2937" align="center">
  Welcome to {{ tenantName or platformName }}!
</mj-text>

<mj-text>
  <p>Hi {{ userName }},</p>
  <p>Welcome to our platform! We're excited to have you join us.</p>
</mj-text>

<mj-text align="center" padding="30px 0">
  {% include "components/button.mjml" with { 
    url: platformUrl + "/auth/signin", 
    text: "Get Started", 
    style: "primary" 
  } %}
</mj-text>
{% endblock %}
```

**Configuration File:** `system/auth/welcome.json`
```json
{
  "subject": "Welcome to {{ tenantName or platformName }}! 🎉",
  "preheader": "Your account has been successfully created",
  "category": "authentication",
  "layout": "base",
  "variables": {
    "userName": "User's full name",
    "userEmail": "User's email address",
    "userType": "Type of user: model, photographer, agency, client"
  },
  "description": "Welcome email sent when a new user creates an account"
}
```

### Tenant Templates

Tenant templates can be customized by tenant administrators:

```mjml
{% extends "layouts/base.mjml" %}

{% block content %}
<mj-text font-size="24px" color="{{ tenantBranding.primaryColor or '#4F46E5' }}">
  {{ projectTitle }} - Application Update
</mj-text>

{% if status == "approved" %}
  {% include "components/alert.mjml" with { 
    type: "success", 
    title: "Congratulations!",
    message: "Your application has been approved."
  } %}
{% endif %}

<mj-text>
  <p>Hi {{ userName }},</p>
  <p>Your application for "{{ projectTitle }}" has been {{ status }}.</p>
</mj-text>
{% endblock %}
```

## 🎨 Template Features

### Built-in Variables

Every template has access to these variables:

```typescript
{
  // System variables
  platformName: string;
  platformUrl: string;
  supportEmail: string;
  currentYear: number;
  
  // Tenant variables (when available)
  tenantName?: string;
  tenantDomain?: string;
  tenantBranding?: {
    primaryColor: string;
    logoUrl?: string;
    customCss?: string;
  };
  
  // Environment info
  isDevelopment: boolean;
  isProduction: boolean;
  
  // Template utilities
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  truncate: (text: string, length: number) => string;
}
```

### Custom Filters

```nunjucks
{{ date | date('long') }}           <!-- January 15, 2024 -->
{{ price | currency('USD') }}       <!-- $29.99 -->
{{ text | truncate(100) }}          <!-- Truncated text... -->
{{ name | title }}                  <!-- Title Case -->
{{ url | urlencode }}               <!-- URL encoded -->
```

### Components

```nunjucks
<!-- Button Component -->
{% include "components/button.mjml" with { 
  url: "https://example.com", 
  text: "Click Here", 
  style: "primary" 
} %}

<!-- Alert Component -->
{% include "components/alert.mjml" with { 
  type: "success", 
  title: "Success!",
  message: "Your action was completed successfully."
} %}
```

## 🔧 Development & Testing

### Local Development

1. **Start Mailpit** (SMTP testing):
   ```bash
   # Mailpit should be running via Docker
   # Access web UI: http://localhost:8025
   ```

2. **Test email sending**:
   ```typescript
   import { emailService } from '@/emails/services/simplified-email-service';
   
   // This will send to Mailpit in development
   await emailService.sendEmail({
     to: 'test@example.com',
     templatePath: 'system/auth/welcome',
     variables: { userName: 'Test User' }
   });
   ```

### Template Validation

```typescript
// Check if template exists
const exists = await emailService.validateTemplate('system/auth/welcome');

// List available templates
const templates = await emailService.listTemplates('authentication');

// Get queue statistics
const stats = await emailService.getQueueStats();
```

### Background Processing

```typescript
// Process email queue (run this in a background worker)
const processed = await emailService.processEmailQueue(10);

// Process scheduled emails
const scheduledProcessed = await emailService.processScheduledEmails();
```

## 📊 Email Analytics

Email sends are automatically logged to the database with:

- Message ID and delivery status
- Template used and variables
- Tenant context
- Category and priority
- Send/error timestamps
- Mailgun tracking data (production)

## 🎯 Best Practices

### 1. Template Organization
- Use system templates for platform-wide functionality
- Use tenant templates for customizable workflows
- Keep templates focused and single-purpose
- Include fallback content for missing variables

### 2. Variable Handling
- Always provide fallback values: `{{ userName or "User" }}`
- Use descriptive variable names
- Document required variables in `.json` config files
- Validate critical variables in your application code

### 3. Performance
- Use template caching in production
- Queue non-urgent emails for background processing
- Use `priority: 'high'` only for critical emails
- Schedule bulk emails during off-peak hours

### 4. Testing
- Test all templates in development with Mailpit
- Verify responsive design on multiple email clients
- Test with missing/malformed variables
- Validate email deliverability in production

## 🔄 Migration from Old System

The simplified email service replaces the previous system:

### Before (Handlebars + React Email)
```typescript
// Old approach - multiple systems
await handlebarsEmailService.send(...);
await reactEmailService.render(...);
```

### After (MJML + Nunjucks)
```typescript
// New unified approach
await emailService.sendEmail({
  templatePath: 'system/auth/welcome',
  variables: { userName: 'John' }
});
```

### Migration Steps
1. Replace old email service calls with new unified API
2. Convert existing templates to MJML + Nunjucks format  
3. Update email queue processing to use new service
4. Test all email flows with new templates
5. Remove old email service dependencies

## 🌟 Benefits

- **Zero paid dependencies** (saves $1,188-$4,788/year vs Unlayer)
- **Single templating system** (maximum simplicity)
- **Responsive by default** (MJML compilation)
- **Tenant customization** (branding and custom templates)
- **Developer-friendly** (Smarty-like syntax)
- **Production-ready** (Mailgun integration with queuing)
- **Comprehensive** (scheduling, analytics, error handling)