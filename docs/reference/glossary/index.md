---
title: Glossary
sidebar_label: Glossary
---

# Glossary

Comprehensive glossary of terms, concepts, and technologies used throughout the itellico Mono platform.

## A

### ABAC (Attribute-Based Access Control)
Access control paradigm whereby access rights are granted through the use of policies which combine attributes together. More flexible than traditional RBAC.

### Account
A business unit within a tenant. Can represent an agency, vendor, or individual business entity. Each account has its own users, settings, and resources.

### API Gateway
Entry point for all API requests. Handles authentication, rate limiting, and routing to appropriate services.

### Audit Log
Comprehensive record of all system activities including user actions, data changes, and system events for compliance and security purposes.

## B

### Blue-Green Deployment
Deployment strategy that reduces downtime by running two identical production environments called Blue and Green.

### Bull/BullMQ
Redis-based queue library for Node.js. Used for background job processing and task scheduling.

### Business Unit
See Account. An organizational entity within a tenant that manages its own resources and users.

## C

### Cache Invalidation
Process of removing or updating cached data when the underlying data changes. Critical for data consistency.

### CDN (Content Delivery Network)
Distributed network of servers that deliver web content based on geographic location. Used for static assets and media files.

### CLAUDE.md
Project instruction file that provides comprehensive guidance to AI assistants when working with the codebase.

### Content Management
System for creating, managing, and publishing digital content including articles, portfolios, and listings.

### CORS (Cross-Origin Resource Sharing)
Security feature that allows or restricts web applications running at one origin to access resources from another origin.

## D

### Data Model
Structure and relationships of data entities in the system. Implemented using Prisma ORM with PostgreSQL.

### Docker
Container platform used for packaging applications with their dependencies for consistent deployment across environments.

### Domain-Driven Design (DDD)
Software design approach focusing on modeling software to match a domain according to input from domain experts.

## E

### Edge Caching
Caching content at CDN edge locations closest to users for improved performance.

### Event-Driven Architecture
Design pattern where services communicate through events rather than direct calls, enabling loose coupling.

### Event Sourcing
Pattern of storing all changes to application state as a sequence of events.

## F

### Fastify
High-performance Node.js web framework used for the API server. Provides schema validation and plugin architecture.

### Feature Flag
Toggle that allows features to be enabled/disabled without deploying new code.

### Full-Text Search (FTS)
Database capability to search text content using natural language queries. Implemented using PostgreSQL's built-in FTS.

## G

### GitOps
Operational framework that takes DevOps best practices used for application development and applies them to infrastructure automation.

### Grafana
Open-source analytics and monitoring platform used for visualizing metrics from Prometheus and other data sources.

## H

### Health Check
Endpoint that reports the operational status of a service and its dependencies.

### Horizontal Pod Autoscaler (HPA)
Kubernetes feature that automatically scales the number of pods based on CPU utilization or custom metrics.

### HTTP-Only Cookie
Cookie that can't be accessed by client-side JavaScript, providing protection against XSS attacks.

## I

### Idempotency
Property where an operation can be performed multiple times without changing the result beyond the initial application.

### ISR (Incremental Static Regeneration)
Next.js feature allowing static pages to be updated after build time without rebuilding the entire site.

## J

### JWT (JSON Web Token)
Compact, URL-safe means of representing claims to be transferred between two parties. Used for authentication.

### Job Queue
System for handling asynchronous tasks and background processing. Implemented using Bull/BullMQ with Redis.

## K

### Kubernetes (K8s)
Container orchestration platform for automating deployment, scaling, and management of containerized applications.

### Key-Value Store
Type of NoSQL database that stores data as key-value pairs. Redis is used as the key-value store.

## L

### Listing
Marketplace entity representing a gig, job, service, or product that can be discovered and applied to.

### Load Balancer
Distributes incoming network traffic across multiple servers to ensure high availability and reliability.

### LRU (Least Recently Used)
Cache eviction policy that removes the least recently accessed items first when the cache is full.

## M

### MCP (Model Context Protocol)
Protocol for providing context to AI models. Used for documentation serving and code assistance.

### Microservices
Architectural style structuring an application as a collection of loosely coupled services.

### Migration
Process of updating database schema. Managed through Prisma Migrate for version control and rollback capability.

### Multi-Factor Authentication (MFA)
Security mechanism requiring two or more verification factors to gain access to a resource.

### Multi-Tenancy
Software architecture where a single instance serves multiple tenants with data isolation.

## N

### Next.js
React framework providing features like server-side rendering, static site generation, and API routes.

### Nginx
High-performance web server used as a reverse proxy and load balancer.

### N8N
Workflow automation tool used for integrating different services and automating business processes.

## O

### OAuth
Open standard for access delegation, commonly used for token-based authentication and authorization.

### OPA (Open Policy Agent)
Policy engine for unified authorization across the stack. Can be used for complex ABAC rules.

### Optimistic Updates
UI pattern where changes are reflected immediately before server confirmation, improving perceived performance.

### ORM (Object-Relational Mapping)
Programming technique for converting data between incompatible type systems. Prisma is the ORM used.

## P

### PII (Personally Identifiable Information)
Information that can be used to identify an individual. Requires special handling for privacy compliance.

### Platform Tier
Highest level in the 5-tier hierarchy with system-wide administrative capabilities.

### pnpm
Fast, disk space efficient package manager used instead of npm or yarn.

### PostgreSQL
Advanced open-source relational database used as the primary data store.

### Prisma
Next-generation ORM providing type-safe database access with auto-generated queries.

### Prometheus
Open-source monitoring system and time series database used for collecting and storing metrics.

## Q

### Query Builder
Tool or library for constructing database queries programmatically. Prisma provides a type-safe query builder.

### Queue Worker
Background process that consumes jobs from a queue and executes them asynchronously.

## R

### Rate Limiting
Technique to control the rate of requests a user can make to prevent abuse and ensure fair usage.

### RBAC (Role-Based Access Control)
Access control method that assigns permissions to roles rather than individual users.

### Redis
In-memory data structure store used as cache, message broker, and session store.

### Repository Pattern
Design pattern that encapsulates data access logic and provides a more object-oriented view of the persistence layer.

### REST (Representational State Transfer)
Architectural style for designing networked applications using HTTP methods.

### Rollback
Process of reverting to a previous version of software or database schema when issues arise.

## S

### Saga Pattern
Design pattern for managing distributed transactions across microservices.

### Server-Side Rendering (SSR)
Technique where web pages are rendered on the server rather than in the browser.

### Session Management
Process of maintaining user state across multiple requests. Implemented using Redis-backed sessions.

### Sharding
Database partitioning technique that separates large databases into smaller, more manageable pieces.

### Soft Delete
Marking records as deleted without physically removing them from the database, allowing recovery.

### SQL Injection
Security vulnerability where malicious SQL code is inserted into application queries. Prevented through parameterized queries.

### SSO (Single Sign-On)
Authentication scheme allowing users to log in with a single ID to multiple related systems.

### Swagger/OpenAPI
Specification for describing REST APIs. Used for automatic API documentation generation.

## T

### TanStack Query
Powerful asynchronous state management for TypeScript/JavaScript. Used for server state management in React.

### Temporal
Workflow orchestration platform for building reliable distributed applications.

### Tenant
Top-level organizational unit in the multi-tenant architecture. Provides complete data isolation.

### Three-Layer Caching
Caching strategy using browser cache, application cache (TanStack Query), and server cache (Redis).

### TOTP (Time-based One-Time Password)
Algorithm generating one-time passwords based on current time. Used for MFA implementation.

### Transaction
Database operation ensuring multiple operations succeed or fail as a unit, maintaining data consistency.

### TypeBox
JSON Schema Type Builder used for runtime validation and TypeScript type generation.

### TypeScript
Typed superset of JavaScript that compiles to plain JavaScript. Provides static typing and better tooling.

## U

### User Tier
Access level for individual users to manage their own resources and data.

### UUID (Universally Unique Identifier)
128-bit number used to uniquely identify information in computer systems.

## V

### Vault
Secure storage system for managing secrets, encryption keys, and sensitive data.

### Version Control
System for tracking changes in code over time. Git is used for version control.

### Virtual Private Cloud (VPC)
Isolated network environment in cloud infrastructure providing security and resource isolation.

## W

### WAF (Web Application Firewall)
Security layer protecting web applications from common exploits and vulnerabilities.

### WebSocket
Protocol providing full-duplex communication channels over a single TCP connection. Used for real-time features.

### Webhook
HTTP callback triggered by specific events, enabling real-time integrations between services.

### Worker Thread
Separate thread for running JavaScript in parallel, useful for CPU-intensive operations.

## X

### XSS (Cross-Site Scripting)
Security vulnerability where attackers inject malicious scripts into web pages viewed by other users.

## Y

### YAML
Human-readable data serialization language used for configuration files and data exchange.

## Z

### Zero-Downtime Deployment
Deployment strategy ensuring applications remain available during updates.

### Zustand
Lightweight state management solution for React applications. Used for client-side UI state.

## Related Documentation

- [Architecture Overview](/architecture)
- [API Design](/architecture/api-design)
- [Security Guide](/architecture/security)
- [Quick Start Guide](/reference/quick-start)