# 🔐 itellico Mono - Comprehensive Marketplace Permissions List

**Last Updated:** January 2, 2025  
**Total Permissions:** ~500+ permissions  
**Hierarchical Structure:** Platform → Tenant → Account → User → Profile  
**Permission Format:** `[entity].[action].[scope]`

---

## 📋 **MARKETPLACE SYSTEM OVERVIEW**

### **Account Types:**
- **Agency Account** - Manages models/talent with profiles
- **Individual Account** - Single person with profile(s)
- **Parent Account** - Manages children's accounts and profiles
- **Corporate Account** - Company with team members
- **Client Account** - Hires talent, posts jobs

### **Hierarchy Levels:**
1. **Platform Level** - Super Admin (cross-tenant)
2. **Tenant Level** - Tenant Admin (marketplace owner)
3. **Account Level** - Account Owner (agency/individual/parent/corporate)
4. **User Level** - Team members, invited users
5. **Profile Level** - Individual talent profiles

### **Permission Scopes:**
- **global** - Platform-wide access
- **tenant** - Tenant-wide access
- **account** - Account-wide access  
- **team** - Team/group access
- **own** - Only own entities

---

## 🔴 **PLATFORM LEVEL PERMISSIONS (Super Admin)**
*Total: ~100 permissions*

### **Platform Management (20 permissions)**
```
platform.read.global
platform.create.global
platform.update.global
platform.delete.global
platform.manage.global
platform.settings.global
platform.analytics.global
platform.monitoring.global
platform.maintenance.global
platform.backup.global
platform.restore.global
platform.emergency.global
platform.impersonate.global
platform.audit.global
platform.security.global
platform.billing.global
platform.integrations.global
platform.workflows.global
platform.notifications.global
platform.reports.global
```

### **Tenant Management (15 permissions)**
```
tenants.read.global
tenants.create.global
tenants.update.global
tenants.delete.global
tenants.manage.global
tenants.approve.global
tenants.suspend.global
tenants.analytics.global
tenants.billing.global
tenants.impersonate.global
tenants.subscriptions.global
tenants.domains.global
tenants.branding.global
tenants.workflows.global
tenants.audit.global
```

### **Global Component Management (20 permissions)**
```
categories.manage.global
tags.manage.global
option-sets.manage.global
model-schemas.manage.global
attribute-definitions.manage.global
form-builder.manage.global
zone-editor.manage.global
search-config.manage.global
translations.manage.global
email-templates.manage.global
workflows.manage.global
integrations.manage.global
llm-integrations.manage.global
industry-templates.manage.global
modules.manage.global
subscription-templates.manage.global
payment-gateways.manage.global
media-optimization.manage.global
compliance-rules.manage.global
security-policies.manage.global
```

### **Global User & Account Management (15 permissions)**
```
accounts.read.global
accounts.create.global
accounts.update.global
accounts.delete.global
accounts.manage.global
accounts.impersonate.global
accounts.suspend.global
users.read.global
users.create.global
users.update.global
users.delete.global
users.manage.global
users.impersonate.global
users.suspend.global
users.audit.global
```

### **Global Marketplace Management (15 permissions)**
```
jobs.read.global
jobs.moderate.global
jobs.analytics.global
profiles.read.global
profiles.moderate.global
profiles.analytics.global
media.read.global
media.moderate.global
media.analytics.global
applications.read.global
applications.moderate.global
bookings.read.global
bookings.moderate.global
payments.read.global
payments.manage.global
```

### **System Operations (15 permissions)**
```
audit-logs.read.global
audit-logs.export.global
system-health.monitor.global
performance.monitor.global
security.monitor.global
backups.create.global
backups.restore.global
imports.manage.global
exports.manage.global
queue.manage.global
workflows.execute.global
notifications.manage.global
email.send.global
cache.manage.global
cdn.manage.global
```

---

## 🔵 **TENANT LEVEL PERMISSIONS (Tenant Admin)**
*Total: ~120 permissions*

### **Tenant Dashboard & Settings (15 permissions)**
```
tenant.read.tenant
tenant.update.tenant
tenant.settings.tenant
tenant.analytics.tenant
tenant.billing.tenant
tenant.subscription.tenant
tenant.domain.tenant
tenant.branding.tenant
tenant.white-label.tenant
tenant.marketplace.tenant
tenant.workflows.tenant
tenant.integrations.tenant
tenant.compliance.tenant
tenant.security.tenant
tenant.audit.tenant
```

### **Account Management (20 permissions)**
```
accounts.read.tenant
accounts.create.tenant
accounts.update.tenant
accounts.delete.tenant
accounts.manage.tenant
accounts.approve.tenant
accounts.suspend.tenant
accounts.analytics.tenant
accounts.billing.tenant
accounts.subscriptions.tenant
accounts.white-label.tenant
accounts.impersonate.tenant
accounts.workflows.tenant
accounts.notifications.tenant
accounts.audit.tenant
accounts.types.manage.tenant
accounts.limits.manage.tenant
accounts.verification.manage.tenant
accounts.compliance.manage.tenant
accounts.export.tenant
```

### **User & Profile Management (20 permissions)**
```
users.read.tenant
users.create.tenant
users.update.tenant
users.delete.tenant
users.manage.tenant
users.approve.tenant
users.suspend.tenant
users.impersonate.tenant
users.analytics.tenant
users.workflows.tenant
profiles.read.tenant
profiles.create.tenant
profiles.update.tenant
profiles.delete.tenant
profiles.manage.tenant
profiles.approve.tenant
profiles.moderate.tenant
profiles.feature.tenant
profiles.analytics.tenant
profiles.export.tenant
```

### **Job & Application Management (15 permissions)**
```
jobs.read.tenant
jobs.create.tenant
jobs.update.tenant
jobs.delete.tenant
jobs.manage.tenant
jobs.approve.tenant
jobs.moderate.tenant
jobs.feature.tenant
jobs.analytics.tenant
applications.read.tenant
applications.manage.tenant
applications.approve.tenant
applications.moderate.tenant
applications.analytics.tenant
applications.workflows.tenant
```

### **Media & Content Management (15 permissions)**
```
media.read.tenant
media.approve.tenant
media.reject.tenant
media.moderate.tenant
media.review.tenant
media.optimize.tenant
media.analytics.tenant
media.export.tenant
media.backup.tenant
content.moderate.tenant
content.review.tenant
content.approve.tenant
content.analytics.tenant
content.workflows.tenant
content.compliance.tenant
```

### **Marketplace Operations (15 permissions)**
```
marketplace.configure.tenant
marketplace.moderate.tenant
marketplace.analytics.tenant
bookings.read.tenant
bookings.manage.tenant
bookings.analytics.tenant
payments.read.tenant
payments.moderate.tenant
payments.analytics.tenant
reviews.moderate.tenant
reviews.analytics.tenant
disputes.manage.tenant
disputes.resolve.tenant
commissions.manage.tenant
payouts.manage.tenant
```

### **Content & Configuration (20 permissions)**
```
categories.read.tenant
categories.create.tenant
categories.update.tenant
categories.manage.tenant
tags.read.tenant
tags.create.tenant
tags.update.tenant
tags.manage.tenant
option-sets.read.tenant
option-sets.create.tenant
option-sets.update.tenant
option-sets.manage.tenant
model-schemas.create.tenant
model-schemas.update.tenant
model-schemas.manage.tenant
email-templates.manage.tenant
workflows.manage.tenant
integrations.manage.tenant
subscription-plans.manage.tenant
compliance-rules.manage.tenant
```

---

## 🟠 **ACCOUNT LEVEL PERMISSIONS**
*Varies by Account Type: ~80-120 permissions*

### **AGENCY ACCOUNT OWNER (120 permissions)**

#### **Agency Management (15 permissions)**
```
account.read.account
account.update.account
account.settings.account
account.billing.account
account.subscription.account
account.analytics.account
account.white-label.account
account.domain.account
account.branding.account
account.workflows.account
account.integrations.account
account.compliance.account
account.audit.account
account.export.account
account.delete.account
```

#### **Talent & Profile Management (20 permissions)**
```
profiles.read.account
profiles.create.account
profiles.update.account
profiles.delete.account
profiles.manage.account
profiles.submit.account
profiles.approve.account
profiles.feature.account
profiles.analytics.account
profiles.workflows.account
profiles.media.account
profiles.bookings.account
profiles.rates.account
profiles.availability.account
profiles.contracts.account
profiles.performance.account
profiles.compliance.account
profiles.verification.account
profiles.export.account
profiles.archive.account
```

#### **Team & User Management (15 permissions)**
```
team.read.account
team.create.account
team.update.account
team.delete.account
team.manage.account
team.invite.account
team.roles.account
team.permissions.account
team.workflows.account
team.analytics.account
users.read.account
users.invite.account
users.manage.account
users.suspend.account
users.analytics.account
```

#### **Job & Client Management (20 permissions)**
```
jobs.read.account
jobs.create.account
jobs.update.account
jobs.delete.account
jobs.manage.account
jobs.submit.account
jobs.analytics.account
clients.read.account
clients.create.account
clients.update.account
clients.manage.account
clients.analytics.account
applications.read.account
applications.manage.account
applications.submit.account
applications.analytics.account
bookings.read.account
bookings.manage.account
bookings.analytics.account
contracts.manage.account
```

#### **Business Operations (25 permissions)**
```
billing.read.account
billing.manage.account
invoices.create.account
invoices.manage.account
payments.read.account
payments.manage.account
commissions.read.account
commissions.manage.account
payouts.read.account
payouts.manage.account
reports.read.account
reports.create.account
reports.export.account
analytics.read.account
analytics.export.account
workflows.read.account
workflows.create.account
workflows.manage.account
integrations.read.account
integrations.manage.account
notifications.manage.account
communication.manage.account
compliance.read.account
compliance.manage.account
audit.read.account
```

#### **Media & Marketing (15 permissions)**
```
media.read.account
media.upload.account
media.manage.account
media.approve.account
media.analytics.account
portfolio.manage.account
marketing.create.account
marketing.manage.account
social-media.manage.account
seo.manage.account
branding.manage.account
campaigns.create.account
campaigns.manage.account
advertising.manage.account
press.manage.account
```

#### **Subscription & Client Services (10 permissions)**
```
subscriptions.create.account
subscriptions.manage.account
subscription-plans.create.account
subscription-plans.manage.account
client-portal.manage.account
client-billing.manage.account
client-workflows.manage.account
client-notifications.manage.account
client-analytics.read.account
client-support.manage.account
```

### **INDIVIDUAL ACCOUNT OWNER (80 permissions)**

#### **Personal Account Management (10 permissions)**
```
account.read.account
account.update.account
account.settings.account
account.billing.account
account.subscription.account
account.analytics.account
account.workflows.account
account.compliance.account
account.audit.account
account.delete.account
```

#### **Profile Management (15 permissions)**
```
profiles.read.account
profiles.create.account
profiles.update.account
profiles.delete.account
profiles.manage.account
profiles.submit.account
profiles.analytics.account
profiles.media.account
profiles.availability.account
profiles.rates.account
profiles.verification.account
profiles.performance.account
profiles.export.account
profiles.archive.account
profiles.feature.account
```

#### **Job & Application Management (15 permissions)**
```
jobs.read.account
jobs.apply.account
jobs.manage.account
jobs.analytics.account
applications.read.account
applications.create.account
applications.update.account
applications.submit.account
applications.withdraw.account
applications.analytics.account
bookings.read.account
bookings.manage.account
bookings.accept.account
bookings.decline.account
bookings.analytics.account
```

#### **Media & Portfolio (10 permissions)**
```
media.read.account
media.upload.account
media.manage.account
media.analytics.account
portfolio.read.account
portfolio.create.account
portfolio.update.account
portfolio.manage.account
portfolio.share.account
portfolio.analytics.account
```

#### **Financial & Business (15 permissions)**
```
billing.read.account
payments.read.account
earnings.read.account
earnings.analytics.account
invoices.read.account
invoices.create.account
taxes.read.account
taxes.manage.account
contracts.read.account
contracts.manage.account
rates.manage.account
availability.manage.account
performance.read.account
reviews.read.account
disputes.create.account
```

#### **Communication & Marketing (15 permissions)**
```
messages.read.account
messages.send.account
messages.manage.account
notifications.read.account
notifications.manage.account
communication.manage.account
marketing.read.account
marketing.create.account
social-media.read.account
social-media.manage.account
networking.read.account
networking.manage.account
reviews.create.account
testimonials.manage.account
referrals.manage.account
```

### **PARENT ACCOUNT OWNER (100 permissions)**

#### **Parent Account Management (10 permissions)**
```
account.read.account
account.update.account
account.settings.account
account.billing.account
account.subscription.account
account.analytics.account
account.compliance.account
account.audit.account
account.legal.account
account.safety.account
```

#### **Child Account Management (20 permissions)**
```
children.read.account
children.create.account
children.update.account
children.manage.account
children.approve.account
children.supervise.account
children.analytics.account
children.compliance.account
children.safety.account
children.legal.account
child-profiles.read.account
child-profiles.create.account
child-profiles.manage.account
child-profiles.approve.account
child-profiles.supervise.account
child-profiles.compliance.account
child-profiles.safety.account
child-applications.read.account
child-applications.approve.account
child-bookings.approve.account
```

#### **Safety & Compliance (15 permissions)**
```
safety.read.account
safety.manage.account
compliance.read.account
compliance.manage.account
legal.read.account
legal.manage.account
guardian-consent.manage.account
age-verification.manage.account
work-permits.manage.account
education-coordination.manage.account
hours-monitoring.manage.account
supervision.manage.account
background-checks.read.account
insurance.manage.account
emergency-contacts.manage.account
```

#### **Financial & Educational (15 permissions)**
```
child-earnings.read.account
child-earnings.manage.account
education-accounts.manage.account
trust-funds.manage.account
tax-management.account
financial-planning.account
contracts.approve.account
rate-negotiation.account
booking-approval.account
travel-coordination.account
tutoring.coordinate.account
education.monitor.account
performance.monitor.account
development.track.account
career-planning.account
```

---

## 🟡 **USER LEVEL PERMISSIONS**
*Role-based: 30-60 permissions per role*

### **TEAM MEMBER (40 permissions)**

#### **Collaboration (15 permissions)**
```
collaboration.read.team
collaboration.participate.team
collaboration.comment.team
collaboration.share.team
team-profiles.read.team
team-profiles.update.team
team-jobs.read.team
team-jobs.collaborate.team
team-projects.read.team
team-projects.participate.team
team-communication.read.team
team-communication.send.team
team-files.read.team
team-files.upload.team
team-calendar.read.team
```

#### **Assigned Work (15 permissions)**
```
assigned-tasks.read.own
assigned-tasks.update.own
assigned-tasks.complete.own
assigned-profiles.read.assigned
assigned-profiles.update.assigned
assigned-jobs.read.assigned
assigned-jobs.manage.assigned
assigned-applications.read.assigned
assigned-applications.manage.assigned
assigned-bookings.read.assigned
assigned-bookings.coordinate.assigned
assigned-clients.read.assigned
assigned-clients.communicate.assigned
assigned-media.read.assigned
assigned-media.manage.assigned
```

#### **Personal Management (10 permissions)**
```
profile.read.own
profile.update.own
schedule.read.own
schedule.manage.own
notifications.read.own
notifications.manage.own
reports.read.own
performance.read.own
training.access.own
communication.read.own
```

### **JOB POSTER (35 permissions)**

#### **Job Management (15 permissions)**
```
jobs.read.own
jobs.create.own
jobs.update.own
jobs.delete.own
jobs.manage.own
jobs.publish.own
jobs.promote.own
jobs.analytics.own
job-applications.read.own
job-applications.review.own
job-applications.respond.own
job-categories.read.tenant
job-tags.read.tenant
job-templates.read.tenant
job-compliance.read.tenant
```

#### **Booking & Communication (20 permissions)**
```
bookings.create.own
bookings.manage.own
bookings.confirm.own
bookings.cancel.own
bookings.reschedule.own
bookings.analytics.own
applicant-communication.send.own
applicant-communication.manage.own
talent-profiles.read.tenant
talent-search.access.tenant
talent-filtering.access.tenant
talent-comparison.access.tenant
reviews.create.own
reviews.manage.own
contracts.create.own
contracts.manage.own
payments.create.own
payments.manage.own
disputes.create.own
feedback.provide.own
```

### **PROFILE OWNER (50 permissions)**

#### **Profile Management (20 permissions)**
```
profile.read.own
profile.create.own
profile.update.own
profile.delete.own
profile.submit.own
profile.analytics.own
profile.visibility.own
profile.verification.own
profile.compliance.own
profile-media.upload.own
profile-media.manage.own
profile-portfolio.manage.own
profile-skills.manage.own
profile-experience.manage.own
profile-availability.manage.own
profile-rates.manage.own
profile-preferences.manage.own
profile-safety.manage.own
profile-privacy.manage.own
profile-seo.manage.own
```

#### **Application & Job Management (15 permissions)**
```
applications.read.own
applications.create.own
applications.update.own
applications.submit.own
applications.withdraw.own
applications.analytics.own
applications.status.own
applications.resubmit.own
applications.history.own
job-search.access.tenant
job-filtering.access.tenant
job-alerts.manage.own
job-favorites.manage.own
job-history.read.own
job-recommendations.read.own
```

#### **Marketplace & Communication (15 permissions)**
```
marketplace.browse.tenant
marketplace.search.tenant
marketplace.analytics.own
bookings.read.own
bookings.accept.own
bookings.decline.own
bookings.manage.own
communication.read.own
communication.send.own
reviews.read.own
reviews.respond.own
networking.read.own
networking.participate.own
testimonials.manage.own
referrals.create.own
```

---

## 🟢 **SPECIALIZED ROLE PERMISSIONS**

### **CONTENT MODERATOR (45 permissions)**
```
content.read.tenant
content.moderate.tenant
content.approve.tenant
content.reject.tenant
content.flag.tenant
content.escalate.tenant
profiles.moderate.tenant
profiles.approve.tenant
profiles.flag.tenant
jobs.moderate.tenant
jobs.approve.tenant
jobs.flag.tenant
media.moderate.tenant
media.approve.tenant
media.reject.tenant
media.flag.tenant
applications.moderate.tenant
applications.flag.tenant
reviews.moderate.tenant
reviews.flag.tenant
comments.moderate.tenant
comments.flag.tenant
messages.moderate.tenant
disputes.read.tenant
disputes.investigate.tenant
reports.read.tenant
reports.investigate.tenant
compliance.check.tenant
safety.check.tenant
age-verification.check.tenant
moderation-queue.read.tenant
moderation-queue.manage.tenant
moderation-tools.access.tenant
moderation-analytics.read.tenant
escalation.create.tenant
escalation.manage.tenant
ban.recommend.tenant
suspension.recommend.tenant
warning.issue.tenant
guidelines.enforce.tenant
policies.enforce.tenant
audit-trail.read.tenant
moderation-reports.create.tenant
training.access.tenant
certification.maintain.tenant
```

### **FINANCIAL MANAGER (40 permissions)**
```
billing.read.account
billing.manage.account
invoices.read.account
invoices.create.account
invoices.manage.account
payments.read.account
payments.process.account
payments.manage.account
commissions.read.account
commissions.calculate.account
commissions.manage.account
payouts.read.account
payouts.process.account
payouts.manage.account
earnings.read.account
earnings.analytics.account
expenses.read.account
expenses.manage.account
taxes.read.account
taxes.manage.account
financial-reports.read.account
financial-reports.create.account
financial-analytics.read.account
budgets.read.account
budgets.manage.account
forecasting.read.account
forecasting.create.account
contracts.read.account
contracts.financial.account
rates.read.account
rates.manage.account
pricing.read.account
pricing.manage.account
disputes.financial.account
chargebacks.manage.account
refunds.process.account
accounting.read.account
accounting.manage.account
compliance.financial.account
audit.financial.account
```

### **BOOKING COORDINATOR (35 permissions)**
```
bookings.read.account
bookings.create.account
bookings.manage.account
bookings.confirm.account
bookings.cancel.account
bookings.reschedule.account
bookings.coordinate.account
bookings.analytics.account
calendar.read.account
calendar.manage.account
scheduling.read.account
scheduling.manage.account
availability.read.account
availability.coordinate.account
travel.coordinate.account
logistics.manage.account
venues.coordinate.account
equipment.coordinate.account
crew.coordinate.account
talent.coordinate.account
clients.communicate.account
vendors.coordinate.account
contracts.coordinate.account
releases.manage.account
permits.coordinate.account
insurance.coordinate.account
safety.coordinate.account
emergencies.handle.account
changes.coordinate.account
cancellations.handle.account
communication.coordinate.account
updates.send.account
confirmations.send.account
reminders.send.account
follow-up.coordinate.account
```

---

## 🔧 **MARKETPLACE-SPECIFIC PERMISSIONS**

### **Job Management (25 permissions)**
```
jobs.read.[scope]
jobs.create.[scope]
jobs.update.[scope]
jobs.delete.[scope]
jobs.publish.[scope]
jobs.unpublish.[scope]
jobs.promote.[scope]
jobs.feature.[scope]
jobs.moderate.[scope]
jobs.approve.[scope]
jobs.reject.[scope]
jobs.flag.[scope]
jobs.archive.[scope]
jobs.analytics.[scope]
jobs.export.[scope]
job-categories.assign.[scope]
job-tags.assign.[scope]
job-requirements.manage.[scope]
job-budget.manage.[scope]
job-timeline.manage.[scope]
job-location.manage.[scope]
job-applications.read.[scope]
job-applications.manage.[scope]
job-bookings.manage.[scope]
job-performance.track.[scope]
```

### **Application Management (20 permissions)**
```
applications.read.[scope]
applications.create.[scope]
applications.update.[scope]
applications.submit.[scope]
applications.withdraw.[scope]
applications.review.[scope]
applications.approve.[scope]
applications.reject.[scope]
applications.shortlist.[scope]
applications.interview.[scope]
applications.callback.[scope]
applications.hire.[scope]
applications.decline.[scope]
applications.feedback.[scope]
applications.analytics.[scope]
applications.export.[scope]
applications.archive.[scope]
applications.resubmit.[scope]
applications.track.[scope]
applications.communicate.[scope]
```

### **Media Management (30 permissions)**
```
media.read.[scope]
media.upload.[scope]
media.download.[scope]
media.share.[scope]
media.embed.[scope]
media.organize.[scope]
media.categorize.[scope]
media.tag.[scope]
media.search.[scope]
media.filter.[scope]
media.edit.[scope]
media.crop.[scope]
media.resize.[scope]
media.watermark.[scope]
media.optimize.[scope]
media.compress.[scope]
media.convert.[scope]
media.backup.[scope]
media.restore.[scope]
media.archive.[scope]
media.delete.[scope]
media.moderate.[scope]
media.approve.[scope]
media.reject.[scope]
media.flag.[scope]
media.copyright.[scope]
media.license.[scope]
media.usage-rights.[scope]
media.analytics.[scope]
media.export.[scope]
```

### **Booking Management (25 permissions)**
```
bookings.read.[scope]
bookings.create.[scope]
bookings.update.[scope]
bookings.confirm.[scope]
bookings.cancel.[scope]
bookings.reschedule.[scope]
bookings.extend.[scope]
bookings.modify.[scope]
bookings.approve.[scope]
bookings.decline.[scope]
bookings.coordinate.[scope]
bookings.communicate.[scope]
bookings.remind.[scope]
bookings.follow-up.[scope]
bookings.rate.[scope]
bookings.review.[scope]
bookings.dispute.[scope]
bookings.invoice.[scope]
bookings.payment.[scope]
bookings.completion.[scope]
bookings.analytics.[scope]
bookings.export.[scope]
bookings.archive.[scope]
bookings.calendar.[scope]
bookings.notifications.[scope]
```

### **Payment & Financial (30 permissions)**
```
payments.read.[scope]
payments.create.[scope]
payments.process.[scope]
payments.void.[scope]
payments.refund.[scope]
payments.dispute.[scope]
payments.track.[scope]
payments.analytics.[scope]
invoices.read.[scope]
invoices.create.[scope]
invoices.send.[scope]
invoices.manage.[scope]
invoices.void.[scope]
commissions.read.[scope]
commissions.calculate.[scope]
commissions.adjust.[scope]
commissions.pay.[scope]
payouts.read.[scope]
payouts.process.[scope]
payouts.schedule.[scope]
payouts.track.[scope]
earnings.read.[scope]
earnings.track.[scope]
earnings.analytics.[scope]
taxes.read.[scope]
taxes.calculate.[scope]
taxes.report.[scope]
financial-reports.read.[scope]
financial-reports.create.[scope]
financial-analytics.read.[scope]
```

### **Review & Rating (15 permissions)**
```
reviews.read.[scope]
reviews.create.[scope]
reviews.update.[scope]
reviews.respond.[scope]
reviews.moderate.[scope]
reviews.approve.[scope]
reviews.flag.[scope]
reviews.analytics.[scope]
ratings.read.[scope]
ratings.create.[scope]
ratings.moderate.[scope]
ratings.analytics.[scope]
testimonials.read.[scope]
testimonials.manage.[scope]
testimonials.feature.[scope]
```

---

## 📊 **COMPREHENSIVE ROLE DEFINITIONS**

### **Platform Level Roles**

#### **Super Admin**
- **Total Permissions:** ~150
- **Scope:** Global platform management
- **Key Features:** Emergency access, cross-tenant operations, platform configuration

#### **Platform Support**
- **Total Permissions:** ~75
- **Scope:** Support operations across tenants
- **Key Features:** User assistance, technical support, limited admin access

### **Tenant Level Roles**

#### **Tenant Admin (Marketplace Owner)**
- **Total Permissions:** ~120
- **Scope:** Complete tenant management
- **Key Features:** Account management, content moderation, marketplace configuration

#### **Tenant Manager**
- **Total Permissions:** ~80
- **Scope:** Day-to-day tenant operations
- **Key Features:** User support, content review, basic analytics

#### **Content Moderator**
- **Total Permissions:** ~45
- **Scope:** Content review and moderation
- **Key Features:** Profile/job/media approval, safety enforcement

#### **Financial Manager**
- **Total Permissions:** ~40
- **Scope:** Financial operations
- **Key Features:** Payment processing, commission management, financial reporting

### **Account Level Roles**

#### **Agency Owner**
- **Total Permissions:** ~120
- **Scope:** Complete agency management
- **Key Features:** Talent management, client relations, business operations

#### **Agency Manager**
- **Total Permissions:** ~80
- **Scope:** Day-to-day agency operations
- **Key Features:** Talent coordination, booking management, client communication

#### **Talent Manager**
- **Total Permissions:** ~60
- **Scope:** Talent development and coordination
- **Key Features:** Profile management, application coordination, career development

#### **Booking Coordinator**
- **Total Permissions:** ~35
- **Scope:** Booking and scheduling operations
- **Key Features:** Calendar management, logistics coordination, communication

#### **Individual Account Owner**
- **Total Permissions:** ~80
- **Scope:** Personal account and profile management
- **Key Features:** Self-representation, application management, career control

#### **Parent/Guardian**
- **Total Permissions:** ~100
- **Scope:** Child account supervision and protection
- **Key Features:** Safety oversight, legal compliance, educational coordination

### **User Level Roles**

#### **Team Member**
- **Total Permissions:** ~40
- **Scope:** Collaborative work within assigned areas
- **Key Features:** Task completion, team collaboration, limited independence

#### **Profile Owner**
- **Total Permissions:** ~50
- **Scope:** Individual profile and career management
- **Key Features:** Self-promotion, application submission, marketplace participation

#### **Job Poster**
- **Total Permissions:** ~35
- **Scope:** Job creation and talent hiring
- **Key Features:** Job management, applicant review, booking coordination

#### **Client User**
- **Total Permissions:** ~30
- **Scope:** Client-side marketplace participation
- **Key Features:** Talent browsing, booking requests, project management

### **Specialized Roles**

#### **Safety Officer**
- **Total Permissions:** ~45
- **Scope:** Safety and compliance oversight
- **Key Features:** Age verification, safety monitoring, compliance enforcement

#### **Legal Coordinator**
- **Total Permissions:** ~35
- **Scope:** Legal compliance and documentation
- **Key Features:** Contract management, legal compliance, documentation

#### **Marketing Manager**
- **Total Permissions:** ~40
- **Scope:** Marketing and promotion
- **Key Features:** Campaign management, SEO optimization, social media management

---

## 🎯 **IMPLEMENTATION NOTES**

### **Permission Inheritance**
- Permissions inherit down the hierarchy (Platform → Tenant → Account → User → Profile)
- Higher levels automatically include relevant lower level permissions within scope
- Explicit deny rules can override inheritance
- Account type determines available permission sets

### **Dynamic Permission Assignment**
- Permissions can be granted temporarily with expiration dates
- Usage-based permissions with quotas and rate limiting
- Context-aware permissions based on user status, subscription, and account type
- Role-based permission templates for quick assignment

### **Marketplace-Specific Features**
- Job posting and application workflows
- Media upload and approval processes
- Booking and scheduling systems
- Payment and commission management
- Review and rating systems
- Safety and compliance monitoring

### **Account Type Variations**
- **Agency Accounts:** Focus on talent management and client relations
- **Individual Accounts:** Emphasis on self-promotion and career management
- **Parent Accounts:** Strong safety and compliance features
- **Corporate Accounts:** Team collaboration and project management

### **Emergency Access & Safety**
- Super Admin can activate emergency access with full audit logging
- Automated safety monitoring for minor protection
- Compliance tracking for legal requirements
- Break-glass access for critical system recovery

---

**Total Estimated Permissions: ~500+**

This comprehensive system covers all aspects of a multi-tenant marketplace platform including jobs, media, profiles, bookings, payments, and complex account hierarchies with proper role-based access control and safety features.

