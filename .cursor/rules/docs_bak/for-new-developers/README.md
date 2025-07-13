# 👨‍💻 Welcome New Developers - itellico Mono Quick Start

> **Welcome to the itellico Mono!** This guide will get you up and running in under 30 minutes.

## 🎯 What You're Building

The **itellico Mono** is a cutting-edge multi-tenant SaaS marketplace for the **modeling, film, casting, and creative industries**. You'll be working on a system that supports **700,000+ users** with **enterprise-grade performance** and **industry-leading features**.

### **Quick Stats**
- **Scale:** 2M+ concurrent users target
- **Performance:** <2 second response times
- **Architecture:** Multi-tenant with complete data isolation
- **Tech Stack:** Next.js 15, React 19, TypeScript, PostgreSQL, Redis

---

## ⚡ Quick Setup (5 minutes)

### **1. Environment Setup**

```bash
# Clone the repository
git clone <repository-url>
cd mono-stable-app

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your local settings
```

### **2. Start the Development Server**

```bash
# IMPORTANT: Always kill ports first (from CLAUDE.md)
lsof -ti:3000,3001,3002,3003,3004,3005 | xargs kill -9 2>/dev/null || true

# Start the development server
npm run dev
```

### **3. Verify Everything Works**

- **Frontend:** http://localhost:3000
- **API Docs:** http://localhost:3001/documentation
- **Admin Panel:** http://localhost:3000/admin

**Test Credentials:**
- **Super Admin:** `1@1.com` / `123`
- **Moderator:** `2@2.com` / `123`

---

## 📚 Essential Reading (15 minutes)

### **Must-Read Documents (Priority Order)**

1. **[CLAUDE.md](../../CLAUDE.md)** - Your daily development hub
   - Development commands
   - Port management
   - Troubleshooting guide
   - Architecture principles

2. **[Project Overview](../overview/README.md)** - Complete project context
   - Business goals and success metrics
   - Technical architecture overview
   - Current status and roadmap

3. **[System Architecture](../architecture/README.md)** - Technical deep dive
   - 5-tier business hierarchy
   - Technology stack decisions
   - Performance optimization strategies

4. **[Three-Layer Caching](../architecture/THREE_LAYER_CACHING_STRATEGY.md)** - Critical performance pattern
   - Next.js + Redis + TanStack Query
   - Implementation examples
   - Debugging techniques

### **Key Development Principles**

From **CLAUDE.md**, these are **P0 rules** (never violate):

```typescript
// ✅ ALWAYS use all three caching layers
// ✅ ALWAYS include tenantId for data isolation  
// ✅ ALWAYS use service layer pattern with Redis
// ✅ NEVER use Zustand for server state (use TanStack Query)
// ✅ NEVER skip permission validation
```

---

## 🏗️ Understanding the Architecture (10 minutes)

### **5-Tier Business Hierarchy**

```
Platform (Mono) → Tenant (Go Models) → Account (Agency) → User (Individual) → Profile (Model)
```

**What this means for you:**
- **Every database query** must include `tenantId` for data isolation
- **Every API call** must validate permissions at the right level
- **Every cache key** must include tenant information

### **Technology Stack Overview**

| Component | Technology | Your Focus |
|-----------|------------|------------|
| **Frontend** | Next.js 15 + React 19 | Modern React patterns, App Router |
| **API** | Next.js API + Fastify | Hybrid architecture for performance |
| **Database** | PostgreSQL + Prisma | Type-safe queries with RLS |
| **Caching** | Redis + Next.js + TanStack | Three-layer performance strategy |
| **State** | TanStack Query + Zustand | Server state vs UI state separation |
| **Styling** | Tailwind CSS + ShadCN UI | Utility-first + component library |

### **Critical Performance Pattern: Three-Layer Caching**

```typescript
// Layer 1: Next.js unstable_cache (Server Components)
export const getUsers = unstable_cache(
  async (tenantId: number) => {
    return await fetchUsersFromDB(tenantId);
  },
  ['users-by-tenant'],
  { tags: [`tenant-${tenantId}-users`], revalidate: 300 }
);

// Layer 2: Redis (Service Layer)
export class UsersService {
  async getUsers(tenantId: number) {
    const cacheKey = `cache:${tenantId}:users:list`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);
    
    const users = await this.fetchFromDB(tenantId);
    await redis.setex(cacheKey, 300, JSON.stringify(users));
    return users;
  }
}

// Layer 3: TanStack Query (Client)
export function useUsers(tenantId: number) {
  return useQuery({
    queryKey: ['users', tenantId],
    queryFn: () => fetchUsers(tenantId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## 🔧 Your First Development Task (10 minutes)

Let's build a simple feature to understand the patterns:

### **Task: Add a "User Count" Display**

#### **Step 1: Create the Service Function**

```typescript
// src/lib/services/users.service.ts
import { unstable_cache } from 'next/cache';
import { db } from '@/lib/db';

export const getUserCount = unstable_cache(
  async (tenantId: number): Promise<number> => {
    return await db.user.count({
      where: { tenantId, active: true }
    });
  },
  ['user-count'],
  { 
    tags: [`tenant-${tenantId}-users`], 
    revalidate: 300 // 5 minutes
  }
);
```

#### **Step 2: Create the React Hook**

```typescript
// src/hooks/useUserCount.ts
import { useQuery } from '@tanstack/react-query';

export function useUserCount(tenantId: number) {
  return useQuery({
    queryKey: ['user-count', tenantId],
    queryFn: async () => {
      const response = await fetch(`/api/v1/users/count?tenantId=${tenantId}`);
      return response.json();
    },
    enabled: !!tenantId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

#### **Step 3: Create the API Route**

```typescript
// src/app/api/v1/users/count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserCount } from '@/lib/services/users.service';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = parseInt(searchParams.get('tenantId') || '');
  
  if (!tenantId) {
    return NextResponse.json({ error: 'Missing tenantId' }, { status: 400 });
  }

  try {
    const count = await getUserCount(tenantId);
    return NextResponse.json({ count });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get user count' }, { status: 500 });
  }
}
```

#### **Step 4: Use in a Component**

```typescript
// src/components/admin/UserCountCard.tsx
import { useUserCount } from '@/hooks/useUserCount';

interface UserCountCardProps {
  tenantId: number;
}

export function UserCountCard({ tenantId }: UserCountCardProps) {
  const { data: count, isLoading, error } = useUserCount(tenantId);

  if (isLoading) return <div>Loading user count...</div>;
  if (error) return <div>Error loading user count</div>;

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold">Active Users</h3>
      <p className="text-3xl font-bold text-blue-600">{count?.count || 0}</p>
    </div>
  );
}
```

#### **Step 5: Test Your Implementation**

```bash
# Run the development server
npm run dev

# Test the API endpoint
curl "http://localhost:3000/api/v1/users/count?tenantId=1"

# Check the admin panel to see your component
open http://localhost:3000/admin
```

**🎉 Congratulations!** You've just implemented a feature using all the key patterns:
- ✅ Multi-tenant data isolation
- ✅ Three-layer caching strategy
- ✅ Type-safe API with error handling
- ✅ Modern React hooks with TanStack Query

---

## 🧪 Testing Your Code

### **Run the Test Suite**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### **Write Tests for Your Feature**

```typescript
// src/lib/services/__tests__/users.service.test.ts
import { getUserCount } from '../users.service';
import { db } from '@/lib/db';

jest.mock('@/lib/db');

describe('getUserCount', () => {
  it('should return active user count for tenant', async () => {
    (db.user.count as jest.Mock).mockResolvedValue(42);
    
    const result = await getUserCount(1);
    
    expect(result).toBe(42);
    expect(db.user.count).toHaveBeenCalledWith({
      where: { tenantId: 1, active: true }
    });
  });
});
```

---

## 🐛 Common Issues & Solutions

### **Issue: Port Already in Use**
```bash
# Always run this first (from CLAUDE.md)
lsof -ti:3000,3001,3002,3003,3004,3005 | xargs kill -9 2>/dev/null || true
npm run dev
```

### **Issue: Database Connection Error**
```bash
# Check your .env.local file
DATABASE_URL="postgresql://developer:developer@localhost:5432/mono"

# Run database migrations
npx prisma migrate dev
npx prisma generate
```

### **Issue: Cache Not Working**
```typescript
// Ensure you're using the correct cache key pattern
const cacheKey = `cache:${tenantId}:${entity}:${operation}:${hash}`;

// Always include tenant ID for isolation
```

### **Issue: Permission Denied**
```typescript
// Always validate permissions before data access
const canAccess = await canAccessAPI({
  user: session.user,
  tenant: tenantId,
  resource: 'users',
  action: 'read'
});

if (!canAccess) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 📖 Next Steps

### **Week 1: Get Comfortable**
- [ ] Complete the "User Count" tutorial above
- [ ] Read through the key architecture documents
- [ ] Set up your development environment
- [ ] Join the team communication channels

### **Week 2: First Real Feature**
- [ ] Pick up a "good first issue" from the project board
- [ ] Follow the development workflow in CLAUDE.md
- [ ] Submit your first pull request
- [ ] Get familiar with the code review process

### **Week 3: Deep Dive**
- [ ] Understand the multi-tenant architecture patterns
- [ ] Learn the three-layer caching implementation
- [ ] Explore the workflow system (Temporal + Reactflow)
- [ ] Contribute to documentation improvements

### **Week 4: Team Integration**
- [ ] Participate in sprint planning
- [ ] Take on more complex features
- [ ] Mentor other new developers
- [ ] Contribute to architectural discussions

---

## 🔗 Quick Reference Links

### **Daily Development**
- [CLAUDE.md](../../CLAUDE.md) - Your daily hub
- [Project Status](../roadmap/PROJECT_STATUS.md) - Current progress
- [API Documentation](../api/README.md) - Endpoint reference

### **Architecture Understanding**
- [System Architecture](../architecture/README.md) - Complete overview
- [Caching Strategy](../architecture/THREE_LAYER_CACHING_STRATEGY.md) - Performance patterns
- [Permission System](../features/PERMISSION_SYSTEM_IMPLEMENTATION.md) - RBAC implementation

### **Feature Development**
- [Workflow Integration](../features/COMPREHENSIVE_WORKFLOW_INTEGRATION_ARCHITECTURE.md) - Temporal + Reactflow
- [Messaging System](../features/GOCARE_MESSAGING_SYSTEM_ARCHITECTURE.md) - Real-time communication
- [Testing Guide](../testing/TESTING_METHODOLOGY.md) - Quality standards

### **Help & Support**
- [Troubleshooting](../guides/troubleshooting.md) - Common issues
- [Code Review Guidelines](../development/code-review.md) - Review process
- [Best Practices](../development/best-practices.md) - Development standards

---

## 🎯 Success Checklist

After your first week, you should be able to:

- [ ] **Start the development server** without any issues
- [ ] **Understand the 5-tier hierarchy** and why tenant isolation matters
- [ ] **Implement the three-layer caching pattern** in new features
- [ ] **Write type-safe API endpoints** with proper error handling
- [ ] **Use TanStack Query for server state** and Zustand only for UI state
- [ ] **Write tests** for your code and achieve >90% coverage
- [ ] **Follow the permission patterns** for secure multi-tenant access
- [ ] **Navigate the codebase** and find relevant documentation quickly

---

## 💬 Getting Help

### **Documentation First**
- Check [CLAUDE.md](../../CLAUDE.md) for common commands and troubleshooting
- Search the `/docs` folder for specific topics
- Review existing code for similar patterns

### **Team Communication**
- **Daily Standups:** Ask questions and share blockers
- **Code Reviews:** Learn from feedback on your PRs
- **Architecture Discussions:** Participate in technical decision-making
- **Slack/Discord:** Real-time help and collaboration

### **Escalation Path**
1. **Self-Service:** Documentation and existing code examples
2. **Peer Help:** Other developers and code reviews
3. **Technical Lead:** Architecture and complex technical questions
4. **Project Lead:** Process questions and priority clarification

---

**Welcome to the team! 🎉** You're joining an exciting project with cutting-edge technology and the opportunity to impact hundreds of thousands of users in creative industries.

**Next Step:** Complete the "User Count" tutorial above, then explore the codebase and pick up your first issue!

---

**Last Updated:** January 13, 2025  
**Guide Version:** 1.0.0  
**Estimated Time:** 30 minutes to productive development