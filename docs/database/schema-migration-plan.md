# Database Schema Migration Plan
**Project**: itellico Mono Platform  
**Date**: 2024-12-11  
**Migration**: Naming Convention & RBAC Enhancement  
**Impact**: BREAKING CHANGE - Requires application-wide updates

## 🎯 Migration Overview

### **Objectives**
1. **Standardize naming conventions** to snake_case for all tables and columns
2. **Enhance RBAC schema** with NestJS best practices
3. **Improve data integrity** with proper constraints and indexes
4. **Add missing functionality** for comprehensive permission management

### **Scope**
- **42 tables** to rename from PascalCase to snake_case
- **~200+ columns** to rename from camelCase to snake_case
- **RBAC system** complete redesign with enhanced features
- **Database constraints** and performance optimizations

## 📋 Pre-Migration Checklist

### **Environment Preparation**
- [ ] ✅ Complete database backup created
- [ ] Development environment set up for testing
- [ ] Staging environment prepared for validation
- [ ] Maintenance window scheduled (4-6 hours)
- [ ] Rollback plan documented and tested

### **Code Preparation**
- [ ] All team members notified of breaking changes
- [ ] Feature freeze implemented during migration
- [ ] Code review completed for migration scripts
- [ ] Application code updates prepared (see Code Update Plan)

### **Testing Preparation**
- [ ] Migration scripts tested in development
- [ ] Performance benchmarks established
- [ ] Data integrity validation scripts prepared
- [ ] Automated test suite updated for new schema

## 🗺️ Migration Phases

### **Phase 1: Table Renaming (30 minutes)**
```sql
-- Execute: scripts/migrations/09-normalize-table-naming.sql
```

**Changes:**
- Rename 42 PascalCase tables to snake_case
- Rename camelCase columns to snake_case across all tables
- Create compatibility views for smooth transition
- Update sequences and constraints

**Critical Tables:**
```
Account → accounts
User → users  
Permission → permissions
Role → roles
Tenant → tenants
```

### **Phase 2: RBAC Enhancement (45 minutes)**
```sql
-- Execute: scripts/migrations/10-enhance-rbac-schema.sql
```

**Changes:**
- Add missing RBAC fields (module, context, condition, metadata)
- Create proper enums for type safety
- Add foreign key constraints and data integrity checks
- Create optimized indexes for Guard performance
- Add helper functions for NestJS integration

### **Phase 3: Data Migration (15 minutes)**
```sql
-- Execute: scripts/migrations/11-migrate-existing-data.sql
```

**Changes:**
- Migrate existing permission data to new format
- Update role assignments and inheritance
- Populate system permissions and roles
- Validate data integrity

### **Phase 4: Application Updates (60 minutes)**
```bash
# Execute after database migration
```

**Changes:**
- Update Prisma schema.prisma
- Regenerate Prisma client
- Update TypeScript models
- Deploy updated application code

## 💻 Code Update Plan

### **1. Prisma Schema Updates**

**Before (PascalCase):**
```prisma
model User {
  id        Int      @id @default(autoincrement())
  firstName String
  lastName  String  
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  
  @@map("User")
}
```

**After (snake_case with mappings):**
```prisma
model User {
  uuid       String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  id         Int      @unique @default(autoincrement())
  first_name String   @map("first_name")
  last_name  String   @map("last_name")
  is_active  Boolean  @default(true) @map("is_active")
  created_at DateTime @default(now()) @map("created_at") @db.Timestamptz(6)
  updated_at DateTime @updatedAt @map("updated_at") @db.Timestamptz(6)
  
  @@map("users")
}
```

### **2. TypeScript Interface Updates**

**Before:**
```typescript
interface User {
  id: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
}
```

**After:**
```typescript
interface User {
  uuid: string;
  id: number;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

// For API responses (camelCase)
interface UserResponse {
  uuid: string;
  id: number;
  firstName: string;
  lastName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### **3. NestJS Service Updates**

**Enhanced RBAC Service:**
```typescript
@Injectable()
export class RbacService {
  constructor(private prisma: PrismaService) {}

  async getUserPermissions(userId: number, tenantId?: number): Promise<Permission[]> {
    // Use new helper function
    return this.prisma.$queryRaw`
      SELECT * FROM get_user_permissions(${userId}, ${tenantId})
    `;
  }

  async hasPermission(userId: number, permission: string, tenantId?: number): Promise<boolean> {
    const result = await this.prisma.$queryRaw`
      SELECT user_has_permission(${userId}, ${permission}, ${tenantId}) as has_permission
    `;
    return result[0]?.has_permission || false;
  }
}
```

### **4. Guard Updates**

**Enhanced Permission Guard:**
```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rbacService: RbacService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const tenantId = request.tenantId;

    for (const permission of requiredPermissions) {
      const hasPermission = await this.rbacService.hasPermission(
        user.id, 
        permission, 
        tenantId
      );
      if (!hasPermission) return false;
    }

    return true;
  }
}
```

### **5. API Endpoint Updates**

**Update all endpoints to handle new field names:**
```typescript
// Before
@Get('users')
async getUsers(): Promise<UserResponse[]> {
  const users = await this.prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      isActive: true,
      createdAt: true
    }
  });
  
  return users;
}

// After
@Get('users')
async getUsers(): Promise<UserResponse[]> {
  const users = await this.prisma.users.findMany({
    select: {
      uuid: true,
      id: true,
      first_name: true,
      last_name: true,
      is_active: true,
      created_at: true,
      updated_at: true
    }
  });
  
  // Transform to camelCase for API response
  return users.map(user => ({
    uuid: user.uuid,
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at
  }));
}
```

## ⚠️ Risk Assessment & Mitigation

### **High Risks**
1. **Data Loss**: Complete backup and tested rollback procedures
2. **Application Downtime**: Staged deployment with compatibility views
3. **Foreign Key Violations**: Comprehensive constraint validation
4. **Performance Degradation**: Optimized indexes and query analysis

### **Medium Risks**
1. **API Response Changes**: Gradual field mapping and documentation
2. **Frontend Compatibility**: Coordinate with frontend team
3. **Third-party Integrations**: Update external API consumers

### **Mitigation Strategies**
1. **Compatibility Views**: Temporary views with old table names
2. **Staged Rollout**: Development → Staging → Production
3. **Real-time Monitoring**: Database performance and error tracking
4. **Quick Rollback**: Automated rollback scripts ready

## 🧪 Testing Strategy

### **Database Testing**
```sql
-- Test data integrity
SELECT COUNT(*) FROM users WHERE uuid IS NULL;
SELECT COUNT(*) FROM permissions WHERE name IS NULL;

-- Test foreign key constraints
SELECT COUNT(*) FROM user_roles ur 
LEFT JOIN users u ON u.id = ur.user_id 
WHERE u.id IS NULL;

-- Test performance
EXPLAIN ANALYZE SELECT * FROM get_user_permissions(1, 123);
```

### **Application Testing**
```bash
# API endpoint testing
curl -X GET "http://localhost:3001/api/users" | jq .

# Permission testing
curl -X POST "http://localhost:3001/api/test-permission" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"permission": "users.read"}'

# Integration testing
npm run test:e2e
```

### **Performance Testing**
```sql
-- Before migration benchmarks
\timing on
SELECT * FROM get_user_permissions(1, 123);

-- After migration validation
SELECT * FROM get_user_permissions(1, 123);
```

## 📊 Success Criteria

### **Database Layer**
- [ ] All tables follow snake_case naming convention
- [ ] All columns follow snake_case naming convention
- [ ] RBAC system supports full NestJS Guard functionality
- [ ] All foreign key constraints are valid
- [ ] Performance is maintained or improved

### **Application Layer**
- [ ] All API endpoints return correct data
- [ ] NestJS Guards work with new permission system
- [ ] Prisma client generates without errors
- [ ] All tests pass with new schema

### **User Experience**
- [ ] No functionality regression
- [ ] API responses maintain expected format
- [ ] Performance meets baseline requirements
- [ ] Error handling works correctly

## 🚀 Deployment Procedure

### **Development Environment**
1. Execute migration scripts in order
2. Update Prisma schema and regenerate client
3. Update application code
4. Run comprehensive test suite
5. Validate API endpoints and Guards

### **Staging Environment**
1. Deploy database migrations
2. Deploy application updates
3. Run automated test suite
4. Perform manual testing
5. Validate performance benchmarks

### **Production Environment**
1. **Maintenance window start**
2. Create database backup
3. Execute migration scripts with monitoring
4. Deploy application updates
5. Run smoke tests
6. Monitor performance metrics
7. **Maintenance window end**

## 📈 Post-Migration Tasks

### **Immediate (Day 1)**
- [ ] Monitor database performance
- [ ] Validate all critical user flows
- [ ] Check error logs for any issues
- [ ] Verify backup and recovery procedures

### **Short-term (Week 1)**
- [ ] Remove compatibility views after code stabilization
- [ ] Update documentation with new schema
- [ ] Train team on new RBAC functionality
- [ ] Optimize queries based on usage patterns

### **Long-term (Month 1)**
- [ ] Analyze performance improvements
- [ ] Plan additional RBAC features
- [ ] Document lessons learned
- [ ] Update development guidelines

## 📞 Emergency Contacts

### **Migration Team**
- **Database Lead**: [Your contact]
- **Backend Lead**: [Backend team contact]
- **DevOps Lead**: [DevOps team contact]
- **QA Lead**: [QA team contact]

### **Rollback Triggers**
- Database corruption detected
- >50% increase in error rates
- >30% performance degradation
- Critical functionality failure

## 📝 Sign-off

### **Required Approvals**
- [ ] **Technical Lead**: Schema design and migration scripts
- [ ] **Product Owner**: Business impact and timeline
- [ ] **DevOps**: Infrastructure and deployment plan
- [ ] **Security**: RBAC enhancements and access controls

---

**Status**: Ready for execution  
**Next Action**: Begin Phase 1 - Table Renaming Migration  
**Estimated Duration**: 4-6 hours total (including validation)

This migration will establish the foundation for a robust, scalable, and maintainable RBAC system following NestJS best practices.