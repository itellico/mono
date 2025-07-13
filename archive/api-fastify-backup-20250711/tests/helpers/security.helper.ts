/**
 * Security Testing Helper
 * Tools for comprehensive security testing based on OWASP guidelines
 */

import { TestAppHelper, TestRequest } from './app.helper';
import crypto from 'crypto';

export class SecurityTestHelper {
  private app: TestAppHelper;

  constructor(app?: TestAppHelper) {
    this.app = app || new TestAppHelper();
  }

  /**
   * SQL Injection test payloads
   */
  getSQLInjectionPayloads(): string[] {
    return [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1' AND '1'='1",
      "\\'; DROP TABLE users; --",
      "' OR 1=1 --",
      "admin'--",
      "' OR 'a'='a",
      "') OR ('1'='1",
      "' OR id IS NOT NULL --",
      // PostgreSQL specific
      "'; SELECT pg_sleep(5); --",
      "' OR EXISTS(SELECT * FROM users) --",
      // Unicode variants
      "\u0027 OR \u00271\u0027=\u00271",
      // Encoded variants
      "%27%20OR%20%271%27%3D%271",
    ];
  }

  /**
   * XSS test payloads
   */
  getXSSPayloads(): string[] {
    return [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      'javascript:alert("XSS")',
      '<iframe src="javascript:alert(\'XSS\')">',
      '<body onload=alert("XSS")>',
      '"><script>alert("XSS")</script>',
      '<script>alert(String.fromCharCode(88,83,83))</script>',
      '<<SCRIPT>alert("XSS");//<</SCRIPT>',
      '<img src="x" onerror="alert(1)">',
      // Event handlers
      'onmouseover="alert(1)"',
      'onclick="alert(1)"',
      // Encoded
      '&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;',
      '%3Cscript%3Ealert(%22XSS%22)%3C/script%3E',
    ];
  }

  /**
   * NoSQL Injection payloads
   */
  getNoSQLInjectionPayloads(): any[] {
    return [
      { $ne: null },
      { $gt: "" },
      { $regex: ".*" },
      { $where: "this.password.length > 0" },
      { password: { $ne: 1 } },
      { $or: [{ a: 1 }, { b: 2 }] },
      { "$where": "sleep(5000)" },
    ];
  }

  /**
   * Test for timing attacks
   */
  async testTimingAttack(
    endpoint: string,
    payloads: Array<{ email: string; password: string }>
  ): Promise<number[]> {
    const timings: number[] = [];

    for (const payload of payloads) {
      const times: number[] = [];
      
      // Run multiple times to get average
      for (let i = 0; i < 5; i++) {
        const time = await this.app.measureResponseTime({
          method: 'POST',
          url: endpoint,
          payload
        });
        times.push(time);
      }
      
      // Calculate average
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      timings.push(avgTime);
    }

    return timings;
  }

  /**
   * Test user enumeration
   */
  async testUserEnumeration(endpoint: string) {
    const existingEmail = 'superadmin@test.com';
    const nonExistingEmail = `nonexistent${Date.now()}@example.com`;

    const [existingResponse, nonExistingResponse] = await Promise.all([
      this.app.request({
        method: 'POST',
        url: endpoint,
        payload: { email: existingEmail, password: 'wrongpassword' }
      }),
      this.app.request({
        method: 'POST',
        url: endpoint,
        payload: { email: nonExistingEmail, password: 'wrongpassword' }
      })
    ]);

    // Measure response times
    const existingTime = await this.app.measureResponseTime({
      method: 'POST',
      url: endpoint,
      payload: { email: existingEmail, password: 'wrongpassword' }
    });

    const nonExistingTime = await this.app.measureResponseTime({
      method: 'POST',
      url: endpoint,
      payload: { email: nonExistingEmail, password: 'wrongpassword' }
    });

    return {
      existingUser: {
        statusCode: existingResponse.statusCode,
        message: existingResponse.json().message || existingResponse.json().error,
        error: existingResponse.json().error,
        responseTime: existingTime
      },
      nonExistingUser: {
        statusCode: nonExistingResponse.statusCode,
        message: nonExistingResponse.json().message || nonExistingResponse.json().error,
        error: nonExistingResponse.json().error,
        responseTime: nonExistingTime
      }
    };
  }

  /**
   * Test brute force protection
   */
  async bruteForceAttack(
    endpoint: string,
    options: { attempts: number; timeWindow: number }
  ): Promise<{ blockedAt: number; returnedStatus: number; headers: any }> {
    // Enable rate limiting for this test by setting a special header
    process.env.FORCE_RATE_LIMIT = 'true';
    
    let blockedAt = -1;
    let lastResponse: any;

    for (let i = 0; i < options.attempts; i++) {
      const response = await this.app.request({
        method: 'POST',
        url: endpoint,
        payload: {
          email: 'test@example.com',
          password: `attempt${i}`
        },
        headers: {
          'x-test-rate-limit': 'true'
        }
      });

      lastResponse = response;

      if (response.statusCode === 429) {
        blockedAt = i + 1;
        break;
      }
    }

    // Disable rate limiting after test
    delete process.env.FORCE_RATE_LIMIT;

    return {
      blockedAt,
      returnedStatus: lastResponse.statusCode,
      headers: lastResponse.headers
    };
  }

  /**
   * Test security headers
   */
  async testSecurityHeaders(endpoint: string): Promise<Record<string, string>> {
    const response = await this.app.request({
      method: 'GET',
      url: endpoint
    });

    const securityHeaders = [
      'strict-transport-security',
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'content-security-policy',
      'x-permitted-cross-domain-policies',
      'referrer-policy',
      'permissions-policy'
    ];

    const headers: Record<string, string> = {};
    for (const header of securityHeaders) {
      headers[header] = response.headers[header] || 'NOT SET';
    }

    return headers;
  }

  /**
   * Test CORS configuration
   */
  async testCORS(endpoint: string, origins: string[]) {
    const results = [];

    for (const origin of origins) {
      const response = await this.app.request({
        method: 'OPTIONS',
        url: endpoint,
        headers: {
          'Origin': origin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      results.push({
        origin,
        allowed: response.headers['access-control-allow-origin'] === origin,
        headers: {
          'access-control-allow-origin': response.headers['access-control-allow-origin'],
          'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
          'access-control-allow-methods': response.headers['access-control-allow-methods']
        }
      });
    }

    return results;
  }

  /**
   * Test JWT token security
   */
  async testJWTSecurity(token: string) {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      return { valid: false, error: 'Invalid token format' };
    }

    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());

      return {
        valid: true,
        header,
        payload,
        security: {
          hasAlgorithm: !!header.alg,
          algorithmSecure: header.alg !== 'none' && header.alg !== 'alg',
          hasExpiration: !!payload.exp,
          hasIssuedAt: !!payload.iat,
          hasSubject: !!payload.sub,
          expirationTime: payload.exp ? new Date(payload.exp * 1000) : null
        }
      };
    } catch (error) {
      return { valid: false, error: 'Failed to parse token' };
    }
  }

  /**
   * Test authorization bypass attempts
   */
  async testAuthorizationBypass(
    userToken: string,
    adminEndpoints: string[]
  ): Promise<Array<{ endpoint: string; statusCode: number; bypassed: boolean }>> {
    const results = [];

    for (const endpoint of adminEndpoints) {
      const response = await this.app.request({
        method: 'GET',
        url: endpoint,
        headers: {
          'authorization': `Bearer ${userToken}`
        }
      });

      results.push({
        endpoint,
        statusCode: response.statusCode,
        bypassed: response.statusCode === 200
      });
    }

    return results;
  }

  /**
   * Test for common security misconfigurations
   */
  async testSecurityMisconfigurations() {
    const tests = [
      // Debug endpoints
      { url: '/debug', expectedStatus: 404 },
      { url: '/.env', expectedStatus: 404 },
      { url: '/config', expectedStatus: 404 },
      { url: '/admin', expectedStatus: [401, 403, 404] },
      
      // Stack traces
      { url: '/api/v1/error', method: 'POST', checkStackTrace: true },
      
      // Directory listing
      { url: '/uploads/', expectedStatus: [403, 404] },
      { url: '/api/', expectedStatus: [404] },
    ];

    const results = [];

    for (const test of tests) {
      const response = await this.app.request({
        method: test.method as any || 'GET',
        url: test.url
      });

      const result: any = {
        url: test.url,
        statusCode: response.statusCode,
        passed: Array.isArray(test.expectedStatus) 
          ? test.expectedStatus.includes(response.statusCode)
          : response.statusCode === test.expectedStatus
      };

      if (test.checkStackTrace) {
        const body = response.body;
        result.exposesStackTrace = body.includes('stack') || body.includes('Error:');
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Generate security report
   */
  async generateSecurityReport(results: any, outputPath: string) {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        critical: [],
        high: [],
        medium: [],
        low: []
      },
      details: results
    };

    // Categorize issues
    for (const test of results) {
      if (test.severity === 'critical') report.summary.critical.push(test);
      else if (test.severity === 'high') report.summary.high.push(test);
      else if (test.severity === 'medium') report.summary.medium.push(test);
      else if (test.severity === 'low') report.summary.low.push(test);
    }

    // Write report
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, JSON.stringify(report, null, 2));

    return report;
  }

  /**
   * Test payload injection in various fields
   */
  async injectPayload(endpoint: string, payload: any) {
    return this.app.request({
      method: 'POST',
      url: endpoint,
      payload
    });
  }

  /**
   * Get all endpoints from app
   */
  getAllEndpoints(): string[] {
    // This would be implemented to extract all routes from Fastify app
    return [
      '/api/v1/public/auth/login',
      '/api/v1/public/auth/register',
      '/api/v1/public/auth/logout',
      '/api/v1/user/profile',
      '/api/v1/account/users',
      '/api/v1/tenant/settings',
      '/api/v1/platform/users',
      '/api/v1/platform/audit'
    ];
  }
}

/**
 * OWASP Security Validator
 */
export class OWASPValidator {
  /**
   * Run comprehensive security audit
   */
  async runFullSecurityAudit(config: {
    baseUrl: string;
    endpoints: string[];
    authentication: any;
  }) {
    const results = {
      critical: [] as any[],
      high: [] as any[],
      medium: [] as any[],
      low: [] as any[],
      info: [] as any[]
    };

    // Implement OWASP Top 10 checks
    // This would be a comprehensive implementation

    return results;
  }

  /**
   * Get SQL injection payloads
   */
  getSQLInjectionPayloads(): string[] {
    return new SecurityTestHelper().getSQLInjectionPayloads();
  }
}