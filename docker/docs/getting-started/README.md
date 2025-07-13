# Getting Started with itellico Mono

Welcome to the itellico Mono! This guide will help you get up and running quickly.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **Redis** (v6 or higher) - Optional but recommended
- **Git**
- **npm** or **pnpm**

### Recommended Tools
- **VS Code** with recommended extensions
- **PostgreSQL GUI** (TablePlus, pgAdmin, etc.)
- **Redis GUI** (RedisInsight, etc.)
- **Postman** or similar for API testing

## Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mono-stable-app
```

### 2. Install Dependencies
```bash
# Install root dependencies
npm install

# Install API dependencies
cd apps/api && npm install && cd ../..
```

### 3. Set Up Environment Variables

Create `.env.local` in the root:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mono_platform"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# API
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

Create `apps/api/.env`:
```env
# Environment
NODE_ENV=development
PORT=3001

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/mono_platform"

# JWT
JWT_SECRET="your-jwt-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

### 4. Set Up Database
```bash
# Run Prisma migrations
npx prisma migrate dev

# Seed the database (optional)
npm run seed
```

### 5. Start Development Servers

**Recommended: Use separate terminals for better log monitoring**

```bash
# Terminal 1: Start Fastify API server (port 3001)
./start-api.sh

# Terminal 2: Start Next.js frontend (port 3000)
./start-frontend.sh
```

**Alternative options:**

Use the legacy script to run both in one terminal:
```bash
./start-dev.sh
```

Or run services manually:
```bash
# Terminal 1: Start API server
cd apps/api && npm run dev

# Terminal 2: Start Next.js frontend
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/documentation

### 7. Default Login

After seeding, you can login with:
- **Email**: admin@example.com
- **Password**: Admin123!@#

## Project Structure

```
mono-stable-app/
├── apps/
│   └── api/                 # Fastify API Server
│       ├── src/
│       │   ├── routes/     # API endpoints
│       │   ├── services/   # Business logic
│       │   └── plugins/    # Fastify plugins
│       └── package.json
│
├── src/                    # Next.js Frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks
│   └── lib/              # Utilities
│
├── prisma/               # Database schema
├── docs/                 # Documentation
├── scripts/              # Utility scripts
└── packages/             # Shared packages
```

## Development Workflow

### 1. Creating a New Feature

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Implement your feature following our [coding standards](../development/coding-standards.md)

3. Write tests for your feature

4. Update documentation

5. Submit a pull request

### 2. Common Development Tasks

**Add a new API endpoint:**
```bash
# Create route file in apps/api/src/routes/v1/
# Add route registration in apps/api/src/app.ts
```

**Add a new page:**
```bash
# Create page in src/app/
# Add navigation if needed
```

**Run tests:**
```bash
# API tests
cd apps/api && npm test

# Frontend tests
npm test
```

### 3. Database Changes

**Create a migration:**
```bash
npx prisma migrate dev --name your_migration_name
```

**Update Prisma Client:**
```bash
npx prisma generate
```

## Next Steps

Now that you have the platform running:

1. 📖 Read the [Architecture Overview](../architecture/README.md)
2. 🔐 Understand the [RBAC System](../features/rbac-system.md)
3. 🏢 Learn about [Multi-Tenancy](../features/multi-tenancy.md)
4. 🧪 Set up [Testing](../testing/README.md)
5. 🚀 Review [Deployment Guide](../deployment/README.md)

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9  # Frontend
lsof -ti:3001 | xargs kill -9  # API
```

**Database connection failed:**
- Check PostgreSQL is running
- Verify DATABASE_URL is correct
- Ensure database exists

**Module not found errors:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

- Check the [Troubleshooting Guide](../guides/troubleshooting.md)
- Review [FAQ](../reference/faq.md)
- Search existing issues on GitHub

---

*Last Updated: January 2025*