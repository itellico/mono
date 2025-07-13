---
title: Core Management
sidebar_label: Core Management
---

# Tenant Core Management

Core Management encompasses the essential marketplace operations including gigs, jobs, bookings, transactions, and talent management. This is the heart of your marketplace operations where supply meets demand.

## Overview

The Core Management system provides:

- **Gig Management**: Short-term projects and opportunities
- **Job Management**: Long-term positions and employment
- **Booking System**: Scheduling and resource allocation
- **Talent Pool**: Vendor and service provider management
- **Transaction Processing**: Payments and commissions

## Core Features

### 📋 Gig Management

Manage short-term projects and opportunities:

**Gig Lifecycle:**
```typescript
enum GigStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

interface Gig {
  id: string;
  title: string;
  category: string;
  description: string;
  requirements: string[];
  budget: {
    min: number;
    max: number;
    type: 'fixed' | 'hourly' | 'negotiable';
  };
  location: {
    type: 'onsite' | 'remote' | 'hybrid';
    address?: string;
    coordinates?: { lat: number; lng: number };
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    duration?: string;
    flexibility: 'fixed' | 'flexible';
  };
  applications: {
    total: number;
    shortlisted: number;
    hired: number;
  };
  status: GigStatus;
}
```

**Gig Categories:**
- Fashion & Modeling
- Commercial & Advertising
- Editorial & Publishing
- Events & Promotions
- Digital & Social Media
- Fitness & Sports
- Beauty & Cosmetics

**Application Management:**
- Automatic screening
- Bulk shortlisting
- Communication tools
- Rating requirements
- Portfolio review

### 💼 Job Management

Long-term employment opportunities:

**Job Types:**
- **Full-time**: Permanent positions
- **Part-time**: Flexible hours
- **Contract**: Fixed-term employment
- **Freelance**: Project-based work
- **Internship**: Training positions

**Job Posting Features:**
```typescript
interface JobPosting {
  id: string;
  title: string;
  company: string;
  department?: string;
  type: JobType;
  experience: {
    minimum: number;
    preferred: number;
    required: string[];
  };
  compensation: {
    salary?: { min: number; max: number };
    hourly?: number;
    commission?: boolean;
    benefits: string[];
  };
  applications: {
    received: number;
    qualified: number;
    interviewed: number;
    offers: number;
  };
  workflow: {
    stages: ApplicationStage[];
    currentStage: number;
    autoReject: boolean;
  };
}
```

**Application Workflow:**
1. Initial application
2. Automatic screening
3. Manual review
4. Interview scheduling
5. Offer management
6. Onboarding

### 📅 Booking System

Comprehensive booking management:

**Booking Types:**
- **Instant Booking**: Pre-approved talent
- **Request Booking**: Requires approval
- **Recurring Booking**: Regular engagements
- **Bulk Booking**: Multiple resources

**Booking Management:**
```typescript
interface Booking {
  id: string;
  type: 'instant' | 'request' | 'recurring';
  resource: {
    type: 'talent' | 'venue' | 'equipment';
    id: string;
    name: string;
  };
  client: {
    id: string;
    name: string;
    verified: boolean;
  };
  schedule: {
    date: Date;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  pricing: {
    rate: number;
    duration: number;
    subtotal: number;
    commission: number;
    total: number;
  };
  status: BookingStatus;
  payment: PaymentStatus;
}
```

**Booking Features:**
- Calendar integration
- Availability management
- Conflict detection
- Automated reminders
- Cancellation policies

### 👥 Talent Pool Management

Manage your marketplace participants:

**Talent Profiles:**
- Professional portfolios
- Skill assessments
- Experience verification
- Performance metrics
- Availability calendar

**Talent Categories:**
```typescript
interface TalentProfile {
  id: string;
  category: string;
  specializations: string[];
  experience: {
    years: number;
    projects: number;
    clients: string[];
  };
  ratings: {
    overall: number;
    reliability: number;
    quality: number;
    communication: number;
  };
  verification: {
    identity: boolean;
    skills: boolean;
    background: boolean;
    insurance?: boolean;
  };
  availability: {
    status: 'available' | 'busy' | 'unavailable';
    calendar: AvailabilitySlot[];
    blackoutDates: Date[];
  };
}
```

**Talent Features:**
- Skill verification
- Background checks
- Performance tracking
- Ranking algorithms
- Featured profiles

### 💰 Transaction Management

Handle marketplace transactions:

**Transaction Types:**
- **Direct Payment**: Client to talent
- **Escrow Payment**: Held until completion
- **Milestone Payment**: Phased releases
- **Subscription Payment**: Recurring fees

**Commission Structure:**
```typescript
interface CommissionRule {
  type: 'percentage' | 'fixed' | 'tiered';
  base: number;
  tiers?: {
    threshold: number;
    rate: number;
  }[];
  categories: {
    [category: string]: number;
  };
  exceptions: {
    vip: number;
    volume: number;
    promotional: number;
  };
}
```

**Payment Processing:**
- Multiple payment gateways
- Currency conversion
- Tax calculation
- Invoice generation
- Payout scheduling

## Marketplace Operations

### Search & Discovery

Help users find opportunities:

**Search Features:**
- Full-text search
- Category filtering
- Location-based search
- Price range filters
- Availability matching

**Recommendation Engine:**
- Personalized suggestions
- Similar opportunities
- Trending gigs
- Popular categories
- Match scoring

### Application Management

Streamline the application process:

**Application Features:**
- One-click apply
- Saved applications
- Application templates
- Document attachments
- Video introductions

**Screening Tools:**
- Automatic filtering
- Skill matching
- Experience verification
- Portfolio review
- Reference checks

### Communication Hub

Facilitate marketplace interactions:

**Communication Channels:**
- In-app messaging
- Video calls
- Email notifications
- SMS alerts
- Push notifications

**Communication Features:**
- Message templates
- Automated responses
- Translation services
- File sharing
- Read receipts

## Analytics & Insights

### Marketplace Metrics

Track marketplace health:

**Key Performance Indicators:**
- Gross Merchandise Value (GMV)
- Active listings
- Conversion rates
- Average transaction value
- User engagement

**Operational Metrics:**
- Time to hire
- Application rates
- Completion rates
- Dispute rates
- User satisfaction

### Revenue Analytics

Monitor financial performance:

```typescript
interface RevenueAnalytics {
  period: string;
  revenue: {
    gross: number;
    commissions: number;
    fees: number;
    net: number;
  };
  transactions: {
    count: number;
    average: number;
    median: number;
  };
  growth: {
    revenue: number;
    users: number;
    listings: number;
  };
  forecast: {
    nextMonth: number;
    nextQuarter: number;
    confidence: number;
  };
}
```

### Performance Reports

Detailed performance analysis:

- **Gig Performance**: Success rates, time to fill
- **Talent Performance**: Ratings, repeat bookings
- **Category Analysis**: Popular categories, trends
- **Geographic Analysis**: Location-based insights
- **Seasonal Trends**: Peak periods, planning

## Automation Features

### Workflow Automation

Streamline operations:

**Automated Workflows:**
- Application screening
- Interview scheduling
- Contract generation
- Payment processing
- Review requests

**Trigger Events:**
- Time-based triggers
- Status changes
- Milestone completion
- User actions
- System events

### Smart Matching

AI-powered matching:

**Matching Criteria:**
- Skill alignment
- Experience level
- Location proximity
- Availability match
- Budget compatibility

**Match Scoring:**
```typescript
interface MatchScore {
  overall: number;
  components: {
    skills: number;
    experience: number;
    location: number;
    availability: number;
    budget: number;
    reviews: number;
  };
  confidence: number;
  explanation: string[];
}
```

## Best Practices

1. **Clear Descriptions**: Provide detailed gig/job descriptions
2. **Fair Pricing**: Research market rates
3. **Quick Response**: Respond to applications promptly
4. **Quality Control**: Maintain high standards
5. **Feedback Culture**: Encourage reviews

## Integration Options

### External Services

- **Calendar Systems**: Google Calendar, Outlook
- **Payment Processors**: Stripe, PayPal, Square
- **Background Checks**: Checkr, Sterling
- **Video Platforms**: Zoom, Google Meet
- **Accounting Software**: QuickBooks, Xero

### API Endpoints

```typescript
// Gig Management
GET /api/v1/tenant/gigs
POST /api/v1/tenant/gigs
PUT /api/v1/tenant/gigs/{id}
DELETE /api/v1/tenant/gigs/{id}

// Job Management
GET /api/v1/tenant/jobs
POST /api/v1/tenant/jobs
GET /api/v1/tenant/jobs/{id}/applications

// Booking Management
GET /api/v1/tenant/bookings
POST /api/v1/tenant/bookings
PUT /api/v1/tenant/bookings/{id}/status

// Transaction Processing
POST /api/v1/tenant/transactions
GET /api/v1/tenant/transactions/{id}
POST /api/v1/tenant/transactions/{id}/refund
```

## Related Documentation

- [Marketplace Setup Guide](/guides/marketplace-setup)
- [Payment Processing](/tenant/payments)
- [Talent Management](/tenant/talent)
- [Analytics Dashboard](/tenant/analytics)