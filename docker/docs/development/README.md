# Development Documentation

This section contains all development-related documentation for the itellico Mono project.

## 📋 Development Guides

### 🎨 [Component Library Guide](./COMPONENT_LIBRARY_GUIDE.md) **NEW!**
Central reference for all reusable UI components:
- Live component examples at `/dev/components`
- Layout patterns (AdminListLayout, AdminEditLayout)
- Data display components (DataTable, StatusBadge)
- Form components (SearchBar, FilterPanel)
- Best practices and usage patterns
- Creating new components

### 🐳 [Docker Services Guide](./DOCKER_SERVICES_GUIDE.md)
Complete guide to the Docker development infrastructure including:
- Redis caching and RedisInsight GUI
- Mailpit email testing
- N8N workflow automation
- Temporal workflow orchestration
- Grafana + Prometheus monitoring stack
- Service configuration and troubleshooting

### 🔧 Infrastructure Setup
- **Database**: PostgreSQL (local)
- **Cache**: Redis (Docker)
- **Email**: Mailpit (Docker)
- **Workflows**: N8N + Temporal (Docker)
- **Monitoring**: Grafana + Prometheus (Docker)

### 🚀 Quick Start
```bash
# Start all Docker services
./scripts/setup-services.sh

# Start development servers
cd apps/api && npm run dev    # API on :3001
npm run dev                   # Frontend on :3000
```

## 📊 Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Main Application** | http://localhost:3000 | - |
| **API Server** | http://localhost:3001 | - |
| **Email Testing** | http://localhost:8025 | - |
| **Redis GUI** | http://localhost:5540 | host: `mono-redis` |
| **Workflows** | http://localhost:5678 | admin/admin123 |
| **Temporal** | http://localhost:8080 | - |
| **Grafana** | http://localhost:5005 | admin/admin123 |
| **Prometheus** | http://localhost:9090 | - |

## 🛠️ Development Standards

### Code Quality
- TypeScript strict mode
- ESLint + Prettier
- Pre-commit hooks
- 80%+ test coverage

### Git Workflow
- Feature branches
- Pull request reviews
- Conventional commits
- Automated CI/CD

### Testing Strategy
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)
- Visual regression tests

## 📁 Project Structure

```
/
├── apps/
│   ├── api/                 # Fastify API server
│   └── web/                 # Next.js frontend
├── packages/                # Shared packages
├── scripts/                 # Development scripts
├── docker/                  # Docker configurations
├── docs/                    # Documentation
└── prisma/                  # Database schema
```

## 🔍 Debugging

### API Server
```bash
# View API logs
cd apps/api && npm run dev

# Debug specific routes
curl http://localhost:3001/api/v1/health
```

### Frontend
```bash
# Development mode
npm run dev

# Build and test
npm run build
npm start
```

### Database
```bash
# View schema
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate client
npx prisma generate
```

## 📈 Performance Monitoring

### Local Development
- **Grafana**: http://localhost:5005 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Redis Metrics**: RedisInsight at :5540

### Key Metrics
- API response times
- Database query performance
- Cache hit/miss ratios
- Memory usage
- Error rates

## 🚨 Common Issues

### Port Conflicts
```bash
# Kill conflicting processes
lsof -ti:3000,3001,6379 | xargs kill -9
```

### Docker Issues
```bash
# Reset Docker services
docker-compose -f docker-compose.services.yml down -v
docker-compose -f docker-compose.services.yml up -d
```

### Database Issues
```bash
# Reset and seed database
npx prisma migrate reset
npm run seed
```

## 📚 Additional Resources

- [Project Architecture](../architecture/README.md)
- [API Documentation](../api/README.md)
- [Testing Guide](../testing/README.md)
- [Deployment Guide](../deployment/README.md)

---

*Last Updated: July 2025*