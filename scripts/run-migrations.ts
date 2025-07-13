#!/usr/bin/env tsx

/**
 * Database Migration Runner
 * 
 * This script orchestrates the execution of all database migrations
 * in the correct order with proper error handling and rollback support.
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import prompts from 'prompts';

const prisma = new PrismaClient();

interface Migration {
  id: string;
  name: string;
  file: string;
  type: 'sql' | 'ts';
  phase: number;
  requiresDowntime: boolean;
  estimatedDuration: string;
  rollbackFile?: string;
}

const MIGRATIONS: Migration[] = [
  // Phase 1: Non-breaking additions
  {
    id: '01',
    name: 'Add UUID fields',
    file: '01-add-uuid-fields.ts',
    type: 'ts',
    phase: 1,
    requiresDowntime: false,
    estimatedDuration: '2-5 minutes',
  },
  {
    id: '02',
    name: 'Add missing indexes',
    file: '02-add-missing-indexes.sql',
    type: 'sql',
    phase: 1,
    requiresDowntime: false,
    estimatedDuration: '5-30 minutes',
    rollbackFile: 'rollback-02-remove-indexes.sql',
  },
  {
    id: '03',
    name: 'Add audit tables',
    file: '03-add-audit-tables.sql',
    type: 'sql',
    phase: 1,
    requiresDowntime: false,
    estimatedDuration: '1-2 minutes',
    rollbackFile: 'rollback-03-remove-audit-tables.sql',
  },
  {
    id: '04',
    name: 'Add cache tables',
    file: '04-add-cache-tables.sql',
    type: 'sql',
    phase: 1,
    requiresDowntime: false,
    estimatedDuration: '1 minute',
    rollbackFile: 'rollback-04-remove-cache-tables.sql',
  },
  {
    id: '05',
    name: 'Fix enum mappings',
    file: '05-fix-enum-mappings.sql',
    type: 'sql',
    phase: 1,
    requiresDowntime: false,
    estimatedDuration: '1 minute',
    rollbackFile: 'rollback-05-revert-enum-mappings.sql',
  },
  
  // Phase 2: Schema updates
  {
    id: '06',
    name: 'Update Prisma schema',
    file: '06-update-prisma-schema.ts',
    type: 'ts',
    phase: 2,
    requiresDowntime: false,
    estimatedDuration: '1 minute',
  },
  {
    id: '07',
    name: 'Add table mappings',
    file: '07-add-table-mappings.sql',
    type: 'sql',
    phase: 2,
    requiresDowntime: true,
    estimatedDuration: '2-5 minutes',
    rollbackFile: 'rollback-07-revert-table-mappings.sql',
  },
];

class MigrationRunner {
  private executedMigrations: string[] = [];
  private migrationLogFile = 'migration-log.json';

  async run() {
    console.log(chalk.blue.bold('\n🚀 Database Migration Runner\n'));

    // Check prerequisites
    await this.checkPrerequisites();

    // Show migration plan
    this.showMigrationPlan();

    // Confirm execution
    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Do you want to proceed with the migrations?',
      initial: false,
    });

    if (!confirm) {
      console.log(chalk.yellow('\n❌ Migration cancelled by user'));
      process.exit(0);
    }

    // Select phase
    const { phase } = await prompts({
      type: 'select',
      name: 'phase',
      message: 'Which phase do you want to run?',
      choices: [
        { title: 'Phase 1: Non-breaking additions', value: 1 },
        { title: 'Phase 2: Schema updates', value: 2 },
        { title: 'All phases', value: 0 },
      ],
    });

    // Run migrations
    await this.runMigrations(phase);
  }

  private async checkPrerequisites() {
    const spinner = ora('Checking prerequisites...').start();

    try {
      // Check database connection
      await prisma.$connect();
      spinner.text = 'Database connection verified';

      // Check for backup
      const { hasBackup } = await prompts({
        type: 'confirm',
        name: 'hasBackup',
        message: 'Have you created a database backup?',
        initial: false,
      });

      if (!hasBackup) {
        spinner.fail('Please create a database backup before proceeding');
        process.exit(1);
      }

      // Check migration history
      if (existsSync(this.migrationLogFile)) {
        const log = JSON.parse(readFileSync(this.migrationLogFile, 'utf-8'));
        this.executedMigrations = log.executed || [];
      }

      spinner.succeed('Prerequisites checked');
    } catch (error) {
      spinner.fail('Prerequisites check failed');
      console.error(error);
      process.exit(1);
    }
  }

  private showMigrationPlan() {
    console.log(chalk.cyan('\n📋 Migration Plan:\n'));

    const phases = [1, 2];
    for (const phase of phases) {
      console.log(chalk.bold(`Phase ${phase}:`));
      
      const phaseMigrations = MIGRATIONS.filter(m => m.phase === phase);
      for (const migration of phaseMigrations) {
        const status = this.executedMigrations.includes(migration.id) 
          ? chalk.green('✓') 
          : chalk.gray('○');
        
        const downtime = migration.requiresDowntime 
          ? chalk.red(' (requires downtime)') 
          : '';
        
        console.log(
          `  ${status} ${migration.id}: ${migration.name} - ${migration.estimatedDuration}${downtime}`
        );
      }
      console.log();
    }
  }

  private async runMigrations(phase: number) {
    const migrations = phase === 0 
      ? MIGRATIONS 
      : MIGRATIONS.filter(m => m.phase === phase);

    console.log(chalk.blue(`\n🔄 Running ${migrations.length} migrations...\n`));

    for (const migration of migrations) {
      if (this.executedMigrations.includes(migration.id)) {
        console.log(chalk.gray(`⏭️  Skipping ${migration.id}: ${migration.name} (already executed)`));
        continue;
      }

      await this.runMigration(migration);
    }

    console.log(chalk.green.bold('\n✅ All migrations completed successfully!\n'));
    
    // Show post-migration tasks
    this.showPostMigrationTasks();
  }

  private async runMigration(migration: Migration) {
    const spinner = ora(`Running ${migration.id}: ${migration.name}`).start();
    const startTime = Date.now();

    try {
      const migrationPath = join(__dirname, 'migrations', migration.file);

      if (migration.type === 'sql') {
        // Execute SQL migration
        const sql = readFileSync(migrationPath, 'utf-8');
        await prisma.$executeRawUnsafe(sql);
      } else {
        // Execute TypeScript migration
        execSync(`tsx ${migrationPath}`, { stdio: 'pipe' });
      }

      // Record successful migration
      this.executedMigrations.push(migration.id);
      this.saveLog();

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      spinner.succeed(`${migration.id}: ${migration.name} (${duration}s)`);
      
    } catch (error) {
      spinner.fail(`${migration.id}: ${migration.name} failed`);
      console.error(chalk.red('\nError details:'), error);

      // Ask about rollback
      if (migration.rollbackFile) {
        const { rollback } = await prompts({
          type: 'confirm',
          name: 'rollback',
          message: 'Do you want to rollback this migration?',
          initial: true,
        });

        if (rollback) {
          await this.rollbackMigration(migration);
        }
      }

      process.exit(1);
    }
  }

  private async rollbackMigration(migration: Migration) {
    if (!migration.rollbackFile) {
      console.log(chalk.yellow('No rollback script available for this migration'));
      return;
    }

    const spinner = ora(`Rolling back ${migration.id}: ${migration.name}`).start();

    try {
      const rollbackPath = join(__dirname, 'migrations', migration.rollbackFile);
      const sql = readFileSync(rollbackPath, 'utf-8');
      await prisma.$executeRawUnsafe(sql);

      // Remove from executed list
      this.executedMigrations = this.executedMigrations.filter(id => id !== migration.id);
      this.saveLog();

      spinner.succeed(`Rolled back ${migration.id}: ${migration.name}`);
    } catch (error) {
      spinner.fail('Rollback failed');
      console.error(chalk.red('\nRollback error:'), error);
      console.log(chalk.red('\n⚠️  Manual intervention may be required!'));
    }
  }

  private saveLog() {
    const log = {
      executed: this.executedMigrations,
      lastRun: new Date().toISOString(),
    };
    writeFileSync(this.migrationLogFile, JSON.stringify(log, null, 2));
  }

  private showPostMigrationTasks() {
    console.log(chalk.cyan('📝 Post-Migration Tasks:\n'));
    console.log('1. Run: pnpm prisma generate');
    console.log('2. Run: pnpm prisma db pull (to sync schema)');
    console.log('3. Test application functionality');
    console.log('4. Update API to use UUIDs');
    console.log('5. Enable audit logging');
    console.log('6. Configure Redis caching');
    console.log('7. Run performance benchmarks');
    console.log('8. Update documentation');
  }
}

// Run the migration
async function main() {
  const runner = new MigrationRunner();
  await runner.run();
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });