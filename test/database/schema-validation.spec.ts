import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

describe('Database Schema Validation', () => {
  describe('UUID Implementation', () => {
    it('should have UUID fields in all required tables', async () => {
      const tables = [
        'users', 'accounts', 'tenants', 'roles', 'permissions',
        'tags', 'categories', 'profiles', 'job_postings', 'gig_offerings',
      ];

      for (const table of tables) {
        const result = await prisma.$queryRaw`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = ${table} 
          AND column_name = 'uuid'
        `;

        expect(result).toHaveLength(1);
        expect(result[0].data_type).toBe('uuid');
      }
    });

    it('should have UUID as primary key with proper default', async () => {
      const result = await prisma.$queryRaw`
        SELECT 
          kcu.column_name,
          c.column_default
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.columns c
          ON kcu.table_name = c.table_name 
          AND kcu.column_name = c.column_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
        AND kcu.table_name = 'users'
        AND kcu.column_name = 'uuid'
      `;

      expect(result).toHaveLength(1);
      expect(result[0].column_default).toContain('gen_random_uuid()');
    });
  });

  describe('Field Ordering', () => {
    it('should have UUID as first field in tables', async () => {
      const tables = ['users', 'accounts', 'tenants'];

      for (const table of tables) {
        const result = await prisma.$queryRaw`
          SELECT column_name, ordinal_position
          FROM information_schema.columns
          WHERE table_name = ${table}
          ORDER BY ordinal_position
          LIMIT 2
        `;

        expect(result[0].column_name).toBe('uuid');
        expect(result[1].column_name).toBe('id');
      }
    });
  });

  describe('Indexes', () => {
    it('should have indexes on UUID fields', async () => {
      const result = await prisma.$queryRaw`
        SELECT tablename, indexname
        FROM pg_indexes
        WHERE indexdef LIKE '%uuid%'
        AND schemaname = 'public'
      `;

      expect(result.length).toBeGreaterThan(0);
    });

    it('should have composite indexes for common queries', async () => {
      const expectedIndexes = [
        { table: 'users', columns: ['account_id', 'is_active'] },
        { table: 'accounts', columns: ['tenant_id', 'is_active'] },
        { table: 'user_roles', columns: ['user_id', 'role_id'] },
      ];

      for (const { table, columns } of expectedIndexes) {
        const result = await prisma.$queryRaw`
          SELECT indexdef
          FROM pg_indexes
          WHERE tablename = ${table}
          AND indexdef LIKE ${`%${columns.join('%')}%`}
        `;

        expect(result.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Constraints', () => {
    it('should have proper foreign key constraints', async () => {
      const result = await prisma.$queryRaw`
        SELECT 
          tc.table_name,
          kcu.column_name,
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = 'users'
      `;

      expect(result).toContainEqual(
        expect.objectContaining({
          column_name: 'account_id',
          foreign_table_name: 'accounts',
          foreign_column_name: 'id',
        })
      );
    });

    it('should have check constraints for valid ranges', async () => {
      const result = await prisma.$queryRaw`
        SELECT 
          tc.table_name,
          cc.check_clause
        FROM information_schema.table_constraints tc
        JOIN information_schema.check_constraints cc
          ON tc.constraint_name = cc.constraint_name
        WHERE tc.constraint_type = 'CHECK'
        AND tc.table_name = 'audit_logs'
      `;

      const riskScoreCheck = result.find(r => 
        r.check_clause.includes('risk_score')
      );
      expect(riskScoreCheck).toBeDefined();
    });
  });

  describe('Audit Tables', () => {
    it('should have all required audit tables', async () => {
      const auditTables = [
        'audit_logs',
        'data_access_logs',
        'security_audit_logs',
        'compliance_audit_logs',
        'permission_audits',
      ];

      for (const table of auditTables) {
        const result = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = ${table}
          ) as exists
        `;

        expect(result[0].exists).toBe(true);
      }
    });

    it('should have partitioning on audit_logs table', async () => {
      const result = await prisma.$queryRaw`
        SELECT 
          c.relname,
          p.partstrat
        FROM pg_class c
        JOIN pg_partitioned_table p ON c.oid = p.partrelid
        WHERE c.relname = 'audit_logs'
      `;

      expect(result).toHaveLength(1);
      expect(result[0].partstrat).toBe('r'); // Range partitioning
    });
  });

  describe('Cache Tables', () => {
    it('should have permission cache tables', async () => {
      const cacheTables = [
        'permission_cache',
        'cache_invalidation_log',
        'cache_warmup_queue',
        'cache_metrics',
      ];

      for (const table of cacheTables) {
        const exists = await prisma.$queryRaw`
          SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_name = ${table}
          ) as exists
        `;

        expect(exists[0].exists).toBe(true);
      }
    });
  });

  describe('Enum Types', () => {
    it('should have all enums with snake_case values', async () => {
      const result = await prisma.$queryRaw`
        SELECT 
          t.typname as enum_name,
          array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
        FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typnamespace = 'public'::regnamespace
        GROUP BY t.typname
      `;

      for (const enumType of result) {
        for (const value of enumType.values) {
          expect(value).toBe(value.toLowerCase());
          expect(value).not.toMatch(/[A-Z]/); // No uppercase letters
        }
      }
    });
  });

  describe('Soft Delete Support', () => {
    it('should have deletedAt fields in main tables', async () => {
      const tables = ['users', 'accounts', 'profiles', 'job_postings'];

      for (const table of tables) {
        const result = await prisma.$queryRaw`
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = ${table}
          AND column_name = 'deleted_at'
        `;

        expect(result).toHaveLength(1);
        expect(result[0].data_type).toBe('timestamp with time zone');
      }
    });
  });
});