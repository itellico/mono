# itellico Mono: Multi-Tenant Use Cases & Implementation

## Real-World Scenarios

### Scenario 1: Children's Modeling Agency

**Tenant Configuration:**
```typescript
{
  tenant: {
    name: "Little Stars Agency",
    industryType: "modeling",
    subscriptionTier: "professional",
    moduleConfig: {
      enabled: ["profiles", "portfolios", "bookings", "guardian_management"]
    }
  }
}
```

**Dynamic Schema for Child Model Profile:**
```json
{
  "entityType": "profile",
  "entitySubtype": "child_model",
  "baseSchema": {
    "childInfo": {
      "firstName": { "type": "string", "required": true },
      "lastName": { "type": "string", "required": true },
      "dateOfBirth": { "type": "date", "required": true },
      "gender": { "type": "select", "options": ["male", "female", "other"] }
    },
    "physical": {
      "height": { "type": "number", "unit": "cm" },
      "weight": { "type": "number", "unit": "kg" },
      "hairColor": { "type": "optionSet", "optionSetId": "hair_colors" },
      "eyeColor": { "type": "optionSet", "optionSetId": "eye_colors" },
      "shoeSize": { "type": "optionSet", "optionSetId": "child_shoe_sizes" }
    },
    "guardian": {
      "primaryGuardian": { "type": "relation", "entity": "user", "required": true },
      "emergencyContact": { "type": "phone", "required": true }
    },
    "compliance": {
      "workPermit": { "type": "file", "required": true },
      "schoolSchedule": { "type": "text" },
      "restrictions": { "type": "multiselect", "options": ["no_swimwear", "no_travel", "weekends_only"] }
    }
  }
}
```

**Account Structure Example:**
```
Account: "Johnson Family"
├── User: "Sarah Johnson" (Mother, Account Owner)
│   ├── Profile: "Emma Johnson" (Child Model, Age 8)
│   └── Profile: "Jake Johnson" (Child Model, Age 10)
└── User: "Mike Johnson" (Father, Viewer)
```

### Scenario 2: Fitness Model Platform

**Tenant Configuration:**
```typescript
{
  tenant: {
    name: "FitPro Models",
    industryType: "modeling",
    subscriptionTier: "enterprise",
    moduleConfig: {
      enabled: ["profiles", "portfolios", "measurements", "competitions", "social_media", "booking_calendar"]
    }
  }
}
```

**Dynamic Schema for Fitness Model:**
```json
{
  "entityType": "profile",
  "entitySubtype": "fitness_model",
  "baseSchema": {
    "personalInfo": {
      "stageName": { "type": "string", "required": true },
      "realName": { "type": "string", "privacy": "private" },
      "dateOfBirth": { "type": "date", "required": true }
    },
    "measurements": {
      "height": { "type": "number", "unit": "cm", "required": true },
      "weight": { "type": "number", "unit": "kg", "required": true },
      "bodyFat": { "type": "number", "unit": "percentage" },
      "chest": { "type": "number", "unit": "cm" },
      "waist": { "type": "number", "unit": "cm" },
      "hips": { "type": "number", "unit": "cm" },
      "biceps": { "type": "number", "unit": "cm" },
      "measurementDate": { "type": "date", "auto": "last_modified" }
    },
    "expertise": {
      "specialties": { 
        "type": "multiselect", 
        "options": ["bodybuilding", "crossfit", "yoga", "pilates", "martial_arts", "dance"]
      },
      "certifications": { "type": "array", "schema": { "name": "string", "issuer": "string", "date": "date" }},
      "competitions": { "type": "array", "schema": { "name": "string", "placement": "string", "year": "number" }}
    },
    "media": {
      "profilePhotos": { "type": "media", "accept": "image/*", "min": 5, "max": 20 },
      "videos": { "type": "media", "accept": "video/*", "max": 5 },
      "transformationPhotos": { "type": "media", "accept": "image/*", "layout": "before_after" }
    }
  }
}
```

### Scenario 3: Pet Model Agency

**Tenant Configuration:**
```typescript
{
  tenant: {
    name: "Paw Stars Agency",
    industryType: "pets",
    subscriptionTier: "starter",
    moduleConfig: {
      enabled: ["profiles", "portfolios", "vet_records", "bookings", "pet_handler_management"]
    }
  }
}
```

**Dynamic Schema for Pet Model:**
```json
{
  "entityType": "profile",
  "entitySubtype": "pet_model",
  "baseSchema": {
    "petInfo": {
      "name": { "type": "string", "required": true },
      "species": { "type": "select", "options": ["dog", "cat", "bird", "rabbit", "other"], "required": true },
      "breed": { "type": "optionSet", "optionSetId": "pet_breeds", "dependsOn": "species" },
      "age": { "type": "number", "unit": "years" },
      "gender": { "type": "select", "options": ["male", "female"] },
      "neutered": { "type": "boolean" }
    },
    "appearance": {
      "color": { "type": "multiselect", "optionSetId": "pet_colors" },
      "size": { "type": "select", "options": ["tiny", "small", "medium", "large", "giant"] },
      "weight": { "type": "number", "unit": "kg" },
      "distinctiveFeatures": { "type": "text" }
    },
    "behavior": {
      "temperament": { "type": "multiselect", "options": ["friendly", "calm", "energetic", "trained"] },
      "skills": { "type": "multiselect", "options": ["sit", "stay", "fetch", "tricks", "agility"] },
      "goodWith": { "type": "multiselect", "options": ["children", "other_pets", "strangers"] }
    },
    "health": {
      "vetRecords": { "type": "file", "multiple": true },
      "vaccinations": { "type": "array", "schema": { "vaccine": "string", "date": "date" }},
      "insurance": { "type": "boolean" },
      "dietaryRestrictions": { "type": "text" }
    }
  }
}
```

### Scenario 4: Freelancer Platform

**Tenant Configuration:**
```typescript
{
  tenant: {
    name: "CreativeHub",
    industryType: "freelance",
    subscriptionTier: "professional",
    moduleConfig: {
      enabled: ["profiles", "portfolios", "services", "availability", "invoicing", "reviews"]
    }
  }
}
```

**Dynamic Schema for Freelancer:**
```json
{
  "entityType": "profile",
  "entitySubtype": "freelancer",
  "baseSchema": {
    "professional": {
      "displayName": { "type": "string", "required": true },
      "title": { "type": "string", "required": true },
      "yearsExperience": { "type": "number" },
      "hourlyRate": { "type": "money", "currency": "EUR", "required": true },
      "availability": { "type": "select", "options": ["full_time", "part_time", "project_based"] }
    },
    "skills": {
      "primarySkills": { "type": "multiselect", "optionSetId": "freelance_skills", "max": 5 },
      "secondarySkills": { "type": "multiselect", "optionSetId": "freelance_skills", "max": 10 },
      "tools": { "type": "multiselect", "optionSetId": "software_tools" },
      "languages": { "type": "multiselect", "optionSetId": "languages" }
    },
    "portfolio": {
      "projects": { 
        "type": "array", 
        "schema": {
          "title": "string",
          "description": "text",
          "url": "url",
          "images": "media",
          "client": "string",
          "year": "number"
        }
      }
    }
  }
}
```

## Implementation Examples

### 1. Creating a Profile with Dynamic Schema

```typescript
// API endpoint: POST /api/profiles
async function createProfile(req: Request) {
  const { profileType, profileSubtype, data } = req.body;
  const tenantId = req.session.tenantId;
  
  // 1. Fetch the schema for this profile type
  const schema = await getEntitySchema({
    tenantId,
    entityType: 'profile',
    entitySubtype: profileSubtype
  });
  
  // 2. Validate the data against the schema
  const validationResult = await validateAgainstSchema(data, schema);
  if (!validationResult.success) {
    return { error: validationResult.errors };
  }
  
  // 3. Apply tenant-specific transformations
  const transformedData = await applyTenantTransformations(data, schema, tenantId);
  
  // 4. Store in database
  const profile = await prisma.profile.create({
    data: {
      accountId: req.session.accountId,
      profileType,
      profileSubtype,
      structuredData: transformedData,
      searchVector: generateSearchVector(transformedData),
      status: 'pending' // Requires approval
    }
  });
  
  // 5. Trigger post-creation workflows
  await triggerWorkflow('profile_created', { profileId: profile.id });
  
  return { success: true, profile };
}
```

### 2. Dynamic Form Generation

```typescript
// React component for dynamic forms
function DynamicProfileForm({ profileType, profileSubtype }) {
  const { schema, loading } = useEntitySchema(profileType, profileSubtype);
  const { register, handleSubmit, watch, formState } = useForm({
    resolver: zodResolver(generateZodSchema(schema))
  });
  
  if (loading) return <Skeleton />;
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {schema.sections.map(section => (
        <FormSection key={section.id} title={section.title}>
          {section.fields.map(field => (
            <DynamicField
              key={field.name}
              field={field}
              register={register}
              watch={watch}
              errors={formState.errors}
            />
          ))}
        </FormSection>
      ))}
    </form>
  );
}
```

### 3. Subscription-Based Feature Access

```typescript
// Middleware to check feature access
async function checkFeatureAccess(feature: string, tenantId: string) {
  // 1. Get tenant's subscription
  const subscription = await getTenantSubscription(tenantId);
  
  // 2. Check if feature is included in plan
  const hasAccess = await prisma.featureAccess.findFirst({
    where: {
      planId: subscription.planId,
      featureKey: feature,
      enabled: true
    }
  });
  
  // 3. Check for tenant-specific overrides
  const override = await prisma.featureOverride.findFirst({
    where: {
      tenantId,
      featureKey: feature
    }
  });
  
  // 4. Check usage limits
  if (hasAccess?.hasLimit) {
    const usage = await checkUsageLimit(tenantId, feature);
    if (usage.exceeded) {
      return { allowed: false, reason: 'limit_exceeded', limit: usage.limit };
    }
  }
  
  return { allowed: hasAccess || override?.enabled, feature };
}
```

### 4. Search Across Dynamic Schemas

```typescript
// Advanced search implementation
async function searchProfiles(filters: any, tenantId: string) {
  // Build dynamic query based on schema
  const query = prisma.$queryRaw`
    SELECT 
      p.*,
      ts_rank(p.search_vector, plainto_tsquery('english', ${filters.search})) as rank
    FROM profiles p
    WHERE 
      p.tenant_id = ${tenantId}
      AND p.search_vector @@ plainto_tsquery('english', ${filters.search})
      ${filters.profileType ? Prisma.sql`AND p.profile_type = ${filters.profileType}` : Prisma.empty}
      ${filters.category ? Prisma.sql`AND p.structured_data->>'category' = ${filters.category}` : Prisma.empty}
    ORDER BY rank DESC
    LIMIT 20
  `;
  
  return query;
}
```

## Key Benefits of This Architecture

1. **Flexibility**: Each tenant can have completely different data models
2. **Scalability**: Shared database reduces operational overhead
3. **Maintainability**: Schema changes don't require code deployments
4. **Performance**: JSONB with proper indexing provides fast queries
5. **Security**: Row-level security ensures data isolation
6. **Customization**: Tenants can add custom fields without affecting others

This architecture supports your vision of a platform where:
- A modeling agency can manage child models with guardian information
- A fitness platform can track detailed measurements and certifications  
- A pet agency can manage animal profiles with health records
- A freelancer platform can showcase portfolios and skills

All within the same codebase and database infrastructure!