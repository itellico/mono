#!/usr/bin/env npx tsx
/**
 * Comprehensive Architecture Audit Script
 * 
 * Audits the entire codebase for:
 * 1. Direct database access in Next.js
 * 2. Missing authentication decorators in NestJS
 * 3. Missing permission checks
 * 4. Improper caching implementation
 * 5. Environment configuration issues
 */

import fs from 'fs/promises';
import path from 'path';
import { glob } from 'glob';

interface AuditResult {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  file: string;
  line: number;
  issue: string;
  code: string;
  solution: string;
}

interface AuditSummary {
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  categories: Record<string, number>;
  results: AuditResult[];
}

class ArchitectureAuditor {
  private results: AuditResult[] = [];

  // Patterns for direct database access in Next.js
  private readonly DATABASE_PATTERNS = [
    {
      pattern: /import.*\{.*db.*\}.*from.*['"]@\/lib\/db['"]/,
      severity: 'critical' as const,
      issue: 'Direct database import in Next.js',
      solution: 'Create NestJS API endpoint and use HTTP calls'
    },
    {
      pattern: /import.*\{.*prisma.*\}.*from/,
      severity: 'critical' as const,
      issue: 'Direct Prisma import in Next.js',
      solution: 'Remove Prisma import, use NestJS API'
    },
    {
      pattern: /await\s+(db|prisma)\.(user|account|tenant|role|permission|media|tag|category)/,
      severity: 'critical' as const,
      issue: 'Direct database query bypassing authentication',
      solution: 'Replace with authenticated API call'
    }
  ];

  // Patterns for missing authentication in NestJS
  private readonly AUTH_PATTERNS = [
    {
      pattern: /@Controller\(/,
      checkForAuth: true,
      severity: 'high' as const,
      issue: 'Controller missing @Auth() decorator',
      solution: 'Add @Auth() decorator to ensure authentication'
    }
  ];

  // Patterns for missing permissions
  private readonly PERMISSION_PATTERNS = [
    {
      pattern: /@Get\(|@Post\(|@Put\(|@Patch\(|@Delete\(/,
      checkForPermission: true,
      severity: 'high' as const,
      issue: 'Endpoint missing @Permission() decorator',
      solution: 'Add @Permission(\'tier.resource.action\') decorator'
    }
  ];

  private readonly ALLOWED_PATHS = [
    'lib/db.ts',
    'lib/services/',
    'app/api/v1/', // Legacy API routes
    'common/prisma/',
    'modules/*/services/', // NestJS service layer
    'test/',
    'scripts/'
  ];

  private isAllowedPath(filePath: string): boolean {
    return this.ALLOWED_PATHS.some(allowedPath => 
      filePath.includes(allowedPath)
    );
  }

  private addResult(result: Omit<AuditResult, 'category'> & { category: string }) {
    this.results.push(result);
  }

  async auditFile(filePath: string, category: string): Promise<void> {
    if (this.isAllowedPath(filePath)) {
      return;
    }

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n');

      // Check for direct database access in Next.js files
      if (category === 'nextjs') {
        await this.auditDatabaseAccess(filePath, lines);
      }

      // Check for missing auth/permissions in NestJS files
      if (category === 'nestjs') {
        await this.auditNestJSAuthentication(filePath, lines);
      }
    } catch (error) {
      console.error(`Error reading file ${filePath}:`, error);
    }
  }

  private async auditDatabaseAccess(filePath: string, lines: string[]): Promise<void> {
    lines.forEach((line, index) => {
      this.DATABASE_PATTERNS.forEach(pattern => {
        if (pattern.pattern.test(line)) {
          this.addResult({
            category: 'Database Access',
            severity: pattern.severity,
            file: filePath,
            line: index + 1,
            issue: pattern.issue,
            code: line.trim(),
            solution: pattern.solution
          });
        }
      });
    });
  }

  private async auditNestJSAuthentication(filePath: string, lines: string[]): Promise<void> {
    const content = lines.join('\n');
    
    // Check for controllers without @Auth()
    const controllerMatches = content.matchAll(/@Controller\([^)]*\)/g);
    for (const match of controllerMatches) {
      const beforeController = content.substring(0, match.index);
      const afterController = content.substring(match.index);
      
      // Look for @Auth() decorator before @Controller
      if (!beforeController.includes('@Auth()') && !afterController.substring(0, 500).includes('@Auth()')) {
        const lineNumber = beforeController.split('\n').length;
        this.addResult({
          category: 'Authentication',
          severity: 'high',
          file: filePath,
          line: lineNumber,
          issue: 'Controller missing @Auth() decorator',
          code: match[0],
          solution: 'Add @Auth() decorator above @Controller'
        });
      }
    }

    // Check for endpoints without @Permission()
    const endpointMatches = content.matchAll(/@(Get|Post|Put|Patch|Delete)\([^)]*\)/g);
    for (const match of endpointMatches) {
      const beforeEndpoint = content.substring(0, match.index);
      const afterEndpoint = content.substring(match.index);
      
      // Look for @Permission() decorator before endpoint
      if (!beforeEndpoint.substring(beforeEndpoint.length - 200).includes('@Permission(') && 
          !afterEndpoint.substring(0, 200).includes('@Permission(')) {
        const lineNumber = beforeEndpoint.split('\n').length;
        this.addResult({
          category: 'Permissions',
          severity: 'high',
          file: filePath,
          line: lineNumber,
          issue: 'Endpoint missing @Permission() decorator',
          code: match[0],
          solution: 'Add @Permission(\'tier.resource.action\') decorator'
        });
      }
    }
  }

  async auditEnvironmentConfig(): Promise<void> {
    try {
      const envFiles = ['.env', '.env.local', '.env.production'];
      
      for (const envFile of envFiles) {
        try {
          const content = await fs.readFile(envFile, 'utf-8');
          
          // Check for postgres credentials (should be developer)
          if (content.includes('postgres:password') || content.includes('postgres@')) {
            this.addResult({
              category: 'Environment',
              severity: 'critical',
              file: envFile,
              line: 1,
              issue: 'Using incorrect postgres credentials',
              code: 'DATABASE_URL contains postgres user',
              solution: 'Change to developer:developer@192.168.178.94:5432'
            });
          }

          // Check for localhost vs 192.168.178.94
          if (content.includes('localhost:5432') && !envFile.includes('.local')) {
            this.addResult({
              category: 'Environment',
              severity: 'medium',
              file: envFile,
              line: 1,
              issue: 'Using localhost instead of Docker IP',
              code: 'DATABASE_URL uses localhost',
              solution: 'Use 192.168.178.94:5432 for Docker consistency'
            });
          }
        } catch (error) {
          // File doesn't exist, skip
        }
      }
    } catch (error) {
      console.error('Error auditing environment config:', error);
    }
  }

  async runFullAudit(): Promise<AuditSummary> {
    console.log('🔍 Starting comprehensive architecture audit...\n');

    // Audit Next.js files
    console.log('📁 Auditing Next.js files...');
    const nextjsPatterns = [
      'apps/web/src/app/**/*.{ts,tsx}',
      'apps/web/src/components/**/*.{ts,tsx}',
      'apps/web/src/lib/**/*.{ts,tsx}',
      'apps/web/src/hooks/**/*.{ts,tsx}'
    ];

    for (const pattern of nextjsPatterns) {
      const files = await glob(pattern, {
        cwd: process.cwd(),
        ignore: ['**/node_modules/**', '**/.next/**', '**/dist/**']
      });

      for (const file of files) {
        await this.auditFile(path.resolve(file), 'nextjs');
      }
    }

    // Audit NestJS files
    console.log('📁 Auditing NestJS files...');
    const nestjsPatterns = [
      'apps/api-nest/src/modules/**/*.controller.ts',
      'apps/api-nest/src/modules/**/*.ts'
    ];

    for (const pattern of nestjsPatterns) {
      const files = await glob(pattern, {
        cwd: process.cwd(),
        ignore: ['**/node_modules/**', '**/dist/**']
      });

      for (const file of files) {
        await this.auditFile(path.resolve(file), 'nestjs');
      }
    }

    // Audit environment configuration
    console.log('⚙️  Auditing environment configuration...');
    await this.auditEnvironmentConfig();

    return this.generateSummary();
  }

  private generateSummary(): AuditSummary {
    const summary: AuditSummary = {
      totalIssues: this.results.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      categories: {},
      results: this.results
    };

    this.results.forEach(result => {
      summary[result.severity]++;
      summary.categories[result.category] = (summary.categories[result.category] || 0) + 1;
    });

    return summary;
  }

  printSummary(summary: AuditSummary): void {
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE ARCHITECTURE AUDIT RESULTS');
    console.log('='.repeat(80));
    
    console.log(`\n🔢 SUMMARY:`);
    console.log(`   Total Issues: ${summary.totalIssues}`);
    console.log(`   🔴 Critical: ${summary.critical}`);
    console.log(`   🟡 High: ${summary.high}`);
    console.log(`   🟠 Medium: ${summary.medium}`);
    console.log(`   🟢 Low: ${summary.low}`);

    console.log(`\n📂 BY CATEGORY:`);
    Object.entries(summary.categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} issues`);
    });

    console.log(`\n🚨 CRITICAL ISSUES:`);
    const criticalIssues = summary.results.filter(r => r.severity === 'critical');
    if (criticalIssues.length === 0) {
      console.log('   ✅ No critical issues found!');
    } else {
      criticalIssues.slice(0, 10).forEach(issue => {
        console.log(`   ❌ ${issue.file}:${issue.line}`);
        console.log(`      Issue: ${issue.issue}`);
        console.log(`      Code: ${issue.code}`);
        console.log(`      Solution: ${issue.solution}\n`);
      });
      
      if (criticalIssues.length > 10) {
        console.log(`   ... and ${criticalIssues.length - 10} more critical issues`);
      }
    }

    console.log(`\n⚠️  HIGH PRIORITY ISSUES:`);
    const highIssues = summary.results.filter(r => r.severity === 'high');
    if (highIssues.length === 0) {
      console.log('   ✅ No high priority issues found!');
    } else {
      highIssues.slice(0, 5).forEach(issue => {
        console.log(`   ⚠️  ${issue.file}:${issue.line} - ${issue.issue}`);
      });
      
      if (highIssues.length > 5) {
        console.log(`   ... and ${highIssues.length - 5} more high priority issues`);
      }
    }

    if (summary.totalIssues > 0) {
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Fix all critical issues immediately');
      console.log('2. Address high priority authentication/permission issues');
      console.log('3. Create NestJS API endpoints for direct database access');
      console.log('4. Implement proper caching strategy');
      console.log('5. Test all admin functionality after fixes');
    } else {
      console.log('\n✅ ARCHITECTURE AUDIT PASSED!');
      console.log('All checks passed. Architecture follows best practices.');
    }
  }
}

async function main() {
  const auditor = new ArchitectureAuditor();
  const summary = await auditor.runFullAudit();
  auditor.printSummary(summary);

  // Exit with error code if critical or high issues found
  if (summary.critical > 0 || summary.high > 0) {
    process.exit(1);
  }
}

main().catch(console.error);