---
title: Security Architecture
sidebar_label: Security
---

# Security Architecture

Comprehensive security architecture implementing defense-in-depth principles to protect data, ensure privacy, and maintain platform integrity across all tiers of the system.

## Overview

Security principles:

- **Defense in Depth**: Multiple security layers
- **Zero Trust**: Never trust, always verify
- **Least Privilege**: Minimal necessary access
- **Data Protection**: Encryption everywhere
- **Audit Everything**: Complete activity trail

## Security Layers

### Network Security

```typescript
interface NetworkSecurity {
  edge: {
    waf: 'CloudFlare WAF';
    ddos: 'Rate limiting + CloudFlare';
    geo: 'Geographic restrictions';
  };
  transport: {
    tls: 'TLS 1.3 minimum';
    hsts: 'Strict Transport Security';
    certificates: 'Auto-renewed Let\'s Encrypt';
  };
  internal: {
    vpc: 'Private network isolation';
    subnets: 'Public/Private separation';
    nacls: 'Network ACLs';
    security_groups: 'Port restrictions';
  };
}
```

### Application Security

```typescript
interface ApplicationSecurity {
  authentication: {
    methods: ['password', 'oauth', 'sso', 'mfa'];
    sessions: 'Redis-backed JWT';
    refresh: 'Rotating refresh tokens';
  };
  authorization: {
    model: 'RBAC + ABAC';
    enforcement: 'Middleware + Guards';
    caching: 'Permission cache';
  };
  validation: {
    input: 'TypeBox schemas';
    output: 'Response filtering';
    files: 'Type + size validation';
  };
  headers: {
    csp: 'Content Security Policy';
    cors: 'Strict CORS rules';
    xss: 'X-XSS-Protection';
    clickjacking: 'X-Frame-Options';
  };
}
```

## Authentication System

### Multi-Factor Authentication

```typescript
interface MFASystem {
  factors: {
    knowledge: 'Password';
    possession: 'TOTP/SMS';
    inherence: 'Biometrics*';
  };
  implementation: {
    totp: {
      algorithm: 'SHA-256';
      digits: 6;
      period: 30;
      window: 1;
    };
    backup: {
      codes: 10;
      length: 8;
      usage: 'single-use';
    };
  };
}

// MFA flow
async function verifyMFA(user: User, code: string): Promise<boolean> {
  // Check TOTP code
  const secret = await decrypt(user.mfaSecret);
  const valid = authenticator.verify({
    token: code,
    secret: secret,
    window: 1,
  });
  
  if (!valid) {
    // Check backup codes
    const backupValid = await checkBackupCode(user.id, code);
    if (backupValid) {
      await markBackupCodeUsed(user.id, code);
      return true;
    }
  }
  
  return valid;
}
```

### Session Management

```typescript
interface SessionManagement {
  storage: {
    provider: 'Redis';
    encryption: 'AES-256-GCM';
    ttl: {
      access: 900; // 15 minutes
      refresh: 86400; // 24 hours
      remember: 2592000; // 30 days
    };
  };
  tokens: {
    access: {
      algorithm: 'RS256';
      claims: ['sub', 'tenant', 'permissions'];
      audience: 'api.itellico.com';
    };
    refresh: {
      type: 'opaque';
      rotation: 'on-use';
      family: 'detection';
    };
  };
}

// Session creation
async function createSession(user: User): Promise<Session> {
  const sessionId = crypto.randomBytes(32).toString('hex');
  const permissions = await getUserPermissions(user);
  
  const session = {
    id: sessionId,
    userId: user.id,
    tenantId: user.tenantId,
    permissions: permissions,
    createdAt: Date.now(),
    lastActivityAt: Date.now(),
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
  };
  
  // Store in Redis with encryption
  const encrypted = await encrypt(JSON.stringify(session));
  await redis.setex(
    `session:${sessionId}`,
    config.session.ttl,
    encrypted
  );
  
  return session;
}
```

### OAuth & SSO

```typescript
interface OAuthSSO {
  providers: {
    google: GoogleOAuth;
    github: GitHubOAuth;
    saml: SAMLProvider;
    oidc: OpenIDConnect;
  };
  flow: {
    authorization: 'PKCE';
    scopes: ['openid', 'email', 'profile'];
    state: 'CSRF protection';
  };
  linking: {
    strategy: 'Email matching';
    verification: 'Required';
    multiple: 'Allowed';
  };
}
```

## Authorization System

### Role-Based Access Control (RBAC)

```typescript
interface RBAC {
  hierarchy: {
    platform: ['super_admin'];
    tenant: ['tenant_admin', 'tenant_manager'];
    account: ['account_admin', 'account_member'];
    user: ['user'];
  };
  inheritance: {
    model: 'Hierarchical';
    direction: 'Top-down';
  };
}

// Role definition
interface Role {
  id: string;
  name: string;
  level: 'platform' | 'tenant' | 'account' | 'user';
  permissions: Permission[];
  inherits?: string[]; // Parent roles
}

// Permission check
async function hasPermission(
  user: User,
  permission: string,
  context?: Context
): Promise<boolean> {
  // Check cache first
  const cacheKey = `perm:${user.id}:${permission}:${context?.accountId}`;
  const cached = await redis.get(cacheKey);
  if (cached !== null) return cached === 'true';
  
  // Check user permissions
  const hasDirectPermission = user.permissions.includes(permission);
  
  // Check role permissions
  const rolePermissions = await getRolePermissions(user.roles);
  const hasRolePermission = rolePermissions.includes(permission);
  
  // Apply ABAC rules
  const abacResult = await evaluateABACRules(user, permission, context);
  
  const result = hasDirectPermission || hasRolePermission || abacResult;
  
  // Cache result
  await redis.setex(cacheKey, 300, result.toString());
  
  return result;
}
```

### Attribute-Based Access Control (ABAC)

```typescript
interface ABAC {
  attributes: {
    subject: ['role', 'department', 'level', 'location'];
    resource: ['owner', 'status', 'classification', 'tags'];
    action: ['read', 'write', 'delete', 'share'];
    environment: ['time', 'location', 'device'];
  };
  policies: Policy[];
  engine: 'OPA' | 'Custom';
}

// ABAC policy example
const policy: Policy = {
  id: 'content-access-policy',
  effect: 'allow',
  subjects: [{ role: 'editor' }],
  resources: [{ type: 'content', status: 'draft' }],
  actions: ['read', 'write'],
  conditions: [
    { attribute: 'resource.owner', operator: 'equals', value: 'subject.id' },
    { attribute: 'environment.time', operator: 'between', value: ['09:00', '18:00'] },
  ],
};

// Policy evaluation
async function evaluatePolicy(
  subject: Subject,
  resource: Resource,
  action: string,
  environment: Environment
): Promise<boolean> {
  for (const policy of policies) {
    if (matchesPolicy(policy, subject, resource, action, environment)) {
      return policy.effect === 'allow';
    }
  }
  return false; // Default deny
}
```

## Data Security

### Encryption

```typescript
interface EncryptionStrategy {
  atRest: {
    database: 'Transparent Data Encryption';
    files: 'AES-256-GCM';
    backups: 'Customer-managed keys';
  };
  inTransit: {
    external: 'TLS 1.3';
    internal: 'mTLS';
    queues: 'Message encryption';
  };
  keys: {
    management: 'AWS KMS / HashiCorp Vault';
    rotation: 'Automatic 90 days';
    algorithm: 'AES-256';
  };
}

// Field-level encryption
class FieldEncryption {
  private key: Buffer;
  
  async encrypt(data: string): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final(),
    ]);
    
    const tag = cipher.getAuthTag();
    
    return Buffer.concat([iv, tag, encrypted]).toString('base64');
  }
  
  async decrypt(encryptedData: string): Promise<string> {
    const buffer = Buffer.from(encryptedData, 'base64');
    
    const iv = buffer.slice(0, 16);
    const tag = buffer.slice(16, 32);
    const encrypted = buffer.slice(32);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(tag);
    
    return decipher.update(encrypted) + decipher.final('utf8');
  }
}
```

### Data Masking

```typescript
interface DataMasking {
  pii: {
    email: 'partial';
    phone: 'last-4';
    ssn: 'masked';
    creditCard: 'tokenized';
  };
  strategies: {
    static: 'Fixed replacement';
    dynamic: 'Format-preserving';
    tokenization: 'Reversible tokens';
  };
}

// PII masking
function maskPII(data: any): any {
  return {
    ...data,
    email: maskEmail(data.email),
    phone: maskPhone(data.phone),
    ssn: data.ssn ? '***-**-****' : null,
    creditCard: tokenize(data.creditCard),
  };
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  const masked = local[0] + '*'.repeat(local.length - 2) + local.slice(-1);
  return `${masked}@${domain}`;
}
```

## Input Validation & Sanitization

### Schema Validation

```typescript
interface ValidationStrategy {
  request: {
    body: 'TypeBox schemas';
    query: 'Validated parameters';
    headers: 'Whitelist approach';
    files: 'Type + size + content';
  };
  sanitization: {
    html: 'DOMPurify';
    sql: 'Parameterized queries';
    nosql: 'Operator injection prevention';
    path: 'Path traversal prevention';
  };
}

// Request validation middleware
const validateRequest = (schema: TSchema) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate body
      if (req.body) {
        const valid = ajv.validate(schema.body, req.body);
        if (!valid) {
          return reply.status(400).send({
            error: 'VALIDATION_ERROR',
            details: ajv.errors,
          });
        }
      }
      
      // Sanitize inputs
      req.body = sanitizeObject(req.body);
      req.query = sanitizeObject(req.query);
      
    } catch (error) {
      return reply.status(400).send({
        error: 'INVALID_REQUEST',
      });
    }
  };
};
```

### File Upload Security

```typescript
interface FileUploadSecurity {
  validation: {
    types: ['image/jpeg', 'image/png', 'application/pdf'];
    maxSize: 10 * 1024 * 1024; // 10MB
    namePattern: /^[a-zA-Z0-9-_.]+$/;
  };
  scanning: {
    antivirus: 'ClamAV';
    content: 'Magic number verification';
  };
  storage: {
    location: 'Outside web root';
    permissions: '644';
    encryption: 'At-rest encryption';
  };
}

// Secure file upload
async function handleFileUpload(file: MultipartFile): Promise<UploadResult> {
  // Validate file type
  if (!ALLOWED_TYPES.includes(file.mimetype)) {
    throw new Error('Invalid file type');
  }
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  // Scan for viruses
  const clean = await scanFile(file.buffer);
  if (!clean) {
    throw new Error('File failed security scan');
  }
  
  // Generate secure filename
  const ext = path.extname(file.filename);
  const filename = `${crypto.randomBytes(16).toString('hex')}${ext}`;
  
  // Store securely
  const location = await storeFile(file.buffer, filename);
  
  return { location, filename };
}
```

## API Security

### Rate Limiting

```typescript
interface RateLimiting {
  strategies: {
    global: 'Overall API rate limit';
    perUser: 'User-specific limits';
    perEndpoint: 'Endpoint-specific limits';
    perTenant: 'Tenant-based limits';
  };
  implementation: {
    store: 'Redis';
    algorithm: 'Sliding window';
    headers: 'X-RateLimit-*';
  };
}

// Rate limiter configuration
const rateLimiter = {
  global: {
    points: 1000,
    duration: 60, // per minute
  },
  perUser: {
    points: 100,
    duration: 60,
  },
  perEndpoint: {
    '/api/v1/auth/login': { points: 5, duration: 900 }, // 5 per 15 min
    '/api/v1/user/upload': { points: 10, duration: 3600 }, // 10 per hour
  },
};
```

### API Keys & Tokens

```typescript
interface APIKeyManagement {
  generation: {
    length: 32;
    prefix: 'sk_live_' | 'sk_test_';
    checksum: 'Last 4 chars';
  };
  storage: {
    hashed: 'Argon2id';
    metadata: 'Encrypted';
    rotation: 'Supported';
  };
  validation: {
    format: 'Regex check';
    existence: 'Cache lookup';
    permissions: 'Scope check';
  };
}

// API key generation
function generateAPIKey(type: 'live' | 'test'): APIKey {
  const raw = crypto.randomBytes(32).toString('base64url');
  const prefix = type === 'live' ? 'sk_live_' : 'sk_test_';
  const key = prefix + raw;
  const checksum = calculateChecksum(key);
  
  return {
    key: key + checksum,
    hash: argon2.hash(key),
    created: new Date(),
  };
}
```

## Security Monitoring

### Audit Logging

```typescript
interface AuditLogging {
  events: {
    authentication: ['login', 'logout', 'failed_login', 'mfa'];
    authorization: ['permission_granted', 'permission_denied'];
    data: ['create', 'read', 'update', 'delete'];
    admin: ['user_created', 'role_assigned', 'settings_changed'];
  };
  storage: {
    immediate: 'Application database';
    archive: 'S3 cold storage';
    retention: '7 years';
  };
  analysis: {
    realtime: 'CloudWatch Insights';
    forensics: 'Splunk';
    alerts: 'Anomaly detection';
  };
}

// Audit log entry
async function auditLog(event: AuditEvent): Promise<void> {
  const entry = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    tenantId: event.tenantId,
    userId: event.userId,
    action: event.action,
    resource: event.resource,
    result: event.result,
    metadata: event.metadata,
    ip: event.ip,
    userAgent: event.userAgent,
  };
  
  // Write to database
  await db.auditLog.create({ data: entry });
  
  // Stream to monitoring
  await streamToMonitoring(entry);
  
  // Check for anomalies
  await checkAnomalies(entry);
}
```

### Threat Detection

```typescript
interface ThreatDetection {
  patterns: {
    bruteForce: 'Multiple failed logins';
    scanning: 'Sequential ID access';
    injection: 'SQL/NoSQL patterns';
    dos: 'High request rate';
  };
  responses: {
    block: 'Temporary IP ban';
    challenge: 'CAPTCHA';
    notify: 'Alert administrators';
    investigate: 'Deep packet inspection';
  };
}

// Anomaly detection
async function detectAnomalies(activity: UserActivity): Promise<ThreatLevel> {
  const patterns = [
    checkBruteForce(activity),
    checkUnusualLocation(activity),
    checkImpossibleTravel(activity),
    checkSuspiciousPatterns(activity),
  ];
  
  const threats = await Promise.all(patterns);
  const maxThreat = Math.max(...threats);
  
  if (maxThreat > THREAT_THRESHOLD) {
    await handleThreat(activity, maxThreat);
  }
  
  return maxThreat;
}
```

## Compliance & Privacy

### GDPR Compliance

```typescript
interface GDPRCompliance {
  rights: {
    access: 'Data export';
    rectification: 'Data correction';
    erasure: 'Right to be forgotten';
    portability: 'Data transfer';
    restriction: 'Processing limits';
  };
  implementation: {
    consent: 'Explicit tracking';
    purpose: 'Limitation enforcement';
    minimization: 'Data collection limits';
    accuracy: 'Update mechanisms';
    storage: 'Retention policies';
  };
}

// Data export for GDPR
async function exportUserData(userId: string): Promise<UserDataExport> {
  const data = {
    profile: await db.user.findUnique({ where: { id: userId } }),
    content: await db.content.findMany({ where: { userId } }),
    activity: await db.activity.findMany({ where: { userId } }),
    // ... all user data
  };
  
  // Encrypt export
  const encrypted = await encrypt(JSON.stringify(data));
  
  // Create download link
  const url = await createSecureDownload(encrypted, userId);
  
  return { url, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
}
```

### Security Headers

```typescript
// Security headers configuration
const securityHeaders = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' wss: https:",
  ].join('; '),
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};
```

## Incident Response

### Response Plan

```typescript
interface IncidentResponse {
  phases: {
    detection: 'Automated monitoring';
    containment: 'Isolate affected systems';
    eradication: 'Remove threat';
    recovery: 'Restore services';
    lessons: 'Post-mortem analysis';
  };
  team: {
    lead: 'Security Officer';
    members: ['DevOps', 'Development', 'Legal', 'PR'];
  };
  communication: {
    internal: 'Slack + PagerDuty';
    external: 'Status page + Email';
    regulatory: 'Within 72 hours';
  };
}
```

## Best Practices

1. **Security by Design**: Build security in, not bolt on
2. **Principle of Least Privilege**: Minimal necessary access
3. **Defense in Depth**: Multiple security layers
4. **Fail Securely**: Secure defaults, fail closed
5. **Don't Trust User Input**: Validate everything
6. **Audit Everything**: Complete activity trail
7. **Keep It Simple**: Complexity is the enemy
8. **Stay Updated**: Patch regularly

## Related Documentation

- [Authentication Guide](/guides/authentication)
- [Authorization Guide](/guides/authorization)
- [API Security](/api/security)
- [Compliance Guide](/guides/compliance)