#!/usr/bin/env tsx

/**
 * BigInt Usage Audit Script
 * 
 * Analyzes current database to identify BigInt fields that can be optimized to Int
 * for better performance and storage efficiency.
 * 
 * Usage: npx tsx scripts/audit-bigint-usage.ts
 */

import { db as prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

interface BigIntAuditResult {
  table: string;
  field: string;
  currentType: 'BigInt';
  recommendedType: 'Int' | 'BigInt';
  reason: string;
  maxValue?: number;
  recordCount?: number;
  storageImpact: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  migrationPriority: 'High' | 'Medium' | 'Low';
}

interface TableStats {
  tableName: string;
  recordCount: number;
  maxId?: number;
  avgGrowthRate?: string;
}

const INT_MAX = 2147483647; // 2^31 - 1
const BIGINT_SIZE = 8; // bytes
const INT_SIZE = 4; // bytes

async function getTableStats(): Promise<TableStats[]> {
  const stats: TableStats[] = [];

  try {
    // Account stats
    const accountStats = await prisma.$queryRaw<Array<{count: bigint, max_id: bigint | null}>>`
      SELECT COUNT(*) as count, MAX(id) as max_id FROM "Account"
    `;
    stats.push({
      tableName: 'Account',
      recordCount: Number(accountStats[0].count),
      maxId: accountStats[0].max_id ? Number(accountStats[0].max_id) : 0
    });

    // User stats  
    const userStats = await prisma.$queryRaw<Array<{count: bigint, max_id: bigint | null}>>`
      SELECT COUNT(*) as count, MAX(id) as max_id FROM "User"
    `;
    stats.push({
      tableName: 'User',
      recordCount: Number(userStats[0].count),
      maxId: userStats[0].max_id ? Number(userStats[0].max_id) : 0
    });

    // AuditLog stats
    const auditStats = await prisma.$queryRaw<Array<{count: bigint, max_id: bigint | null}>>`
      SELECT COUNT(*) as count, MAX(id) as max_id FROM "audit_logs"
    `;
    stats.push({
      tableName: 'AuditLog',
      recordCount: Number(auditStats[0].count),
      maxId: auditStats[0].max_id ? Number(auditStats[0].max_id) : 0
    });

    // UserActivityLog stats
    const activityStats = await prisma.$queryRaw<Array<{count: bigint, max_id: bigint | null}>>`
      SELECT COUNT(*) as count, MAX(id) as max_id FROM "user_activity_logs"
    `;
    stats.push({
      tableName: 'UserActivityLog',
      recordCount: Number(activityStats[0].count),
      maxId: activityStats[0].max_id ? Number(activityStats[0].max_id) : 0
    });

    // UserRole stats
    const userRoleStats = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM "UserRole"
    `;
    stats.push({
      tableName: 'UserRole',
      recordCount: Number(userRoleStats[0].count)
    });

    // RecordLock stats
    const lockStats = await prisma.$queryRaw<Array<{count: bigint}>>`
      SELECT COUNT(*) as count FROM "record_locks"
    `;
    stats.push({
      tableName: 'RecordLock',
      recordCount: Number(lockStats[0].count)
    });

    return stats;

  } catch (error) {
    logger.error('Failed to get table stats', { error });
    throw error;
  }
}

function calculateStorageImpact(recordCount: number, fieldsAffected: number = 1): string {
  const bytesPerRecord = (BIGINT_SIZE - INT_SIZE) * fieldsAffected;
  const totalSavings = recordCount * bytesPerRecord;
  
  if (totalSavings < 1024) {
    return `${totalSavings} bytes`;
  } else if (totalSavings < 1024 * 1024) {
    return `${(totalSavings / 1024).toFixed(1)} KB`;
  } else {
    return `${(totalSavings / (1024 * 1024)).toFixed(1)} MB`;
  }
}

function assessMigrationRisk(maxValue: number | undefined, recordCount: number): 'Low' | 'Medium' | 'High' {
  if (!maxValue) return 'Low';
  
  if (maxValue > INT_MAX) return 'High'; // Data loss risk
  if (maxValue > INT_MAX * 0.8) return 'Medium'; // Close to limit
  if (recordCount > 1000000) return 'Medium'; // Large table migration
  
  return 'Low';
}

async function performBigIntAudit(): Promise<BigIntAuditResult[]> {
  const results: BigIntAuditResult[] = [];
  const tableStats = await getTableStats();
  
  // Helper to find table stats
  const getStats = (tableName: string) => 
    tableStats.find(s => s.tableName === tableName);

  // Account.id Analysis
  const accountStats = getStats('Account');
  results.push({
    table: 'Account',
    field: 'id',
    currentType: 'BigInt',
    recommendedType: 'Int',
    reason: 'Business accounts unlikely to exceed 2.1B. Clear optimization opportunity.',
    maxValue: accountStats?.maxId,
    recordCount: accountStats?.recordCount || 0,
    storageImpact: calculateStorageImpact(accountStats?.recordCount || 0),
    riskLevel: assessMigrationRisk(accountStats?.maxId, accountStats?.recordCount || 0),
    migrationPriority: 'High'
  });

  // User.accountId Analysis (follows Account.id)
  const userStats = getStats('User');
  results.push({
    table: 'User',
    field: 'accountId',
    currentType: 'BigInt',
    recommendedType: 'Int',
    reason: 'Foreign key to Account.id - should match primary key type.',
    recordCount: userStats?.recordCount || 0,
    storageImpact: calculateStorageImpact(userStats?.recordCount || 0),
    riskLevel: 'Low',
    migrationPriority: 'High'
  });

  // User.id Analysis
  results.push({
    table: 'User',
    field: 'id', 
    currentType: 'BigInt',
    recommendedType: 'Int',
    reason: 'Most platforms don\'t exceed 2.1B users. Can migrate later if needed.',
    maxValue: userStats?.maxId,
    recordCount: userStats?.recordCount || 0,
    storageImpact: calculateStorageImpact(userStats?.recordCount || 0),
    riskLevel: assessMigrationRisk(userStats?.maxId, userStats?.recordCount || 0),
    migrationPriority: 'Medium'
  });

  // UserRole.userId Analysis (follows User.id)
  const userRoleStats = getStats('UserRole');
  results.push({
    table: 'UserRole',
    field: 'userId',
    currentType: 'BigInt',
    recommendedType: 'Int',
    reason: 'Foreign key to User.id - should match primary key type.',
    recordCount: userRoleStats?.recordCount || 0,
    storageImpact: calculateStorageImpact(userRoleStats?.recordCount || 0),
    riskLevel: 'Low',
    migrationPriority: 'Medium'
  });

  // AuditLog.id Analysis - KEEP AS BIGINT
  const auditStats = getStats('AuditLog');
  results.push({
    table: 'AuditLog',
    field: 'id',
    currentType: 'BigInt',
    recommendedType: 'BigInt',
    reason: 'Audit logs grow rapidly and can exceed 2.1B entries. Keep as BigInt.',
    maxValue: auditStats?.maxId,
    recordCount: auditStats?.recordCount || 0,
    storageImpact: 'No change recommended',
    riskLevel: 'Low',
    migrationPriority: 'Low'
  });

  // AuditLog.userId Analysis (follows User.id)
  results.push({
    table: 'AuditLog',
    field: 'userId',
    currentType: 'BigInt',
    recommendedType: 'Int',
    reason: 'Foreign key to User.id - should match primary key type.',
    recordCount: auditStats?.recordCount || 0,
    storageImpact: calculateStorageImpact(auditStats?.recordCount || 0),
    riskLevel: 'Low',
    migrationPriority: 'Medium'
  });

  // UserActivityLog.id Analysis - KEEP AS BIGINT
  const activityStats = getStats('UserActivityLog');
  results.push({
    table: 'UserActivityLog',
    field: 'id',
    currentType: 'BigInt',
    recommendedType: 'BigInt',
    reason: 'Activity logs grow very rapidly. Can easily exceed 2.1B entries.',
    maxValue: activityStats?.maxId,
    recordCount: activityStats?.recordCount || 0,
    storageImpact: 'No change recommended',
    riskLevel: 'Low',
    migrationPriority: 'Low'
  });

  // UserActivityLog.userId Analysis (follows User.id)
  results.push({
    table: 'UserActivityLog',
    field: 'userId',
    currentType: 'BigInt',
    recommendedType: 'Int',
    reason: 'Foreign key to User.id - should match primary key type.',
    recordCount: activityStats?.recordCount || 0,
    storageImpact: calculateStorageImpact(activityStats?.recordCount || 0),
    riskLevel: 'Low',
    migrationPriority: 'Medium'
  });

  // RecordLock.lockedBy Analysis (follows User.id)
  const lockStats = getStats('RecordLock');
  results.push({
    table: 'RecordLock', 
    field: 'lockedBy',
    currentType: 'BigInt',
    recommendedType: 'Int',
    reason: 'Foreign key to User.id - should match primary key type.',
    recordCount: lockStats?.recordCount || 0,
    storageImpact: calculateStorageImpact(lockStats?.recordCount || 0),
    riskLevel: 'Low',
    migrationPriority: 'Medium'
  });

  return results;
}

function printAuditReport(results: BigIntAuditResult[], tableStats: TableStats[]) {
  console.log('\n🔍 BIGINT USAGE AUDIT REPORT');
  console.log('=' .repeat(80));
  
  // Summary Statistics
  console.log('\n📊 CURRENT DATABASE STATISTICS');
  console.log('-'.repeat(50));
  tableStats.forEach(stat => {
    console.log(`${stat.tableName.padEnd(20)} Records: ${stat.recordCount.toLocaleString()}`);
    if (stat.maxId) {
      console.log(`${' '.repeat(20)} Max ID: ${stat.maxId.toLocaleString()}`);
    }
  });

  // Optimization Opportunities
  const optimizations = results.filter(r => r.recommendedType === 'Int');
  const keepBigInt = results.filter(r => r.recommendedType === 'BigInt');

  console.log('\n✅ RECOMMENDED OPTIMIZATIONS (BigInt → Int)');
  console.log('-'.repeat(50));
  optimizations.forEach(result => {
    console.log(`\n${result.table}.${result.field}`);
    console.log(`  Priority: ${result.migrationPriority} | Risk: ${result.riskLevel}`);
    console.log(`  Storage Savings: ${result.storageImpact}`);
    console.log(`  Reason: ${result.reason}`);
    if (result.maxValue) {
      console.log(`  Max Value: ${result.maxValue.toLocaleString()} (Int Max: ${INT_MAX.toLocaleString()})`);
    }
  });

  console.log('\n🔒 KEEP AS BIGINT (Correct Current Usage)');
  console.log('-'.repeat(50)); 
  keepBigInt.forEach(result => {
    console.log(`\n${result.table}.${result.field}`);
    console.log(`  Reason: ${result.reason}`);
    if (result.maxValue) {
      console.log(`  Current Max: ${result.maxValue.toLocaleString()}`);
    }
  });

  // Migration Priority Summary
  console.log('\n🚀 MIGRATION PRIORITY SUMMARY');
  console.log('-'.repeat(50));
  console.log('\nHigh Priority (Immediate optimization):');
  optimizations.filter(r => r.migrationPriority === 'High').forEach(r => {
    console.log(`  • ${r.table}.${r.field} - ${r.storageImpact} savings`);
  });

  console.log('\nMedium Priority (After User.id decision):');
  optimizations.filter(r => r.migrationPriority === 'Medium').forEach(r => {
    console.log(`  • ${r.table}.${r.field} - ${r.storageImpact} savings`);
  });

  // Risk Assessment
  const highRisk = results.filter(r => r.riskLevel === 'High');
  if (highRisk.length > 0) {
    console.log('\n⚠️  HIGH RISK MIGRATIONS');
    console.log('-'.repeat(50));
    highRisk.forEach(result => {
      console.log(`${result.table}.${result.field}: ${result.reason}`);
    });
  }

  // Total Storage Impact
  const totalSavings = optimizations.reduce((total, result) => {
    const match = result.storageImpact.match(/(\d+\.?\d*)\s*(bytes|KB|MB)/);
    if (!match) return total;
    
    const value = parseFloat(match[1]);
    const unit = match[2];
    
    switch (unit) {
      case 'bytes': return total + value;
      case 'KB': return total + (value * 1024);
      case 'MB': return total + (value * 1024 * 1024);
      default: return total;
    }
  }, 0);

  console.log('\n💾 ESTIMATED TOTAL STORAGE SAVINGS');
  console.log('-'.repeat(50));
  if (totalSavings < 1024) {
    console.log(`${totalSavings.toFixed(0)} bytes`);
  } else if (totalSavings < 1024 * 1024) {
    console.log(`${(totalSavings / 1024).toFixed(1)} KB`);
  } else {
    console.log(`${(totalSavings / (1024 * 1024)).toFixed(1)} MB`);
  }
  console.log('+ Significant index size reduction');
  console.log('+ Improved cache performance');

  console.log('\n📋 NEXT STEPS');
  console.log('-'.repeat(50));
  console.log('1. Review high-priority optimizations');
  console.log('2. Create migration scripts for Account.id → Int');
  console.log('3. Update TypeScript types and API contracts');
  console.log('4. Test migration on staging environment');
  console.log('5. Plan User.id migration strategy');
}

async function main() {
  try {
    logger.info('🔍 Starting BigInt usage audit...');
    
    const tableStats = await getTableStats();
    const auditResults = await performBigIntAudit();
    
    printAuditReport(auditResults, tableStats);
    
    logger.info('✅ BigInt audit completed successfully');
    
  } catch (error) {
    logger.error('❌ BigInt audit failed', { error });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch((error) => {
    logger.error('BigInt audit script crashed', { error });
    process.exit(1);
  });
}

export { performBigIntAudit };
export type { BigIntAuditResult, TableStats }; 