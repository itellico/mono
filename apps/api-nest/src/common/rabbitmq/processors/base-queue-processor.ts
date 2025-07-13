import { Logger } from '@nestjs/common';
import { QueueJob, JobResult } from '../types/queue-jobs.types';
import { LoggerService } from '../../logging/logger.service';

export abstract class BaseQueueProcessor<T extends QueueJob = QueueJob> {
  protected readonly logger = new Logger(this.constructor.name);
  
  constructor(
    protected readonly loggerService?: LoggerService,
  ) {}

  /**
   * Process a job - to be implemented by subclasses
   */
  abstract process(job: T): Promise<JobResult>;

  /**
   * Handle job execution with error handling and logging
   */
  async handleJob(job: T): Promise<JobResult> {
    const startTime = Date.now();
    
    try {
      this.loggerService?.info(`🚀 Processing job: ${job.type}`, {
        jobId: job.id,
        jobType: job.type,
        attempts: job.attempts,
      });

      const result = await this.process(job);
      const executionTime = Date.now() - startTime;

      if (result.success) {
        this.loggerService?.info(`✅ Job completed successfully: ${job.type}`, {
          jobId: job.id,
          jobType: job.type,
          executionTime,
        });
      } else {
        this.loggerService?.warn(`⚠️ Job completed with errors: ${job.type}`, {
          jobId: job.id,
          jobType: job.type,
          error: result.error,
          executionTime,
        });
      }

      return {
        ...result,
        executionTime,
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      this.loggerService?.error(`❌ Job failed: ${job.type}`, error, {
        jobId: job.id,
        jobType: job.type,
        attempts: job.attempts,
        executionTime,
      });

      return {
        success: false,
        error: {
          message: error.message,
          code: error.code || 'PROCESSING_ERROR',
          details: error,
        },
        executionTime,
      };
    }
  }

  /**
   * Determine if job should be retried
   */
  shouldRetry(job: T, result: JobResult): boolean {
    if (result.success) {
      return false;
    }

    if (job.attempts >= job.maxAttempts) {
      return false;
    }

    // Don't retry certain error types
    const nonRetryableErrors = [
      'VALIDATION_ERROR',
      'AUTHORIZATION_ERROR',
      'NOT_FOUND',
      'MALFORMED_DATA',
    ];

    if (result.error?.code && nonRetryableErrors.includes(result.error.code)) {
      return false;
    }

    return true;
  }

  /**
   * Calculate delay for retry (exponential backoff)
   */
  getRetryDelay(attempts: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 300000; // 5 minutes
    const delay = Math.min(baseDelay * Math.pow(2, attempts), maxDelay);
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * Handle job failure (called when max retries exceeded)
   */
  async handleJobFailure(job: T, finalResult: JobResult): Promise<void> {
    this.loggerService?.error(`💀 Job failed permanently: ${job.type}`, finalResult.error, {
      jobId: job.id,
      jobType: job.type,
      totalAttempts: job.attempts,
      finalError: finalResult.error,
    });

    // Override in subclasses to handle specific failure scenarios
    // e.g., send to dead letter queue, notify administrators, etc.
  }

  /**
   * Validate job data - override in subclasses for specific validation
   */
  protected validateJobData(job: T): void {
    if (!job.id) {
      throw new Error('Job ID is required');
    }
    if (!job.type) {
      throw new Error('Job type is required');
    }
    if (!job.data) {
      throw new Error('Job data is required');
    }
  }

  /**
   * Clean up resources after job completion - override in subclasses
   */
  protected async cleanup(job: T, result: JobResult): Promise<void> {
    // Override in subclasses if cleanup is needed
  }
}