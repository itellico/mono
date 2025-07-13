---
title: Data Models
sidebar_label: Data Models
---

# Data Models Architecture

The data architecture of itellico Mono is designed for multi-tenancy, scalability, and flexibility. Built on PostgreSQL with Prisma ORM, it provides strong typing, efficient queries, and robust data integrity.

## Overview

Data architecture principles:

- **Multi-Tenant Isolation**: Complete data separation
- **Flexible Schema**: Extensible for different industries
- **Performance Optimized**: Efficient indexing and caching
- **Type Safety**: Full TypeScript integration
- **Audit Trail**: Complete change tracking

## Core Data Model

### Multi-Tenant Structure

```typescript
// Base entity that all tenant-scoped models extend
interface TenantScoped {
  tenantId: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date; // Soft delete
}

// Tenant model - top level
model Tenant {
  id          Int      @id @default(autoincrement())
  identifier  String   @unique // URL-safe identifier
  name        String
  status      TenantStatus
  
  // Subscription
  plan        String
  planExpiry  DateTime?
  
  // Configuration
  settings    Json
  features    String[]
  
  // Relationships
  accounts    Account[]
  users       User[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([status])
  @@index([planExpiry])
}

enum TenantStatus {
  ACTIVE
  TRIAL
  SUSPENDED
  INACTIVE
}
```

### User & Authentication

```typescript
model User {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  email       String   
  username    String?
  
  // Authentication
  hashedPassword String?
  emailVerified  Boolean @default(false)
  twoFactorEnabled Boolean @default(false)
  
  // Profile
  profile     UserProfile?
  
  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  accounts    AccountUser[]
  sessions    Session[]
  
  // Permissions
  roles       UserRole[]
  permissions UserPermission[]
  
  // Activity
  lastLoginAt DateTime?
  loginCount  Int      @default(0)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  
  @@unique([tenantId, email])
  @@unique([tenantId, username])
  @@index([tenantId])
  @@index([email])
}

model UserProfile {
  id          Int      @id @default(autoincrement())
  userId      Int      @unique
  
  // Basic Info
  displayName String
  bio         String?
  avatar      String?
  coverImage  String?
  
  // Contact
  phone       String?
  website     String?
  location    String?
  
  // Professional
  title       String?
  company     String?
  experience  Json?    // Structured experience data
  skills      String[]
  
  // Social
  socialLinks Json?
  
  // Relationships
  user        User     @relation(fields: [userId], references: [id])
  
  // Metadata
  completeness Int     @default(0) // Profile completion percentage
  updatedAt   DateTime @updatedAt
}
```

### Account Structure

```typescript
model Account {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  identifier  String   // URL-safe identifier
  name        String
  type        AccountType
  
  // Business Info
  businessInfo Json?   // Company details, tax info, etc.
  
  // Features
  features    String[] // Enabled features
  limits      Json     // Resource limits
  
  // Billing
  billingInfo Json?
  subscription AccountSubscription?
  
  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  users       AccountUser[]
  
  // Status
  status      AccountStatus @default(ACTIVE)
  verifiedAt  DateTime?
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  
  @@unique([tenantId, identifier])
  @@index([tenantId])
  @@index([status])
}

enum AccountType {
  INDIVIDUAL
  AGENCY
  VENDOR
  CLIENT
}

enum AccountStatus {
  PENDING
  ACTIVE
  SUSPENDED
  INACTIVE
}

// Many-to-many relationship
model AccountUser {
  accountId   Int
  userId      Int
  role        String   // admin, member, viewer
  
  // Relationships
  account     Account  @relation(fields: [accountId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  
  // Metadata
  joinedAt    DateTime @default(now())
  invitedBy   Int?
  
  @@id([accountId, userId])
  @@index([userId])
}
```

### Content & Media

```typescript
model Content {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  accountId   Int
  userId      Int
  
  // Content Info
  type        ContentType
  title       String
  slug        String
  description String?
  body        String?  // Rich text content
  
  // Media
  featuredImage String?
  media       MediaFile[]
  
  // SEO
  metaTitle   String?
  metaDescription String?
  keywords    String[]
  
  // Publishing
  status      ContentStatus @default(DRAFT)
  publishedAt DateTime?
  expiresAt   DateTime?
  
  // Categorization
  categories  ContentCategory[]
  tags        String[]
  
  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  account     Account  @relation(fields: [accountId], references: [id])
  author      User     @relation(fields: [userId], references: [id])
  
  // Engagement
  views       Int      @default(0)
  likes       Int      @default(0)
  shares      Int      @default(0)
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  
  @@unique([tenantId, slug])
  @@index([tenantId, accountId])
  @@index([tenantId, status])
  @@index([publishedAt])
}

enum ContentType {
  ARTICLE
  PORTFOLIO
  LISTING
  PAGE
  FORM
}

enum ContentStatus {
  DRAFT
  IN_REVIEW
  APPROVED
  PUBLISHED
  ARCHIVED
}

model MediaFile {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  uploaderId  Int
  
  // File Info
  filename    String
  mimetype    String
  size        Int      // bytes
  url         String
  thumbnailUrl String?
  
  // Metadata
  title       String?
  alt         String?
  caption     String?
  metadata    Json?    // EXIF, dimensions, duration, etc.
  
  // Organization
  folder      String?
  tags        String[]
  
  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  uploader    User     @relation(fields: [uploaderId], references: [id])
  
  // Usage
  usageCount  Int      @default(0)
  lastUsedAt  DateTime?
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([tenantId])
  @@index([uploaderId])
  @@index([folder])
}
```

### Marketplace Models

```typescript
model Listing {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  accountId   Int
  userId      Int
  
  // Listing Info
  type        ListingType
  title       String
  description String
  
  // Pricing
  price       Decimal?
  priceType   PriceType
  currency    String   @default("USD")
  
  // Location
  location    Json?    // Structured location data
  remote      Boolean  @default(false)
  
  // Schedule
  startDate   DateTime?
  endDate     DateTime?
  duration    String?
  
  // Requirements
  requirements Json?
  
  // Applications
  applications Application[]
  applicationCount Int @default(0)
  
  // Status
  status      ListingStatus @default(DRAFT)
  featuredAt  DateTime?
  expiresAt   DateTime?
  
  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  account     Account  @relation(fields: [accountId], references: [id])
  creator     User     @relation(fields: [userId], references: [id])
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  deletedAt   DateTime?
  
  @@index([tenantId, status])
  @@index([tenantId, type])
  @@index([featuredAt])
}

enum ListingType {
  GIG
  JOB
  SERVICE
  PRODUCT
}

enum PriceType {
  FIXED
  HOURLY
  DAILY
  PROJECT
  NEGOTIABLE
}

enum ListingStatus {
  DRAFT
  ACTIVE
  PAUSED
  EXPIRED
  COMPLETED
  CANCELLED
}

model Application {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  listingId   Int
  applicantId Int
  
  // Application Content
  coverLetter String?
  attachments String[]
  answers     Json?    // Structured Q&A
  
  // Status
  status      ApplicationStatus @default(PENDING)
  reviewedAt  DateTime?
  reviewedBy  Int?
  
  // Communication
  messages    Message[]
  
  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  listing     Listing  @relation(fields: [listingId], references: [id])
  applicant   User     @relation(fields: [applicantId], references: [id])
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([listingId, applicantId])
  @@index([tenantId])
  @@index([status])
}

enum ApplicationStatus {
  PENDING
  REVIEWING
  SHORTLISTED
  ACCEPTED
  REJECTED
  WITHDRAWN
}
```

### Booking & Calendar

```typescript
model Booking {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  resourceId  Int      // User or Resource being booked
  clientId    Int
  
  // Booking Details
  title       String
  description String?
  type        BookingType
  
  // Schedule
  startTime   DateTime
  endTime     DateTime
  timezone    String
  recurrence  Json?    // Recurrence rules
  
  // Location
  location    String?
  meetingUrl  String?
  
  // Pricing
  price       Decimal?
  paid        Boolean  @default(false)
  
  // Status
  status      BookingStatus @default(PENDING)
  confirmedAt DateTime?
  
  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  resource    User     @relation(fields: [resourceId], references: [id], name: "resource")
  client      User     @relation(fields: [clientId], references: [id], name: "client")
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  cancelledAt DateTime?
  
  @@index([tenantId])
  @@index([resourceId, startTime])
  @@index([status])
}

enum BookingType {
  APPOINTMENT
  SERVICE
  CONSULTATION
  EVENT
}

enum BookingStatus {
  PENDING
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  CANCELLED
  NO_SHOW
}

model Availability {
  id          Int      @id @default(autoincrement())
  userId      Int
  
  // Availability Window
  dayOfWeek   Int?     // 0-6, null for specific dates
  date        DateTime? // Specific date override
  startTime   String   // HH:MM format
  endTime     String   // HH:MM format
  timezone    String
  
  // Type
  available   Boolean  @default(true) // true = available, false = blocked
  recurring   Boolean  @default(true)
  
  // Relationships
  user        User     @relation(fields: [userId], references: [id])
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([userId])
  @@index([date])
}
```

### Permissions & RBAC

```typescript
model Role {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  name        String
  description String?
  
  // Role Type
  type        RoleType @default(CUSTOM)
  level       RoleLevel
  
  // Permissions
  permissions Permission[]
  
  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  users       UserRole[]
  
  // Metadata
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@unique([tenantId, name])
  @@index([tenantId])
}

enum RoleType {
  SYSTEM    // Platform-defined
  TENANT    // Tenant-defined
  CUSTOM    // User-created
}

enum RoleLevel {
  PLATFORM
  TENANT
  ACCOUNT
  USER
}

model Permission {
  id          Int      @id @default(autoincrement())
  name        String   @unique // tier.resource.action
  description String?
  
  // Relationships
  roles       Role[]
  users       UserPermission[]
  
  // Metadata
  createdAt   DateTime @default(now())
}

// Many-to-many relationships
model UserRole {
  userId      Int
  roleId      Int
  
  // Scope
  accountId   Int?     // If scoped to specific account
  
  // Relationships
  user        User     @relation(fields: [userId], references: [id])
  role        Role     @relation(fields: [roleId], references: [id])
  
  // Metadata
  assignedAt  DateTime @default(now())
  assignedBy  Int?
  expiresAt   DateTime?
  
  @@id([userId, roleId])
  @@index([userId])
}

model UserPermission {
  userId      Int
  permissionId Int
  
  // Grant type
  granted     Boolean  @default(true) // Can be used to explicitly deny
  
  // Scope
  accountId   Int?     // If scoped to specific account
  
  // Relationships
  user        User     @relation(fields: [userId], references: [id])
  permission  Permission @relation(fields: [permissionId], references: [id])
  
  // Metadata
  assignedAt  DateTime @default(now())
  assignedBy  Int?
  expiresAt   DateTime?
  
  @@id([userId, permissionId])
  @@index([userId])
}
```

### Audit & Activity

```typescript
model AuditLog {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  userId      Int?
  
  // Event Info
  action      String   // create, update, delete, etc.
  resource    String   // Model name
  resourceId  String   // ID of affected resource
  
  // Changes
  oldValues   Json?
  newValues   Json?
  
  // Context
  ipAddress   String?
  userAgent   String?
  requestId   String?
  
  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  user        User?    @relation(fields: [userId], references: [id])
  
  // Metadata
  createdAt   DateTime @default(now())
  
  @@index([tenantId])
  @@index([userId])
  @@index([resource, resourceId])
  @@index([createdAt])
}

model Activity {
  id          Int      @id @default(autoincrement())
  tenantId    Int
  userId      Int
  
  // Activity Info
  type        String   // view, like, share, comment, etc.
  target      String   // Model name
  targetId    String   // ID of target
  
  // Additional Data
  metadata    Json?
  
  // Relationships
  tenant      Tenant   @relation(fields: [tenantId], references: [id])
  user        User     @relation(fields: [userId], references: [id])
  
  // Metadata
  createdAt   DateTime @default(now())
  
  @@index([tenantId, userId])
  @@index([target, targetId])
  @@index([createdAt])
}
```

## Database Optimization

### Indexes

Strategic indexing for performance:

```sql
-- Multi-column indexes for common queries
CREATE INDEX idx_content_tenant_status_published 
  ON "Content" ("tenantId", "status", "publishedAt");

CREATE INDEX idx_listing_tenant_type_status 
  ON "Listing" ("tenantId", "type", "status");

CREATE INDEX idx_booking_resource_time 
  ON "Booking" ("resourceId", "startTime", "endTime");

-- Full-text search indexes
CREATE INDEX idx_content_search 
  ON "Content" USING gin(to_tsvector('english', title || ' ' || description));

CREATE INDEX idx_listing_search 
  ON "Listing" USING gin(to_tsvector('english', title || ' ' || description));
```

### Partitioning

For large tables:

```sql
-- Partition audit logs by month
CREATE TABLE "AuditLog" (
  -- columns
) PARTITION BY RANGE (createdAt);

CREATE TABLE "AuditLog_2024_01" 
  PARTITION OF "AuditLog" 
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Views

Common query patterns:

```sql
-- Active users with profile completion
CREATE VIEW "UserWithProfile" AS
SELECT 
  u.*,
  p.displayName,
  p.avatar,
  p.completeness
FROM "User" u
LEFT JOIN "UserProfile" p ON u.id = p.userId
WHERE u.deletedAt IS NULL;

-- Listing with application count
CREATE VIEW "ListingWithStats" AS
SELECT 
  l.*,
  COUNT(a.id) as applicationCount,
  MAX(a.createdAt) as lastApplicationAt
FROM "Listing" l
LEFT JOIN "Application" a ON l.id = a.listingId
GROUP BY l.id;
```

## Data Integrity

### Constraints

Business rule enforcement:

```sql
-- Ensure valid date ranges
ALTER TABLE "Booking" 
  ADD CONSTRAINT check_booking_dates 
  CHECK (endTime > startTime);

ALTER TABLE "Listing" 
  ADD CONSTRAINT check_listing_dates 
  CHECK (endDate IS NULL OR endDate > startDate);

-- Ensure positive values
ALTER TABLE "MediaFile" 
  ADD CONSTRAINT check_file_size 
  CHECK (size > 0);
```

### Triggers

Automated data management:

```sql
-- Update listing application count
CREATE FUNCTION update_application_count() RETURNS TRIGGER AS $$
BEGIN
  UPDATE "Listing" 
  SET applicationCount = (
    SELECT COUNT(*) FROM "Application" 
    WHERE listingId = NEW.listingId
  )
  WHERE id = NEW.listingId;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_count_trigger
AFTER INSERT OR DELETE ON "Application"
FOR EACH ROW EXECUTE FUNCTION update_application_count();
```

## Migration Strategy

### Schema Evolution

Safe schema changes:

```typescript
// Prisma migration example
// 1. Add nullable column
model User {
  // existing fields
  newFeature String? // Step 1: Add as nullable
}

// 2. Backfill data
await prisma.$executeRaw`
  UPDATE "User" 
  SET newFeature = 'default_value' 
  WHERE newFeature IS NULL
`;

// 3. Make non-nullable in next migration
model User {
  // existing fields  
  newFeature String // Step 3: Remove nullable
}
```

### Data Migration

Moving between schemas:

```typescript
// Safe data migration pattern
async function migrateData() {
  const batchSize = 1000;
  let offset = 0;
  
  while (true) {
    const records = await oldDb.query({
      take: batchSize,
      skip: offset,
    });
    
    if (records.length === 0) break;
    
    // Transform and insert
    const transformed = records.map(transform);
    await newDb.createMany({ data: transformed });
    
    offset += batchSize;
  }
}
```

## Best Practices

1. **Always use transactions** for multi-table operations
2. **Implement soft deletes** for audit trail
3. **Use UUIDs** for public-facing IDs
4. **Add indexes** for foreign keys and common queries
5. **Normalize carefully** - denormalize for performance when needed
6. **Version your schema** with migration tools
7. **Monitor query performance** with EXPLAIN ANALYZE
8. **Regular maintenance** - VACUUM, ANALYZE, REINDEX

## Related Documentation

- [API Design](/architecture/api-design)
- [Security Architecture](/architecture/security)
- [Performance Optimization](/architecture/performance)
- [Database Administration](/guides/database)