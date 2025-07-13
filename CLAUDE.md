# CLAUDE.md - itellico Mono

Multi-tenant SaaS marketplace platform with 5-tier architecture, advanced RBAC, and comprehensive feature sets.

## 🚀 Quick Start

```bash
# Kill ports safely (preserves Docker)
source scripts/utils/safe-port-utils.sh && kill_node_ports 3000 3001

# Start development with Docker (recommended)
./scripts/start-docker-persistent.sh   # Full Docker environment with persistence

# OR start Node.js directly
./start-dev.sh  # Local Node.js development

# Access services
open http://192.168.178.94:3000       # Next.js app
open http://192.168.178.94:3001/docs  # API docs
open http://192.168.178.94:3005       # Documentation site
open http://192.168.178.94:4040       # PHP click-dummy
open http://192.168.178.94:4041       # Kanboard project management
```

## 🎯 KB Auto-Coding Workflow

### CRITICAL: When user message starts with "kb"

When a user message begins with `kb <task-id>`, **IMMEDIATELY** execute this auto-coding workflow:

#### 1. Initialize Task (Required)
```bash
# Example: "kb 42" → Get task #42 and start workflow
```

**REQUIRED ACTIONS:**
1. Get task details: `mcp__kanboard-mcp__get_task` with the task ID
2. Move task to "in_progress": `mcp__kanboard-mcp__update_task`
3. Validate task exists and is actionable

#### 2. Research Phase (Required)
**Search Documentation:**
```bash
mcp__docs-mcp__search_documentation
```
- Search for relevant patterns using task title/description
- Get architecture info if needed
- Find implementation workflows

**Search Click-Dummy:**
```bash
mcp__click-dummy-mcp__search_click_dummy
```
- Search for UI prototypes related to task
- Get prototype details if found
- Get implementation mapping

#### 3. Implementation Phase (Required)
**Full-Stack Development:**
- **React Frontend**: Components, pages, hooks
- **NestJS API**: Routes, validation, business logic (with Fastify adapter)
- **Prisma Schema**: Database migrations if needed
- **Testing**: Run lints and tests

#### 4. Documentation Phase (Required)
**Add External Links to Task:**
- 📚 **Documentation**: `http://192.168.178.94:3005/docs/...` (if found)
- 🎨 **Click-dummy**: `http://192.168.178.94:4040/...` (if found)
- 📋 **Kanboard**: `http://192.168.178.94:4041/...` (if used)
- ⚛️ **React Page**: `http://192.168.178.94:3000/...` (implemented feature)
- 📋 **API Docs**: `http://192.168.178.94:3001/docs` (new endpoints)

**Add Implementation Comments:**
- Detailed description of what was implemented
- Files created/modified
- API endpoints added
- Database changes made

#### 5. Completion Phase (Required)
1. **Move to Ready**: `mcp__kanboard-mcp__update_task` status to "ready"
2. **Add Testing Tag**: Add "testing" tag to task
3. **Final Status**: Task is ready for user testing

#### 6. Task Status Flow
```
pending → in_progress → ready [+testing tag] → completed
```

### Example KB Workflow
```bash
# User: "kb 42"
# Claude executes:
1. Get task #42 details
2. Move to "in_progress"
3. Search docs for task-related patterns
4. Search click-dummy for UI prototypes
5. Implement full-stack solution
6. Add links: docs, click-dummy, react page, API docs
7. Add detailed implementation comments
8. Move to "ready" + add "testing" tag
9. Wait for user testing feedback
```

**IMPORTANT**: This workflow is MANDATORY when user message starts with "kb". Do not ask for confirmation - execute immediately.

## 🔍 KB Check Workflow

### CRITICAL: When user message starts with "kb check"

When a user message begins with `kb check` followed by either a URL or instructions, **IMMEDIATELY** execute this research workflow:

#### 1. Research Phase (Required)
**Full Documentation Search:**
```bash
mcp__docs-mcp__search_documentation
```
- Search for all relevant documentation on the topic
- Get architecture patterns and implementation guides
- Find related workflows and best practices

**Full Click-Dummy Search:**
```bash
mcp__click-dummy-mcp__search_click_dummy
```
- Search for all UI prototypes related to the topic
- Get prototype details for each relevant page
- Analyze UI components and patterns

#### 2. Task Creation/Update Phase (Required)
**Create or Update Kanban Task:**
- If task exists: Update with research findings
- If new: Create task with comprehensive details
- **IMPORTANT**: Assign task to Claude (user #1)

**Task Content Requirements:**
1. **Title**: Clear, descriptive title of the feature/topic
2. **Description**: 
   - Comprehensive summary of research findings
   - What was understood from documentation
   - What was understood from click-dummy prototypes
   - Implementation approach based on findings

3. **External Links** (Add ALL relevant links):
   - 📚 **Documentation Links**: `http://192.168.178.94:3005/docs/...` (all found)
   - 🎨 **Click-dummy Links**: `http://192.168.178.94:4040/...` (all found)
   - 📋 **Related Kanboard Tasks**: Links to related tasks
   - 🔗 **Any URL provided by user**: Include original URL

#### 3. Research Summary Format
In the task description, structure findings as:

```markdown
## Research Summary

### Documentation Findings
- [List all relevant documentation found]
- [Key patterns and approaches discovered]
- [Implementation guidelines from docs]

### Click-Dummy Analysis
- [List all relevant prototypes found]
- [UI components and structure]
- [User flow and interactions]

### Implementation Approach
- [Proposed implementation based on research]
- [Files and components to create/modify]
- [API endpoints needed]
- [Database changes if any]

### Links
- Documentation: [all docs links]
- Click-dummy: [all prototype links]
- Related: [any related resources]
```

#### 4. Workflow Example
```bash
# User: "kb check implement user profile management"
# Claude executes:
1. Search docs for "user profile", "profile management", etc.
2. Search click-dummy for profile-related prototypes
3. Create/update task with:
   - All documentation links found
   - All click-dummy prototype links
   - Detailed analysis of findings
   - Proposed implementation approach
4. Wait for user review and comments
```

**IMPORTANT**: This workflow is MANDATORY when user message starts with "kb check". The goal is comprehensive research and documentation, NOT implementation.

## 📝 KB Feedback Workflow

### CRITICAL: When user message starts with "kb feedback"

When a user message begins with `kb feedback` followed by a task ID, **IMMEDIATELY** execute this feedback workflow:

#### 1. Task Identification Phase (Required)
**Find the Task:**
- Use `mcp__kanboard-mcp__get_task` with the provided task ID
- Get current task details including all comments

#### 2. Read Latest Feedback (Required)
**Find MM's Feedback:**
- Look through task comments for the latest feedback from MM (user #2)
- Find messages that contain "@Claude" followed by feedback
- This feedback will contain corrections or new instructions

#### 3. Automatic Correction Phase (Required)
**Update Task Based on Feedback:**
- Analyze the feedback from MM
- Update task description with corrections
- Strike through incorrect information
- Add corrected information clearly
- Update implementation approach as specified in feedback

#### 4. Comment Response (Required)
**Add Acknowledgment Comment:**
```markdown
## ✅ Corrections Applied

@mm - I've reviewed your feedback and made the following corrections:

### Changes Made:
- [List specific changes made to the task]
- [What was corrected based on feedback]
- [Updated approach or understanding]

### Task Updated:
- Description has been revised with your corrections
- Previous incorrect information has been struck through
- New requirements have been added

The task is now ready for your review and implementation.
```

#### 5. Reassign Task (Required)
- Assign task back to MM (user #2) for implementation
- Move task to appropriate status
- Add "feedback-applied" tag

### Example KB Feedback Workflow
```bash
# User: "kb feedback 42"
# Claude automatically:
1. Gets task #42 details and comments
2. Finds latest feedback from MM containing "@Claude"
3. Reads: "@Claude - The API should use GraphQL not REST"
4. Updates task description:
   - Strikes through REST API approach
   - Adds GraphQL implementation requirements
5. Adds comment acknowledging corrections
6. Assigns task back to MM
```

**IMPORTANT**: This workflow is fully automated - Claude reads feedback from task comments and applies corrections without asking for additional input.

## 🗜️ KB Compact Workflow

### CRITICAL: When user message starts with "kb compact"

When a user message begins with `kb compact` followed by a task ID, **IMMEDIATELY** execute this comment compacting workflow:

#### 1. Get Task Comments (Required)
```bash
# Example: "kb compact 5" → Compact comments for task #5
```

**REQUIRED ACTIONS:**
1. Get task details: `mcp__kanboard-mcp__get_task` with the task ID
2. Get all comments: `mcp__kanboard-mcp__get_task_comments` 
3. Use `mcp__kanboard-mcp__compact_task_comments` to compress

#### 2. Comment Analysis Phase
The compacting tool will:
- Analyze all comments for patterns (errors, solutions, implementations, notes)
- Remove duplicate and redundant information
- Preserve valuable information and hard facts
- Keep bugs but avoid duplicate solutions
- Extract key information from verbose comments

#### 3. Result
- All original comments are deleted
- One consolidated summary comment is created with:
  - 🐛 Issues/Errors section
  - ✅ Solutions section
  - 🔧 Implementations section
  - ⚠️ Important Notes section
  - 📊 Key Information section
  - 📅 Metadata section

### Example KB Compact Workflow
```bash
# User: "kb compact 5"
# Claude executes:
1. Get task #5 details
2. Get all comments for task #5
3. Execute compact_task_comments tool
4. Original 20 comments → 1 consolidated summary
5. Report success to user
```

**IMPORTANT**: This workflow removes redundant information while preserving all valuable content. Only hard facts remain, making tasks easier to read and understand.

## 📦 Package Manager

**Use pnpm exclusively** - Never use npm or yarn.

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start development
pnpm test             # Run tests
pnpm build            # Build for production
```

## 💾 Database Configuration

**Docker PostgreSQL** is the primary database instance:

```bash
# Production Database (Docker)
Host: 192.168.178.94
Port: 5432
Database: mono
User: developer
Password: developer
Connection: postgresql://developer:developer@192.168.178.94:5432/mono
```

### Database Status
- ✅ **53 tables** with complete schema
- ✅ **UUID fields** on all models (Permission, Role, User, etc.)
- ✅ **Cache infrastructure** (5 cache tables: permission_cache, cache_invalidation_log, cache_warmup_queue, cache_metrics, cache_configuration)
- ✅ **Field ordering** optimized (UUID → ID → Fields → Relations)
- ✅ **Multi-level caching** ready (L1 → L2 → L3)

### Database Migration Commands
```bash
# Deploy migrations to Docker PostgreSQL
pnpm prisma migrate deploy

# Reset and sync schema (development only)
pnpm prisma db push --force-reset

# Generate Prisma client
pnpm prisma generate

# View database
psql "postgresql://developer:developer@192.168.178.94:5432/mono"
```

## 🏗️ Architecture

### 5-Tier Hierarchy
```
Platform → Tenant → Account → User → Public
```

### Core Services
| Service | Port | Description |
|---------|------|-------------|
| Next.js Frontend | 3000 | Main application |
| NestJS API | 3001 | Backend API server (with Fastify adapter) |
| Documentation | 3005 | Docusaurus site |
| PHP Click-dummy | 4040 | Feature prototype |
| Kanboard | 4041 | Project management |

### Development Services
| Service | Port | Credentials |
|---------|------|-------------|
| PostgreSQL | 192.168.178.94:5432 | developer/developer |
| Redis | 192.168.178.94:6379 | Cache & sessions |
| Mailpit | 192.168.178.94:4025 | Email testing UI |
| N8N | 192.168.178.94:5678 | admin/admin123 |
| Temporal | 192.168.178.94:4080 | Workflow UI |
| Grafana | 192.168.178.94:5005 | admin/admin123 |

### Test Environment
| Service | Port | Description |
|---------|------|-------------|
| Next.js (Test) | 3100 | Test frontend |
| Fastify (Test) | 3101 | Test API |
| PostgreSQL (Test) | 5433 | Test database |
| Redis (Test) | 6380 | Test cache |

## 🚨 Development Rules

### 1. Research First
- Check `/docs` directory
- Review existing patterns
- Understand full context

### 2. Confirm Understanding
- Present findings to user
- Ask: "Did I understand correctly?"
- Wait for explicit approval

### 3. Implement Carefully
- Follow established patterns
- Test thoroughly
- Use proper error handling

### 4. Update Documentation
- Keep docs in sync with code
- Update relevant `/docs` files
- Maintain CLAUDE.md accuracy

### 🚨 CRITICAL: No Direct Database Access from Next.js
**NEVER use direct database queries in Next.js pages/components:**
- ❌ `import { db } from '@/lib/db'` in pages
- ❌ `await db.user.findFirst()` in components
- ❌ `await prisma.xyz.query()` in frontend code

**ALWAYS route through NestJS API with proper authentication:**
- ✅ Create NestJS endpoints with `@Auth()` and `@Permission()` decorators
- ✅ Use HTTP calls from Next.js to NestJS API
- ✅ Respect authentication middleware and permission system
- ✅ Follow the architecture: `Browser → Next.js → NestJS API → Database`

**❌ FORBIDDEN PATTERNS - You MUST NOT do this:**
```typescript
// ❌ NEVER in Next.js pages/components
import { db } from '@/lib/db';
const user = await db.user.findFirst({ where: { id: userId } });

// ❌ NEVER bypass authentication system
const directQuery = await prisma.permission.findMany();
```

**✅ CORRECT PATTERNS - Always do this:**
```typescript
// ✅ Create NestJS endpoint with proper guards
@Controller('admin/users')
@Auth()
@Permission('admin.users.view')
export class AdminUsersController {
  async getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }
}

// ✅ Call API from Next.js with auth token
const response = await fetch('/api/v2/admin/users/123', {
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Why this matters:**
- Ensures proper authentication, authorization, caching, and audit logging
- Prevents database connection inconsistencies
- Maintains security boundaries between frontend and backend
- Allows proper permission checking and middleware execution

Use `pnpm audit:database` to find and fix violations.

### 5. MANDATORY: Best Practices Verification
**CRITICAL: When analyzing ANY route, component, or module, ALWAYS verify:**

#### Backend (NestJS API) - REQUIRED CHECKS:
- ✅ **Permission System**: Every endpoint must have `@Permission('module.resource.action')` decorator
- ✅ **Tier Decorator**: Proper `@Tier(UserTier.PLATFORM|TENANT|ACCOUNT|USER)` usage
- ✅ **Auth Decorator**: `@Auth()` decorator on all protected endpoints
- ✅ **Swagger Documentation**: `@ApiOperation()`, `@ApiParam()`, `@ApiTags()` properly configured
- ✅ **UUID Validation**: All UUID parameters use `ParseUUIDPipe` with proper `@ApiParam` documentation
- ✅ **Error Handling**: Consistent error response format `{ success: false, error: "CODE", message: "..." }`
- ✅ **Validation**: DTOs with proper validation decorators and `@ApiProperty()`
- ✅ **Role Naming**: All role codes MUST use lowercase snake_case (e.g., `super_admin`, NOT `SUPER_ADMIN`)
- ✅ **Module Structure**: Controllers, services, DTOs organized in feature modules
- ✅ **Dependency Injection**: Constructor injection for all dependencies
- ✅ **Service Layer**: Business logic in services, controllers for HTTP handling only
- ✅ **Transaction Handling**: Use `@Transactional()` for database operations
- ✅ **Exception Handling**: Throw `HttpException` with proper status codes
- ✅ **Async/Await**: All database operations use async/await pattern

#### Frontend (Next.js) - REQUIRED CHECKS:
- ✅ **State Management**: Proper Zustand store usage with type safety
- ✅ **Data Fetching**: TanStack Query (React Query) for server state
- ✅ **Cache Strategy**: Implement 3-layer caching (TanStack Query + Redis + Database)
- ✅ **Permission Checks**: Client-side permission validation using permission hooks
- ✅ **Loading States**: Proper loading, error, and success states
- ✅ **Type Safety**: Full TypeScript usage with proper interface definitions

#### Database & Architecture:
- ✅ **5-Tier Architecture**: Respect Platform → Tenant → Account → User → Public hierarchy
- ✅ **Permission Format**: Follow `{tier}.{resource}.{action}` convention
- ✅ **Database Relations**: Proper foreign keys and constraints
- ✅ **Audit Logging**: Track all permission checks and user actions
- ✅ **Use Enums**: NEVER use string for fields with limited values (gender, status, type, etc.)
- ✅ **Normalize JSON**: NEVER store structured data in JSON columns - create proper tables
- ✅ **Consistent Types**: Use same data types for similar fields across tables
- ✅ **Naming Convention**: Always use snake_case for database fields

**If ANY of these checks fail, immediately flag the issue and suggest fixes following our established patterns.**

## 🤖 Auto-Coding Workflow

### IMPORTANT: Before Starting ANY Task

1. **Search Documentation** (ALWAYS FIRST)
   ```
   mcp__docs-mcp__search_documentation
   ```
   - Look for existing patterns
   - Check implementation guides
   - Find related documentation

2. **Check Click-Dummy Prototypes**
   ```
   mcp__click-dummy-mcp__search_click_dummy
   ```
   - Search for UI/UX prototypes
   - Get implementation details
   - Review component patterns

3. **Check Kanban Tasks**
   ```
   mcp__kanboard-mcp__list_tasks
   ```
   - Find related tasks
   - Check implementation status
   - Update task progress

### Intelligent Implementation Flow

```mermaid
graph TD
    A[New Feature Request] --> B[Search Documentation]
    B --> C{Found Docs?}
    C -->|Yes| D[Search Click-Dummy]
    C -->|No| E[Create Documentation]
    D --> F{Found Prototype?}
    F -->|Yes| G[Get Implementation Map]
    F -->|No| H[Design First]
    G --> I[Check Kanban Tasks]
    I --> J[Implement Following Patterns]
    J --> K[Update Task Status]
    K --> L[Update Documentation]
```

### MCP Server Integration

> **📚 Full Documentation**: See [MCP Servers Documentation](/docs/development/mcp-servers/) for detailed guides on all available MCP servers.

1. **Documentation Server** (`mcp__docs-mcp__`)
   - `search_documentation` - Find existing docs
   - `get_architecture_info` - Understand patterns
   - `get_development_workflow` - Follow procedures
   - `get_code_patterns` - Use templates
   - `get_project_status` - Current implementation state

2. **Click-Dummy Server** (`mcp__click-dummy-mcp__`)
   - `search_click_dummy` - Find UI prototypes
   - `get_prototype_details` - Get full details
   - `get_feature_implementation_map` - Map to code
   - `get_ui_components` - Reuse components
   - `list_prototype_features` - List all available features

3. **Kanban Server** (`mcp__kanboard-mcp__`)
   - `list_tasks` - View current tasks
   - `create_task` - Add new tasks
   - `update_task` - Update progress
   - `move_task` - Move between columns
   - `get_task` - Get detailed task info
   - `list_projects` - List all projects
   - `get_board` - Get board layout
   - `search_tasks` - Search with queries
   - `add_comment` - Document changes
   - `get_task_comments` - Get all comments
   - `create_subtask` - Create subtasks
   - `list_subtasks` - List all subtasks
   - `update_subtask` - Update subtask status
   - `get_subtask` - Get subtask details
   - `compact_task_comments` - Consolidate comments

4. **Context7 MCP** (`mcp__context7-mcp__`)
   - AI-powered context management
   - Maintains conversation history
   - Intelligent context retrieval

5. **Magic MCP** (`mcp__magic-mcp__`)
   - UI component generation
   - React component creation
   - Design system integration
   - API Key: Configured in environment

6. **Sequential Thinking** (`mcp__sequential-thinking__`)
   - Complex problem solving
   - Step-by-step reasoning
   - Decision tree analysis
   - Multi-stage planning

7. **Puppeteer** (`mcp__puppeteer__`)
   - Browser automation & testing
   - Screenshot capture
   - End-to-end testing
   - Web scraping capabilities

### Example Auto-Coding Sequence

```bash
# 1. User requests: "Implement the talent search feature"

# 2. Claude automatically:
- Searches docs for "talent search"
- Finds click-dummy at "tenant/talent/index.php"
- Gets implementation map showing:
  - Frontend: TalentTable.tsx, TalentFilters.tsx
  - API: /api/v1/tenant/talent/search
  - Permissions: tenant.talent.view
- Finds Kanban task #2 "Talent Search Implementation"
- Updates task to "in_progress"
- Implements following the patterns
- Updates task to "completed"
- Updates documentation
```

### Click-Dummy Metadata Structure

Each click-dummy prototype has a `.metadata.yaml` file:
```yaml
path: platform/schemas/builder.php
tier: platform
title: Schema Builder
features: [drag-and-drop, validation-rules]
components: [form-builder, preview-panel]
implementation_status: not_started
related_docs: [/docs/platform/schemas/]
api_endpoints: [/api/v1/platform/schemas]
permissions: [platform.schemas.create]
```

## 📝 Documentation Best Practices

### IMPORTANT: Use MCP Documentation Server
When creating or updating documentation:

1. **Search First**: Use `mcp__itellico-mono-docs__search_documentation` to find existing docs
2. **Understand Structure**: Check documentation organization before creating files
3. **Place Correctly**: Put docs in the appropriate section, NOT in the root `/docs` folder
   - Infrastructure/Docker → `/docs/development/deployment/` or `/docs/development/tools/`
   - API patterns → `/docs/architecture/api-design/`
   - Security → `/docs/architecture/security/`
   - Features → Appropriate tier folder (`/docs/platform/`, `/docs/tenant/`, etc.)
4. **Update Indexes**: If creating new sections, update parent index.md files
5. **Follow Patterns**: Match existing documentation style and structure

## 🔑 API Patterns

### ⚠️ CRITICAL: API Version Policy
**ALWAYS use API v2** - Never create v1 endpoints. The global prefix `api/v2` is set in main.ts.
- ✅ **CORRECT**: `@Controller('public/countries')` → Results in `/api/v2/public/countries`
- ❌ **WRONG**: `@Controller('api/v1/public/countries')` → Never hardcode API versions
- ❌ **WRONG**: Any reference to v1 in controllers - This is a legacy pattern

### Route Structure
```
/api/v2/{tier}/{resource}/{action}
```

### Required Response Format
```typescript
// Success
{ success: true, data: {...} }

// Error
{ 
  success: false, 
  error: "ERROR_CODE",
  message: "Human readable message" 
}

// Paginated
{
  success: true,
  data: {
    items: [...],
    pagination: { page: 1, limit: 20, total: 100, totalPages: 5 }
  }
}
```

### Permission Format
```
{tier}.{resource}.{action}
```

### Role Naming Convention
All role codes MUST use **lowercase snake_case**:
- ✅ `super_admin`, `platform_admin`, `tenant_admin`, `user`
- ❌ `SUPER_ADMIN`, `PLATFORM_ADMIN`, `TENANT_ADMIN`, `USER`

Use `pnpm fix:roles` to audit and fix role naming conventions.

## 🔐 Industry-Grade RBAC Permission System

Our platform implements a comprehensive **Role-Based Access Control (RBAC)** system with **5-tier architecture** integration, **wildcard inheritance**, and **NestJS + Fastify** deep integration.

### 🏗️ **Permission Architecture**

#### **5-Tier Permission Hierarchy**
```
Platform → Tenant → Account → User → Public
```

Each tier inherits permissions from higher tiers with wildcard support:

```typescript
// Permission examples by tier
platform.users.create     // Platform admins only
tenant.settings.manage     // Tenant admins + Platform  
account.billing.view       // Account owners + higher tiers
user.profile.update        // Individual users + higher tiers
public.content.read        // Everyone (including anonymous)
```

#### **Permission Format Convention**
```
{tier}.{resource}.{action}[.{context}]
```

**Examples**:
- `platform.tenants.create` - Create new tenants (platform level)
- `tenant.users.invite` - Invite users to tenant
- `account.billing.manage` - Manage account billing
- `user.profile.update` - Update own profile
- `*.*.read` - Wildcard: read access to all resources

### 🗄️ **Database Schema**

#### **Core RBAC Tables**
```sql
-- Permissions table - Defines all system permissions
permissions (
  uuid UUID PRIMARY KEY,
  id INT UNIQUE AUTO_INCREMENT,
  name VARCHAR UNIQUE,           -- e.g., 'platform.users.create'
  module VARCHAR,                -- e.g., 'platform', 'tenant'
  resource VARCHAR,              -- e.g., 'users', 'billing'  
  action VARCHAR,                -- e.g., 'create', 'read', 'update'
  scope VARCHAR,                 -- e.g., 'own', 'all', 'team'
  pattern VARCHAR,               -- e.g., 'platform.*.create' (wildcard)
  is_wildcard BOOLEAN,           -- True for wildcard permissions
  is_system BOOLEAN,             -- True for system-defined permissions
  priority INT,                  -- Permission priority (higher = precedence)
  condition JSONB,               -- Dynamic conditions
  metadata JSONB                 -- Additional permission metadata
);

-- Roles table - Groups of permissions
roles (
  uuid UUID PRIMARY KEY,
  id INT UNIQUE AUTO_INCREMENT,
  tenant_id INT,                 -- NULL for system roles
  name VARCHAR,                  -- Display name
  code VARCHAR UNIQUE,           -- e.g., 'super_admin', 'tenant_admin'  
  level INT,                     -- Hierarchy level (0=highest)
  inherit_from INT,              -- Parent role inheritance
  is_system BOOLEAN,             -- True for system roles
  is_default BOOLEAN             -- True for default assignment
);

-- Role-Permission assignments
role_permissions (
  role_id INT,
  permission_id INT,
  is_denied BOOLEAN DEFAULT FALSE, -- Explicit deny
  condition JSONB,                 -- Dynamic conditions
  expires_at TIMESTAMP            -- Time-limited permissions
);

-- User-Role assignments  
user_roles (
  user_id INT,
  role_id INT,
  assigned_by INT,
  expires_at TIMESTAMP,           -- Time-limited roles
  is_active BOOLEAN DEFAULT TRUE,
  metadata JSONB                  -- Assignment context
);

-- Direct user permissions (overrides)
user_permissions (
  user_id INT,
  permission_id INT,
  granted_by INT,
  is_denied BOOLEAN DEFAULT FALSE, -- Explicit deny override
  condition JSONB,                 -- Dynamic conditions
  expires_at TIMESTAMP            -- Time-limited permissions
);
```

### 🚀 **NestJS + Fastify Integration**

#### **1. Authentication Guard (JWT + HTTP-Only Cookies)**
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    
    // Extract JWT from HTTP-only cookie (secure)
    const token = request.cookies['access-token'] || 
                  request.cookies['auth-token'];
    
    if (token) {
      request.headers.authorization = `Bearer ${token}`;
    }
    
    return super.canActivate(context);
  }
}
```

#### **2. Permission Decorator**
```typescript
export const Permission = (permission: string) => SetMetadata('permission', permission);

// Usage in controllers
@Get('users')
@Permission('platform.users.read')
async getUsers() {
  // Implementation
}
```

#### **3. Tier-Based Access Decorator**
```typescript
export const Tier = (tier: UserTier) => SetMetadata('tier', tier);

// Usage with permission
@Get('settings')  
@Permission('tenant.settings.read')
@Tier(UserTier.TENANT)
async getSettings() {
  // Only tenant-level+ users can access
}
```

#### **4. Permission Guard Implementation**
```typescript
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private cacheService: CacheService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required permission from decorator
    const requiredPermission = this.reflector.get<string>(
      'permission', 
      context.getHandler()
    );
    
    if (!requiredPermission) return true;
    
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    if (!user) return false;
    
    // Check permission with 3-layer caching
    return await this.permissionService.hasPermission(
      user.id,
      requiredPermission,
      { 
        tenantId: user.tenant_id,
        accountId: user.account_id,
        context: this.getRequestContext(request)
      }
    );
  }
}
```

#### **5. Complete Controller Example**
```typescript
@Controller('api/v1/platform/users')
@ApiTags('Platform Users')
@Auth()  // Requires authentication
export class PlatformUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permission('platform.users.read')
  @Tier(UserTier.PLATFORM)
  @ApiOperation({ summary: 'List all platform users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  async findAll(
    @Query() query: PaginationDto,
    @CurrentUser() user: User
  ): Promise<ApiResponse<User[]>> {
    return this.usersService.findAll(query);
  }

  @Post()
  @Permission('platform.users.create')
  @Tier(UserTier.PLATFORM)
  @ApiOperation({ summary: 'Create new platform user' })
  @ApiBody({ type: CreateUserDto })
  async create(
    @Body() createUserDto: CreateUserDto,
    @CurrentUser() user: User
  ): Promise<ApiResponse<User>> {
    return this.usersService.create(createUserDto, user.id);
  }

  @Put(':id')
  @Permission('platform.users.update')
  @Tier(UserTier.PLATFORM)
  @ApiOperation({ summary: 'Update platform user' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @CurrentUser() user: User
  ): Promise<ApiResponse<User>> {
    return this.usersService.update(id, updateUserDto, user.id);
  }
}
```

### ⚡ **3-Layer Caching System**

#### **L1: In-Memory Cache (Node.js)**
```typescript
@Injectable()
export class PermissionService {
  private memoryCache = new Map<string, any>();
  private readonly L1_TTL = 60; // 1 minute

  async hasPermission(userId: number, permission: string, context?: any): Promise<boolean> {
    const cacheKey = `perm:${userId}:${permission}:${JSON.stringify(context)}`;
    
    // L1: Check memory cache first
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey);
    }
    
    // L2: Check Redis cache
    const redisResult = await this.redis.get(`perm:${cacheKey}`);
    if (redisResult !== null) {
      this.memoryCache.set(cacheKey, redisResult);
      return redisResult;
    }
    
    // L3: Database query with permission resolution
    const result = await this.computePermission(userId, permission, context);
    
    // Cache in both layers
    await this.redis.setex(`perm:${cacheKey}`, 3600, result); // L2: 1 hour
    this.memoryCache.set(cacheKey, result); // L1: In memory
    
    return result;
  }
}
```

#### **L2: Redis Cache (Distributed)**
```typescript
// Redis cache with automatic invalidation
async cacheUserPermissions(userId: number): Promise<void> {
  const permissions = await this.computeAllPermissions(userId);
  
  await this.redis.setex(
    `user_permissions:${userId}`,
    3600, // 1 hour TTL
    JSON.stringify(permissions)
  );
}

// Invalidate cache on role/permission changes
async invalidateUserCache(userId: number): Promise<void> {
  const pattern = `*:${userId}:*`;
  const keys = await this.redis.keys(pattern);
  
  if (keys.length > 0) {
    await this.redis.del(...keys);
  }
}
```

#### **L3: Database with Wildcard Resolution**
```typescript
async computePermission(userId: number, permission: string, context?: any): Promise<boolean> {
  // Get user roles and direct permissions
  const user = await this.prisma.user.findUnique({
    where: { id: userId },
    include: {
      userRoles: {
        include: { role: { include: { rolePermissions: { include: { permission: true } } } } }
      },
      userPermissions: { include: { permission: true } }
    }
  });

  // Check direct user permissions first (highest priority)
  for (const userPerm of user.userPermissions) {
    if (this.matchesPermission(userPerm.permission.name, permission)) {
      return !userPerm.is_denied; // Explicit grant/deny
    }
  }

  // Check role-based permissions with inheritance
  for (const userRole of user.userRoles) {
    for (const rolePerm of userRole.role.rolePermissions) {
      if (this.matchesPermission(rolePerm.permission.name, permission)) {
        if (rolePerm.is_denied) return false; // Explicit deny
        return true; // Permission granted
      }
    }
  }

  return false; // Default deny
}

// Wildcard permission matching
private matchesPermission(grantedPermission: string, requestedPermission: string): boolean {
  // Exact match
  if (grantedPermission === requestedPermission) return true;
  
  // Wildcard matching
  if (grantedPermission.includes('*')) {
    const regex = new RegExp(
      grantedPermission.replace(/\*/g, '[^.]*').replace(/\./g, '\\.')
    );
    return regex.test(requestedPermission);
  }
  
  return false;
}
```

### 🔥 **Advanced Features**

#### **1. Wildcard Permissions**
```typescript
// Grant broad access patterns
'platform.*.*'           // All platform actions
'tenant.*.read'           // Read access to all tenant resources  
'account.billing.*'       // All billing operations
'*.users.read'            // Read users across all tiers
'*.*.*'                   // Superuser (everything)
```

#### **2. Conditional Permissions**
```typescript
// Dynamic permission conditions
{
  permission: 'account.users.update',
  condition: {
    'user.department': 'HR',           // Only HR can update users
    'resource.status': 'active',       // Only active resources
    'time.business_hours': true        // Only during business hours
  }
}
```

#### **3. Time-Limited Permissions**
```typescript
// Temporary permission grants
await this.permissionService.grantTemporary(
  userId,
  'platform.maintenance.access',
  { expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) } // 2 hours
);
```

#### **4. Context-Aware Permissions**
```typescript
// Request context affects permissions
@Get('accounts/:accountId/users')
@Permission('account.users.read')
async getAccountUsers(
  @Param('accountId') accountId: string,
  @CurrentUser() user: User
) {
  // Permission check includes account context
  // User can only access their own account users (unless higher tier)
}
```

### 📊 **Performance Optimizations**

#### **Database Indexes**
```sql
-- Critical indexes for permission queries
CREATE INDEX idx_permissions_pattern ON permissions(pattern) WHERE is_wildcard = true;
CREATE INDEX idx_user_permissions_user_id ON user_permissions(user_id) WHERE is_denied = false;
CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id) WHERE is_denied = false;
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id) WHERE is_active = true;
```

#### **Cache Warming**
```typescript
// Pre-warm permission cache for active users
@Cron('0 */6 * * *') // Every 6 hours
async warmPermissionCache(): Promise<void> {
  const activeUsers = await this.prisma.user.findMany({
    where: { 
      is_active: true,
      last_login_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    }
  });

  for (const user of activeUsers) {
    await this.permissionService.cacheUserPermissions(user.id);
  }
}
```

### 🛡️ **Security Features**

#### **1. HTTP-Only Cookie Authentication**
```typescript
// Secure cookie configuration
await app.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET,
  hook: 'onRequest',
  parseOptions: {
    httpOnly: true,           // Prevent XSS
    secure: NODE_ENV === 'production', // HTTPS only in prod
    sameSite: 'lax',         // CSRF protection
    path: '/',
    maxAge: 15 * 60 * 1000   // 15 minutes
  }
});
```

#### **2. Permission Audit Logging**
```typescript
// Log all permission checks for compliance
@Injectable()
export class PermissionAuditService {
  async logPermissionCheck(
    userId: number,
    permission: string,
    granted: boolean,
    context?: any
  ): Promise<void> {
    await this.prisma.permissionAuditLog.create({
      data: {
        user_id: userId,
        permission,
        granted,
        context: context || {},
        ip_address: context?.ip,
        user_agent: context?.userAgent,
        timestamp: new Date()
      }
    });
  }
}
```

### 🎯 **Usage Examples**

#### **Frontend Permission Checks**
```typescript
// React hook for permission checking
export const usePermission = (permission: string) => {
  const { user } = useAuth();
  
  return useMemo(() => {
    return user?.permissions?.includes(permission) || 
           user?.permissions?.some(p => matchesWildcard(p, permission));
  }, [user?.permissions, permission]);
};

// Component usage
const UserManagement: React.FC = () => {
  const canCreateUsers = usePermission('platform.users.create');
  const canViewBilling = usePermission('account.billing.read');
  
  return (
    <div>
      {canCreateUsers && <CreateUserButton />}
      {canViewBilling && <BillingSection />}
    </div>
  );
};
```

#### **Service Integration**
```typescript
// Service-level permission enforcement
@Injectable()
export class UsersService {
  async updateUser(id: string, data: UpdateUserDto, currentUserId: number): Promise<User> {
    // Check permission before operation
    const hasPermission = await this.permissionService.hasPermission(
      currentUserId,
      'platform.users.update',
      { targetUserId: id }
    );
    
    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }
    
    return this.prisma.user.update({ where: { id }, data });
  }
}
```

This **enterprise-grade RBAC system** provides:
- ✅ **5-tier hierarchical permissions** with inheritance
- ✅ **Wildcard pattern matching** for flexible access control  
- ✅ **3-layer caching** for sub-millisecond permission checks
- ✅ **NestJS + Fastify integration** with decorators and guards
- ✅ **HTTP-only cookie security** preventing XSS attacks
- ✅ **Comprehensive audit logging** for compliance
- ✅ **Time-limited and conditional permissions** for advanced scenarios
- ✅ **Database-level integrity** with proper foreign keys and constraints

## 🎯 NestJS Best Practices

### Module Organization
```typescript
// Feature module structure
@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule {}
```

### Controller Patterns
```typescript
@Controller('platform/users')
@ApiTags('Platform Users')
@Auth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  @Permission('platform.users.view')
  @Tier(UserTier.PLATFORM)
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }
}
```

### Service Patterns
```typescript
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  @Transactional()
  async create(dto: CreateUserDto): Promise<User> {
    try {
      return await this.prisma.user.create({ data: dto });
    } catch (error) {
      throw new BadRequestException('Failed to create user');
    }
  }
}
```

### DTO Validation
```typescript
export class CreateUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @Length(2, 100)
  name: string;
}
```

### Error Handling
```typescript
// Service layer
throw new NotFoundException(`User with ID ${id} not found`);
throw new BadRequestException('Invalid email format');
throw new ForbiddenException('Insufficient permissions');

// Response format (automatic)
{ success: false, error: "USER_NOT_FOUND", message: "User with ID abc not found" }
```

### Testing Patterns
```typescript
// Unit test
describe('UsersService', () => {
  let service: UsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrisma }
      ]
    }).compile();
    
    service = module.get<UsersService>(UsersService);
  });
});
```

## 💾 Storage Strategy

### Decision Matrix
| Data Type | Storage | Reason |
|-----------|---------|--------|
| Auth tokens | HTTP-only cookies | Security |
| UI state | Zustand | Client reactivity |
| Server data | TanStack Query | Auto-sync |
| High-frequency cache | Redis | Performance |
| Persistent data | PostgreSQL | Source of truth |

### Redis Key Patterns
```
platform:{entity}:{id}            # Global data
tenant:{tenantId}:{entity}:{id}   # Tenant-scoped
temp:{type}:{id}                  # Temporary data
```

## ⚡ Performance Rules

### React Optimization
- Always include useEffect dependencies
- Use React.memo for expensive components
- Split contexts by update frequency
- Implement virtual scrolling for long lists

### Caching Strategy
1. Start with TanStack Query
2. Move to Redis only when:
   - Queries >50/min
   - Computation >1 second
   - Data shared across users
   - Real-time requirements

## 🛠️ Common Commands

```bash
# Database
pnpm prisma migrate dev
pnpm prisma generate
pnpm run seed

# Testing
pnpm test
pnpm test:e2e
cd apps/api && pnpm tsx test-api-endpoints.ts

# Docker Management
docker-compose -p mono-test -f docker-compose.test.yml up -d
./scripts/setup-services.sh
```

## 🔧 Troubleshooting

### PHP Extension Issues
If you see "PHP extension required: 'pdo_pgsql'" error:

```bash
# Fix PHP pdo_pgsql extension
./scripts/fix-php-pgsql.sh

# OR manually install
docker-compose exec -u root php sh -c "
    apk add --no-cache postgresql-dev && \
    docker-php-ext-install pdo_pgsql && \
    docker-php-ext-enable pdo_pgsql
"

# Verify installation
docker-compose exec php php -m | grep pdo_pgsql
```

### Service Connection Issues
```bash
# Check all container status
docker-compose ps

# View logs for specific service
docker-compose logs -f <service-name>

# Restart problematic service
docker-compose restart <service-name>

# Full restart with persistence
./scripts/start-docker-persistent.sh
```

## ⚠️ Critical Warnings

### Never Kill Docker Ports
```bash
# ❌ NEVER DO THIS
lsof -ti:6379 | xargs kill -9  # Breaks Redis
lsof -ti:5432 | xargs kill -9  # Breaks PostgreSQL

# ✅ Safe port killing (Node.js only)
source scripts/utils/safe-port-utils.sh
kill_node_ports 3000 3001
```

### Security Rules
- Never store tokens in localStorage
- Never expose sensitive data in Zustand
- Always use HTTP-only cookies for auth
- Always validate permissions server-side

## 📚 Documentation

### Key Resources
- **Architecture**: `/docs/architecture/`
- **API Design**: `/docs/development/`
- **Components**: `/dev/components` (live examples)
- **Click-dummy**: `/click-dummy/` (PHP prototype)

### Documentation Sites
- **Main Docs**: http://192.168.178.94:3005
- **API Docs**: http://192.168.178.94:3001/docs
- **Dev Environment**: http://192.168.178.94:3005/dev-environment
- **This File**: http://192.168.178.94:3005/claude-instructions

## 🎯 Current Focus Areas

1. **5-Tier Architecture**: Platform → Tenant → Account → User → Public
2. **Component Library**: Standardized UI components with live examples
3. **Audit System**: Complete tracking and monitoring implementation
4. **Performance**: 3-layer caching with Redis + TanStack Query
5. **Multi-tenant**: Complete isolation with advanced RBAC

## 📁 Project Structure

```
/apps
  /web          # Next.js frontend
  /api          # Fastify backend
/packages
  /shared       # Shared utilities
  /ui           # UI components
/docs           # Documentation
/click-dummy    # PHP prototype
/scripts        # Build & dev scripts
/docker         # Docker configurations (in Git)
  /configs      # Runtime configs for all services
/docker-data    # Persistent data (NOT in Git)
  /databases    # PostgreSQL data
  /cache        # Redis persistence
  /apps         # Application data
  /monitoring   # Grafana/Prometheus data
```

### 🚨 MANDATORY FILE ORGANIZATION RULES

**Claude Code MUST follow these rules - NO EXCEPTIONS:**

#### ✅ CORRECT File Placement:
```bash
# Screenshots - ONLY in screenshots folder
/screenshots/login-page.png
/screenshots/admin-dashboard.png

# Test files - ONLY in test folder  
/test/test-auth-flow.ts
/test/test-api-endpoints.js
/test/manual-login-test.html

# Debug files - ONLY in debug folder
/debug/debug-auth.ts
/debug/debug-permissions.js
/debug/cookies.txt

# Scripts - ONLY in scripts folder
/scripts/verify-setup.ts
/scripts/migrate-data.sh
/scripts/create-user.ts

# Log files - ONLY in logs folder
/logs/frontend.log
/logs/api-server.log
/logs/docker.log

# Reports - ONLY in reports folder
/reports/security-audit.md
/reports/migration-summary.json
/reports/performance-analysis.md
```

#### ❌ FORBIDDEN - Never place these in root:
```bash
# ❌ NEVER create these in root directory:
./test-anything.js           # → Move to /test/
./debug-anything.ts          # → Move to /debug/
./screenshot.png             # → Move to /screenshots/
./verify-*.sh               # → Move to /scripts/
./admin-report.json          # → Move to /reports/
./api-trace.log             # → Move to /logs/
./cookies.txt               # → Move to /debug/
./take-screenshot.js        # → Move to /scripts/
```

#### 🎯 Quick Reference:
- **Any file starting with `test-`** → `/test/` folder
- **Any `.png`, `.jpg`, `.gif` screenshot** → `/screenshots/` folder  
- **Any file starting with `debug-`** → `/debug/` folder
- **Any `.log` file** → `/logs/` folder
- **Any `verify-`, `migrate-`, `fix-` script** → `/scripts/` folder
- **Any report, audit, or analysis** → `/reports/` folder

#### 🧹 Keep Root Clean:
Only these files should be in root directory:
- Core config: `package.json`, `tsconfig.json`, `.env`
- Next.js: `next.config.ts`, `middleware.ts`, `i18n.ts`
- Docker: `docker-compose.yml`
- Documentation: `README.md`, `CLAUDE.md`
- Build tools: `jest.config.js`, `eslint.config.mjs`

---

**Remember**: This file guides AI assistants. Keep it accurate and updated.