import { Injectable } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { LoggerService } from '../logging/logger.service';
import { RabbitMQService } from '../rabbitmq/rabbitmq.service';
import { CronJob } from 'cron';

export interface ScheduledTask {
  id: string;
  name: string;
  pattern: string;
  cronExpression: string;
  payload: any;
  enabled: boolean;
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
  failureCount: number;
  createdAt: Date;
  createdBy: string;
}

export interface TaskHistory {
  taskId: string;
  executedAt: Date;
  success: boolean;
  duration: number;
  error?: string;
  result?: any;
}

@Injectable()
export class SchedulerService {
  private scheduledTasks = new Map<string, ScheduledTask>();
  private taskHistory = new Map<string, TaskHistory[]>();

  constructor(
    private readonly logger: LoggerService,
    private readonly rabbitMQ: RabbitMQService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  /**
   * Create a new scheduled task
   */
  async createScheduledTask(
    name: string,
    cronExpression: string,
    pattern: string,
    payload: any,
    createdBy: string = 'system'
  ): Promise<string> {
    const taskId = this.generateTaskId();
    
    const task: ScheduledTask = {
      id: taskId,
      name,
      pattern,
      cronExpression,
      payload,
      enabled: true,
      runCount: 0,
      failureCount: 0,
      createdAt: new Date(),
      createdBy,
    };

    // Create cron job
    const cronJob = new CronJob(cronExpression, async () => {
      await this.executeTask(taskId);
    });

    // Register with NestJS scheduler
    this.schedulerRegistry.addCronJob(taskId, cronJob);
    
    // Store task
    this.scheduledTasks.set(taskId, task);
    this.taskHistory.set(taskId, []);
    
    // Start the job
    cronJob.start();
    
    this.logger.logSystem(`Scheduled task created: ${name}`, {
      taskId,
      cronExpression,
      pattern,
    });

    return taskId;
  }

  /**
   * Update a scheduled task
   */
  async updateScheduledTask(
    taskId: string,
    updates: Partial<Pick<ScheduledTask, 'name' | 'cronExpression' | 'pattern' | 'payload' | 'enabled'>>
  ): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Update task properties
    Object.assign(task, updates);

    // If cron expression changed, recreate the job
    if (updates.cronExpression) {
      this.schedulerRegistry.deleteCronJob(taskId);
      
      const cronJob = new CronJob(updates.cronExpression, async () => {
        await this.executeTask(taskId);
      });

      this.schedulerRegistry.addCronJob(taskId, cronJob);
      
      if (task.enabled) {
        cronJob.start();
      }
    }

    // Handle enable/disable
    if (updates.enabled !== undefined) {
      const cronJob = this.schedulerRegistry.getCronJob(taskId);
      if (updates.enabled) {
        if (!cronJob.running) {
          cronJob.start();
        }
      } else {
        if (cronJob.running) {
          cronJob.stop();
        }
      }
    }

    this.logger.logSystem(`Scheduled task updated: ${task.name}`, {
      taskId,
      updates,
    });
  }

  /**
   * Delete a scheduled task
   */
  async deleteScheduledTask(taskId: string): Promise<void> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    // Remove from scheduler
    this.schedulerRegistry.deleteCronJob(taskId);
    
    // Remove from storage
    this.scheduledTasks.delete(taskId);
    this.taskHistory.delete(taskId);

    this.logger.logSystem(`Scheduled task deleted: ${task.name}`, { taskId });
  }

  /**
   * Get all scheduled tasks
   */
  getScheduledTasks(): ScheduledTask[] {
    return Array.from(this.scheduledTasks.values()).map(task => ({
      ...task,
      nextRun: this.getNextRunTime(task.id),
    }));
  }

  /**
   * Get a specific scheduled task
   */
  getScheduledTask(taskId: string): ScheduledTask | undefined {
    const task = this.scheduledTasks.get(taskId);
    if (task) {
      return {
        ...task,
        nextRun: this.getNextRunTime(taskId),
      };
    }
    return undefined;
  }

  /**
   * Get task execution history
   */
  getTaskHistory(taskId: string, limit: number = 50): TaskHistory[] {
    const history = this.taskHistory.get(taskId) || [];
    return history
      .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime())
      .slice(0, limit);
  }

  /**
   * Execute a task manually
   */
  async executeTaskManually(taskId: string): Promise<TaskHistory> {
    const task = this.scheduledTasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }

    this.logger.logSystem(`Manually executing task: ${task.name}`, { taskId });
    return this.executeTask(taskId);
  }

  /**
   * Enable/disable a scheduled task
   */
  async toggleTask(taskId: string, enabled: boolean): Promise<void> {
    await this.updateScheduledTask(taskId, { enabled });
  }

  /**
   * Get scheduler statistics
   */
  getSchedulerStats(): {
    totalTasks: number;
    enabledTasks: number;
    disabledTasks: number;
    totalRuns: number;
    totalFailures: number;
    successRate: number;
  } {
    const tasks = Array.from(this.scheduledTasks.values());
    const totalTasks = tasks.length;
    const enabledTasks = tasks.filter(t => t.enabled).length;
    const disabledTasks = totalTasks - enabledTasks;
    const totalRuns = tasks.reduce((sum, t) => sum + t.runCount, 0);
    const totalFailures = tasks.reduce((sum, t) => sum + t.failureCount, 0);
    const successRate = totalRuns > 0 ? ((totalRuns - totalFailures) / totalRuns) * 100 : 100;

    return {
      totalTasks,
      enabledTasks,
      disabledTasks,
      totalRuns,
      totalFailures,
      successRate: Math.round(successRate * 100) / 100,
    };
  }

  /**
   * Create common scheduled tasks
   */
  async setupCommonTasks(): Promise<void> {
    // Daily tenant statistics
    await this.createScheduledTask(
      'Daily Tenant Statistics',
      '0 1 * * *', // 1 AM daily
      'analytics.track',
      {
        event: 'daily_tenant_stats',
        source: 'scheduler',
      }
    );

    // Weekly performance reports
    await this.createScheduledTask(
      'Weekly Performance Report',
      '0 8 * * 1', // 8 AM every Monday
      'report.generate',
      {
        reportType: 'performance_weekly',
        format: 'pdf',
        userId: 'system',
        email: 'admin@itellico.com',
      }
    );

    // Monthly user engagement analysis
    await this.createScheduledTask(
      'Monthly User Engagement',
      '0 9 1 * *', // 9 AM on 1st of every month
      'analytics.track',
      {
        event: 'monthly_engagement_analysis',
        source: 'scheduler',
      }
    );

    // Daily database backup
    await this.createScheduledTask(
      'Daily Database Backup',
      '0 3 * * *', // 3 AM daily
      'backup.create',
      {
        backupType: 'incremental',
        compression: true,
        encryption: true,
        retentionDays: 30,
        storageLocation: 's3://backups/daily',
      }
    );

    this.logger.logSystem('Common scheduled tasks created');
  }

  // Private methods
  private async executeTask(taskId: string): Promise<TaskHistory> {
    const task = this.scheduledTasks.get(taskId);
    if (!task || !task.enabled) {
      return null;
    }

    const startTime = Date.now();
    let success = false;
    let error: string | undefined;
    let result: any;

    try {
      this.logger.logSystem(`Executing scheduled task: ${task.name}`, { taskId });

      // Queue the job for processing
      await this.rabbitMQ.sendMessage(task.pattern, task.payload);
      
      success = true;
      result = { queued: true };
      task.runCount++;
      
    } catch (err) {
      success = false;
      error = err.message;
      task.failureCount++;
      
      this.logger.error(`Scheduled task failed: ${task.name}`, err, { taskId });
    }

    const duration = Date.now() - startTime;
    task.lastRun = new Date();

    // Record history
    const historyEntry: TaskHistory = {
      taskId,
      executedAt: new Date(),
      success,
      duration,
      error,
      result,
    };

    const history = this.taskHistory.get(taskId) || [];
    history.push(historyEntry);
    
    // Keep only last 100 entries per task
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.taskHistory.set(taskId, history);

    return historyEntry;
  }

  private getNextRunTime(taskId: string): Date | undefined {
    try {
      const cronJob = this.schedulerRegistry.getCronJob(taskId);
      return cronJob.nextDate()?.toDate();
    } catch (error) {
      return undefined;
    }
  }

  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
}