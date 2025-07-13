---
title: Account Management
sidebar_label: Account Management
---

# User Account Management

Your personal account is the foundation of your marketplace presence. Manage your profile, preferences, security settings, and subscription all in one place.

## Overview

Account Management provides:

- **Profile Management**: Public and private information
- **Security Settings**: Authentication and privacy
- **Preferences**: Personalization and notifications
- **Subscription**: Plan and billing management
- **Activity Tracking**: Usage history and analytics

## Core Features

### 👤 Profile Management

Create and maintain your professional presence:

**Profile Components:**
```typescript
interface UserProfile {
  public: {
    displayName: string;
    avatar: string;
    bio: string;
    location: string;
    languages: string[];
    specializations: string[];
    verified: boolean;
  };
  professional: {
    experience: string;
    education: Education[];
    certifications: Certification[];
    awards: Award[];
    publications: Publication[];
  };
  measurements?: { // For models
    height: string;
    measurements: string;
    dress: string;
    shoe: string;
    hair: string;
    eyes: string;
  };
  contact: {
    email: string;
    phone?: string;
    website?: string;
    social: SocialLinks;
  };
}
```

**Profile Types:**
- **Model Profile**: Physical attributes, comp cards
- **Creative Profile**: Portfolio, services, rates
- **Client Profile**: Company info, requirements
- **Vendor Profile**: Products, inventory, terms

### 🔐 Security Settings

Protect your account and data:

**Authentication Options:**
- **Password Security**: Strong password requirements
- **Two-Factor Auth**: SMS, Email, or App-based
- **Social Login**: Google, Facebook, LinkedIn
- **Biometric Login**: Face ID, Touch ID (mobile)
- **Session Management**: Active sessions control

**Privacy Controls:**
```typescript
interface PrivacySettings {
  profileVisibility: 'public' | 'registered' | 'network' | 'private';
  contactInfo: {
    showEmail: boolean;
    showPhone: boolean;
    showLocation: 'exact' | 'city' | 'country' | 'hidden';
  };
  activity: {
    showLastActive: boolean;
    showPortfolioViews: boolean;
    showBookingHistory: boolean;
  };
  dataSharing: {
    analytics: boolean;
    marketing: boolean;
    partners: boolean;
  };
}
```

### 🔔 Notification Preferences

Control how you receive updates:

**Notification Channels:**
- **In-App**: Real-time notifications
- **Email**: Detailed updates
- **SMS**: Urgent alerts
- **Push**: Mobile notifications

**Notification Types:**
```typescript
interface NotificationPreferences {
  messages: {
    newMessage: ['inapp', 'email'];
    unreadReminder: ['email'];
  };
  bookings: {
    newRequest: ['inapp', 'email', 'sms'];
    confirmation: ['email'];
    reminder: ['email', 'push'];
    cancellation: ['inapp', 'email', 'sms'];
  };
  applications: {
    statusUpdate: ['inapp', 'email'];
    deadline: ['email', 'push'];
  };
  platform: {
    updates: ['email'];
    maintenance: ['email'];
    newsletter: boolean;
  };
}
```

### 💳 Subscription Management

Manage your marketplace access:

**Subscription Features:**
- **Current Plan**: View active features
- **Usage Tracking**: Monitor limits
- **Billing History**: Invoices and payments
- **Payment Methods**: Cards and banks
- **Upgrade/Downgrade**: Change plans

**Plan Management:**
```typescript
interface Subscription {
  plan: {
    name: string;
    tier: 'free' | 'starter' | 'professional' | 'premium';
    price: number;
    billing: 'monthly' | 'annual';
  };
  features: {
    [feature: string]: {
      enabled: boolean;
      limit?: number;
      usage?: number;
    };
  };
  billing: {
    nextDate: Date;
    method: PaymentMethod;
    autoRenew: boolean;
  };
  addons: Addon[];
}
```

## Account Features

### 📊 Activity Dashboard

Monitor your marketplace activity:

**Activity Metrics:**
- Profile views
- Portfolio engagement
- Application success rate
- Booking completion rate
- Revenue trends

**Analytics Dashboard:**
```typescript
interface UserAnalytics {
  profile: {
    views: number;
    uniqueVisitors: number;
    conversionRate: number;
    topReferrers: string[];
  };
  portfolio: {
    views: { [item: string]: number };
    downloads: number;
    shares: number;
    favorites: number;
  };
  engagement: {
    messagesReceived: number;
    responseRate: number;
    avgResponseTime: string;
  };
  performance: {
    bookingRate: number;
    completionRate: number;
    rating: number;
    earnings: number;
  };
}
```

### 🔗 Connected Accounts

Link external services:

**Social Media:**
- Instagram portfolio sync
- LinkedIn verification
- Facebook page
- Twitter/X profile
- TikTok showcase

**Professional Networks:**
- Industry databases
- Union memberships
- Professional associations
- Certification bodies

**Payment Services:**
- Stripe Connect
- PayPal Business
- Bank accounts
- Tax services

### 📱 Device Management

Control account access:

**Device Features:**
- Active devices list
- Remote logout
- Device nicknames
- Last activity
- Location tracking

**Security Alerts:**
- New device login
- Suspicious activity
- Location changes
- Failed attempts

### 🗂️ Data Management

Control your information:

**Data Export:**
- Download all data
- Specific date ranges
- Format options (JSON, CSV)
- Media files included

**Data Deletion:**
- Delete specific content
- Account deactivation
- Full deletion request
- Grace period

## Settings Categories

### General Settings

Basic account configuration:

- **Display Name**: How you appear
- **Username**: Unique identifier
- **Time Zone**: Local time display
- **Language**: Interface language
- **Currency**: Pricing display

### Privacy Settings

Control information visibility:

- **Profile Privacy**: Who can see
- **Search Visibility**: Discoverable
- **Contact Privacy**: Communication
- **Activity Privacy**: What's shown
- **Blocking**: User restrictions

### Communication Settings

Message and contact preferences:

- **Message Filters**: Auto-filtering
- **Auto-Responses**: Away messages
- **Read Receipts**: Show status
- **Typing Indicators**: Real-time
- **Contact Requests**: Approval required

### Display Settings

Customize your experience:

- **Theme**: Light/Dark/Auto
- **Density**: Comfortable/Compact
- **Animations**: Enable/Disable
- **Accessibility**: Enhanced options
- **Mobile View**: Responsive settings

## Account Actions

### Account Verification

Build trust with verification:

**Verification Levels:**
1. **Email Verified**: Basic requirement
2. **Phone Verified**: SMS confirmation
3. **Identity Verified**: ID check
4. **Professional Verified**: Credentials
5. **Business Verified**: Company docs

**Benefits:**
- Verification badge
- Higher visibility
- Priority support
- Advanced features
- Trust factor

### Account Recovery

Regain access if needed:

**Recovery Methods:**
- Email reset link
- SMS verification
- Security questions
- Backup codes
- Support assistance

**Prevention Tips:**
- Keep contact info updated
- Save backup codes
- Use strong passwords
- Enable 2FA
- Regular security reviews

### Account Migration

Move between account types:

**Migration Process:**
1. Review new features
2. Data compatibility check
3. Preview changes
4. Confirm migration
5. Adjustment period

**Supported Migrations:**
- Individual → Business
- Free → Paid
- Regional → Global
- Legacy → Modern

## Best Practices

### Security Best Practices

1. **Strong Passwords**: Use unique, complex passwords
2. **Enable 2FA**: Add extra security layer
3. **Regular Reviews**: Check active sessions
4. **Update Info**: Keep contact current
5. **Monitor Activity**: Watch for anomalies

### Profile Optimization

- Complete all sections
- Use professional photos
- Update regularly
- Verify credentials
- Showcase achievements

### Privacy Balance

Find the right visibility:
- Public for discovery
- Private for security
- Selective sharing
- Regular audits
- Clear boundaries

## Troubleshooting

### Common Issues

**Login Problems:**
- Password reset
- 2FA issues
- Account locked
- Session expired

**Profile Issues:**
- Changes not saving
- Photo upload errors
- Verification delays
- Display problems

**Billing Issues:**
- Payment failures
- Plan confusion
- Invoice access
- Refund requests

## Related Documentation

- [Security Guide](/user/security)
- [Privacy Policy](/legal/privacy)
- [Subscription Plans](/user/subscription)
- [Profile Setup](/guides/profile-setup)