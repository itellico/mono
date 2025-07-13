# itellico Mono Documentation

Welcome to the comprehensive documentation for itellico Mono - a multi-tenant SaaS marketplace platform built with modern technologies and best practices.

## 🚀 Installation & Setup

### [📦 Installation Documentation](./installation/)
Complete guide for installing and configuring the itellico Mono platform from JSON configuration files. Includes platform setup, tenant configuration, account hierarchies, and the complete 5-tier architecture.

- [Quick Start Guide](./installation/quick-reference.md)
- [Platform Configuration](./installation/platform-configuration.md)
- [Tenant Configuration](./installation/tenant-configuration.md)

## 🏗️ 5-Tier Architecture

Our documentation is organized around the actual 5-tier architecture of the application:

### [🌐 Platform](./platform/)
System-wide administration and tenant management. Super admin level functionality for managing the entire platform.

### [🏢 Tenant](./tenant/) 
Individual marketplace administration. Manage specific marketplaces and their unique configurations.

### [👥 Account](./account/)
Business and agency management. Feature-based account system supporting various business models.

### [👤 User](./user/)
Individual user operations. Personal workspace and user-specific functionality.

### [🌍 Public](./public/)
Public marketplace browsing and discovery. No authentication required.

## 📚 Supporting Documentation

### [🏗️ Architecture](./architecture/)
System architecture, design patterns, and technical specifications.

### [⚙️ Development](./development/)
Developer guides, workflows, testing, and deployment documentation.

### [📖 Reference](./reference/)
Quick reference materials, troubleshooting, and glossary.

## 🚀 Quick Start

1. **Installation**: Follow the [Installation Guide](./installation/)
   - Platform setup: `pnpm tsx installation/install.ts`
   - With tenant: `pnpm tsx installation/install.ts --tenant=go-models.com`
   - [Quick Reference](./installation/quick-reference.md) for all commands
2. **New Developers**: Start with [Development Getting Started](./development/getting-started/)
3. **API Users**: Check the [Fastify API Documentation](http://localhost:3001/docs)
4. **System Admins**: Review [Platform Documentation](./platform/)
5. **Troubleshooting**: Visit [Reference Troubleshooting](./reference/troubleshooting/)

## 🎯 Navigation

This documentation is designed to be:
- **Hierarchical**: Matches the actual application structure
- **Searchable**: Integrated with MCP server for semantic search
- **Comprehensive**: Covers all aspects of the platform
- **Up-to-date**: Reflects current implementation status

## 🔍 Search

Use the MCP server integration for powerful semantic search across all documentation:

```bash
# Installation and setup
claude-code search "installation guide"
claude-code search "tenant configuration"

# Search for authentication documentation
claude-code search "authentication best practices"

# Find API endpoint information  
claude-code search "user profile endpoints"

# Get architecture guidance
claude-code search "caching strategy"
```

---

*This documentation structure was reorganized in January 2025 to align with the actual 5-tier application architecture and improve navigation and discoverability.*
