#!/usr/bin/env node

/**
 * Cron Job Manager for itellico Mono
 * 
 * This script manages automated tasks like database backups, monitoring, and maintenance.
 * Uses node-cron for scheduling tasks in the local development environment.
 */

const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  // Backup schedule (EVERY HOUR)
  backupSchedule: '0 * * * *',
  
  // Health check schedule (every 5 minutes)
  healthCheckSchedule: '*/5 * * * *',
  
  // Log cleanup schedule (every Sunday at 3 AM)
  logCleanupSchedule: '0 3 * * 0',
  
  // Redis cleanup schedule (every hour at 30 minutes)
  redisCleanupSchedule: '30 * * * *',
  
  // Paths
  scriptsDir: path.join(__dirname),
  logsDir: path.join(__dirname, '..', 'logs'),
  backupsDir: path.join(__dirname, '..', 'backups'),
};

// Ensure required directories exist
function ensureDirectories() {
  [CONFIG.logsDir, CONFIG.backupsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

// Utility function to run shell commands
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`🔄 Starting: ${description}`);
    const startTime = Date.now();
    
    exec(command, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
      const duration = Date.now() - startTime;
      
      if (error) {
        console.error(`❌ Failed: ${description} (${duration}ms)`);
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      
      console.log(`✅ Completed: ${description} (${duration}ms)`);
      if (stdout) console.log(`Output: ${stdout.trim()}`);
      if (stderr) console.warn(`Warnings: ${stderr.trim()}`);
      
      resolve({ stdout, stderr });
    });
  });
}

// Log function with timestamp
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  
  // Also write to log file
  const logFile = path.join(CONFIG.logsDir, 'cron-manager.log');
  fs.appendFileSync(logFile, logMessage + '\n');
}

// Health check function
async function healthCheck() {
  try {
    log('Running health check...');
    
    // Check Docker containers (including test containers)
    await runCommand(
      'docker ps --format "table {{.Names}}\t{{.Status}}" | grep -E "(postgres|redis|n8n|temporal|grafana|nginx|php)" || echo "No containers running"',
      'Docker containers health check'
    );
    
    // Check specific databases
    await runCommand(
      'docker exec mono-postgres psql -U developer -l | grep -E "(mono|temporal|kanboard)" || echo "Main databases not accessible"',
      'Main PostgreSQL databases check'
    );
    
    // Check test databases if running
    await runCommand(
      'docker ps --format "{{.Names}}" | grep -q "mono-test-postgres" && docker exec mono-test-postgres psql -U postgres -l || echo "Test PostgreSQL not running"',
      'Test PostgreSQL check'
    );
    
    // Check disk space
    await runCommand('df -h', 'Disk space check');
    
    // Check API health
    await runCommand('curl -f http://localhost:3001/api/v1/public/health || echo "API not responding"', 'API health check');
    
    // Check Kanban health (PHP application)
    await runCommand('curl -f http://localhost:4041/ || echo "Kanban not responding"', 'Kanban health check');
    
    log('Health check completed successfully');
  } catch (error) {
    log(`Health check failed: ${error.message}`, 'ERROR');
  }
}

// Database backup function
async function backupDatabases() {
  try {
    log('Starting automated database backup...');
    
    // Main database backup (includes all databases: mono, temporal, kanboard, and test environments)
    const backupScript = path.join(CONFIG.scriptsDir, 'backup-databases.sh');
    await runCommand(`bash "${backupScript}"`, 'Database backup');
    
    log('Database backup completed successfully');
  } catch (error) {
    log(`Database backup failed: ${error.message}`, 'ERROR');
  }
}

// Log cleanup function
async function cleanupLogs() {
  try {
    log('Starting log cleanup...');
    
    // Clean up old log files (older than 30 days)
    await runCommand(
      `find "${CONFIG.logsDir}" -name "*.log" -mtime +30 -delete`,
      'Old log files cleanup'
    );
    
    // Clean up old backup metadata (keep backups, just metadata)
    await runCommand(
      `find "${CONFIG.backupsDir}" -name "backup_metadata.json" -mtime +30 -delete`,
      'Old backup metadata cleanup'
    );
    
    log('Log cleanup completed successfully');
  } catch (error) {
    log(`Log cleanup failed: ${error.message}`, 'ERROR');
  }
}

// Redis cleanup function
async function cleanupRedis() {
  try {
    log('Starting Redis cleanup...');
    
    // Clean up expired keys and optimize memory
    await runCommand(
      'docker exec mono-redis-1 redis-cli --eval scripts/redis-cleanup.lua || echo "Redis cleanup script not found"',
      'Redis cleanup'
    );
    
    log('Redis cleanup completed successfully');
  } catch (error) {
    log(`Redis cleanup failed: ${error.message}`, 'ERROR');
  }
}

// Schedule tasks
function scheduleJobs() {
  log('🚀 Starting itellico Mono Cron Manager');
  
  // Database backup job
  const backupJob = cron.schedule(CONFIG.backupSchedule, async () => {
    log('📦 Scheduled database backup started');
    await backupDatabases();
  }, {
    scheduled: false,
    timezone: "Europe/Berlin"
  });
  
  // Health check job
  const healthJob = cron.schedule(CONFIG.healthCheckSchedule, async () => {
    await healthCheck();
  }, {
    scheduled: false,
    timezone: "Europe/Berlin"
  });
  
  // Log cleanup job
  const cleanupJob = cron.schedule(CONFIG.logCleanupSchedule, async () => {
    log('🧹 Scheduled log cleanup started');
    await cleanupLogs();
  }, {
    scheduled: false,
    timezone: "Europe/Berlin"
  });
  
  // Redis cleanup job
  const redisJob = cron.schedule(CONFIG.redisCleanupSchedule, async () => {
    await cleanupRedis();
  }, {
    scheduled: false,
    timezone: "Europe/Berlin"
  });
  
  // Start all jobs
  backupJob.start();
  healthJob.start();
  cleanupJob.start();
  redisJob.start();
  
  log('✅ All cron jobs scheduled successfully');
  log(`📦 Database backups: ${CONFIG.backupSchedule} (EVERY HOUR on the hour)`);
  log(`🔍 Health checks: ${CONFIG.healthCheckSchedule} (every 5 minutes)`);
  log(`🧹 Log cleanup: ${CONFIG.logCleanupSchedule} (weekly on Sunday at 3 AM)`);
  log(`🗂️  Redis cleanup: ${CONFIG.redisCleanupSchedule} (every hour at 30 minutes)`);
  
  return { backupJob, healthJob, cleanupJob, redisJob };
}

// Manual operations (when called with arguments)
async function handleManualOperation() {
  const operation = process.argv[2];
  
  switch (operation) {
    case 'backup':
      log('🔧 Manual backup requested');
      await backupDatabases();
      break;
      
    case 'health':
      log('🔧 Manual health check requested');
      await healthCheck();
      break;
      
    case 'cleanup':
      log('🔧 Manual cleanup requested');
      await cleanupLogs();
      break;
      
    case 'redis-cleanup':
      log('🔧 Manual Redis cleanup requested');
      await cleanupRedis();
      break;
      
    case 'status':
      console.log('📊 itellico Mono Cron Manager Status');
      console.log('====================================');
      console.log(`Scripts directory: ${CONFIG.scriptsDir}`);
      console.log(`Logs directory: ${CONFIG.logsDir}`);
      console.log(`Backups directory: ${CONFIG.backupsDir}`);
      console.log('');
      console.log('Available commands:');
      console.log('  backup        - Run database backup now');
      console.log('  health        - Run health check now');
      console.log('  cleanup       - Run log cleanup now');
      console.log('  redis-cleanup - Run Redis cleanup now');
      console.log('  status        - Show this status');
      console.log('  start         - Start cron scheduler (default)');
      break;
      
    case 'start':
    case undefined:
      // Default: start the scheduler
      ensureDirectories();
      scheduleJobs();
      
      // Keep the process running
      process.on('SIGINT', () => {
        log('📴 Cron manager shutting down...');
        process.exit(0);
      });
      
      // Prevent the process from exiting
      setInterval(() => {
        // Heartbeat every minute
      }, 60000);
      break;
      
    default:
      console.error(`❌ Unknown operation: ${operation}`);
      console.log('Run "node cron-manager.js status" for available commands');
      process.exit(1);
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'ERROR');
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'ERROR');
  process.exit(1);
});

// Main execution
if (require.main === module) {
  handleManualOperation().catch(error => {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  scheduleJobs,
  backupDatabases,
  healthCheck,
  cleanupLogs,
  cleanupRedis
};