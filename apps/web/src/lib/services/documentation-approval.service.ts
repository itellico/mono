import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export interface DocumentationUpdate {
  id: string;
  type: 'implementation' | 'pattern' | 'guide' | 'api';
  title: string;
  description: string;
  proposedBy: string; // 'claude' | 'developer' | userId
  proposedAt: Date;
  expiresAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  changes: {
    file: string;
    before: string;
    after: string;
    diff?: string;
  }[];
  metadata?: {
    feature?: string;
    filesChanged?: string[];
    patternsUsed?: string[];
    learnings?: string;
    gotchas?: string;
  };
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewComment?: string;
}

export class DocumentationApprovalService {
  private static instance: DocumentationApprovalService;
  private readonly PENDING_TTL = 86400; // 24 hours
  
  // Redis keys following naming convention
  private readonly REDIS_KEYS = {
    pending: 'platform:docs:pending',
    update: (id: string) => `platform:docs:update:${id}`,
    history: 'platform:docs:history',
    stats: 'platform:docs:stats'
  };

  private constructor() {}

  static getInstance(): DocumentationApprovalService {
    if (!DocumentationApprovalService.instance) {
      DocumentationApprovalService.instance = new DocumentationApprovalService();
    }
    return DocumentationApprovalService.instance;
  }

  /**
   * Propose a documentation update for approval
   */
  async proposeUpdate(update: Omit<DocumentationUpdate, 'id' | 'proposedAt' | 'expiresAt' | 'status'>): Promise<DocumentationUpdate> {
    const id = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.PENDING_TTL * 1000);

    const fullUpdate: DocumentationUpdate = {
      ...update,
      id,
      proposedAt: now,
      expiresAt,
      status: 'pending'
    };

    try {
      // Store in Redis with TTL
      await redis.setex(
        this.REDIS_KEYS.update(id),
        this.PENDING_TTL,
        JSON.stringify(fullUpdate)
      );

      // Add to pending list
      await redis.zadd(
        this.REDIS_KEYS.pending,
        now.getTime(),
        id
      );

      // Update stats
      await redis.hincrby(this.REDIS_KEYS.stats, 'total_proposed', 1);
      await redis.hincrby(this.REDIS_KEYS.stats, `proposed_by_${update.proposedBy}`, 1);

      logger.info('Documentation update proposed', { 
        id, 
        title: update.title,
        proposedBy: update.proposedBy 
      });

      // Trigger N8N webhook for notification
      await this.triggerNotification(fullUpdate);

      return fullUpdate;
    } catch (error) {
      logger.error('Error proposing documentation update', error);
      throw error;
    }
  }

  /**
   * Get all pending updates
   */
  async getPendingUpdates(): Promise<DocumentationUpdate[]> {
    try {
      // Get pending update IDs sorted by timestamp
      const ids = await redis.zrange(this.REDIS_KEYS.pending, 0, -1);
      
      if (!ids || ids.length === 0) {
        return [];
      }

      // Fetch all updates
      const updates: DocumentationUpdate[] = [];
      for (const id of ids) {
        const data = await redis.get(this.REDIS_KEYS.update(id));
        if (data) {
          updates.push(JSON.parse(data));
        } else {
          // Remove from pending list if data doesn't exist
          await redis.zrem(this.REDIS_KEYS.pending, id);
        }
      }

      return updates.filter(u => u.status === 'pending');
    } catch (error) {
      logger.error('Error getting pending updates', error);
      return [];
    }
  }

  /**
   * Get a specific update by ID
   */
  async getUpdate(id: string): Promise<DocumentationUpdate | null> {
    try {
      const data = await redis.get(this.REDIS_KEYS.update(id));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Error getting update', { id, error });
      return null;
    }
  }

  /**
   * Approve an update
   */
  async approveUpdate(id: string, reviewedBy: string, comment?: string): Promise<DocumentationUpdate> {
    const update = await this.getUpdate(id);
    if (!update) {
      throw new Error('Update not found');
    }

    if (update.status !== 'pending') {
      throw new Error(`Update already ${update.status}`);
    }

    update.status = 'approved';
    update.reviewedBy = reviewedBy;
    update.reviewedAt = new Date();
    update.reviewComment = comment;

    try {
      // Update in Redis
      await redis.setex(
        this.REDIS_KEYS.update(id),
        this.PENDING_TTL,
        JSON.stringify(update)
      );

      // Remove from pending list
      await redis.zrem(this.REDIS_KEYS.pending, id);

      // Add to history
      await redis.zadd(
        this.REDIS_KEYS.history,
        update.reviewedAt.getTime(),
        id
      );

      // Update stats
      await redis.hincrby(this.REDIS_KEYS.stats, 'total_approved', 1);

      logger.info('Documentation update approved', { id, reviewedBy });

      // Apply the changes
      await this.applyUpdate(update);

      return update;
    } catch (error) {
      logger.error('Error approving update', { id, error });
      throw error;
    }
  }

  /**
   * Reject an update
   */
  async rejectUpdate(id: string, reviewedBy: string, reason: string): Promise<DocumentationUpdate> {
    const update = await this.getUpdate(id);
    if (!update) {
      throw new Error('Update not found');
    }

    if (update.status !== 'pending') {
      throw new Error(`Update already ${update.status}`);
    }

    update.status = 'rejected';
    update.reviewedBy = reviewedBy;
    update.reviewedAt = new Date();
    update.reviewComment = reason;

    try {
      // Update in Redis
      await redis.setex(
        this.REDIS_KEYS.update(id),
        this.PENDING_TTL,
        JSON.stringify(update)
      );

      // Remove from pending list
      await redis.zrem(this.REDIS_KEYS.pending, id);

      // Add to history
      await redis.zadd(
        this.REDIS_KEYS.history,
        update.reviewedAt.getTime(),
        id
      );

      // Update stats
      await redis.hincrby(this.REDIS_KEYS.stats, 'total_rejected', 1);

      logger.info('Documentation update rejected', { id, reviewedBy, reason });

      return update;
    } catch (error) {
      logger.error('Error rejecting update', { id, error });
      throw error;
    }
  }

  /**
   * Get approval statistics
   */
  async getStats(): Promise<Record<string, number>> {
    try {
      const stats = await redis.hgetall(this.REDIS_KEYS.stats);
      return Object.entries(stats).reduce((acc, [key, value]) => {
        acc[key] = parseInt(value, 10);
        return acc;
      }, {} as Record<string, number>);
    } catch (error) {
      logger.error('Error getting stats', error);
      return {};
    }
  }

  /**
   * Trigger N8N webhook for Mattermost notification
   */
  private async triggerNotification(update: DocumentationUpdate): Promise<void> {
    try {
      // N8N webhook URL - should be configured in environment
      const webhookUrl = process.env.N8N_DOCS_WEBHOOK_URL;
      if (!webhookUrl) {
        logger.warn('N8N webhook URL not configured for documentation notifications');
        return;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          updateId: update.id,
          title: update.title,
          description: update.description,
          proposedBy: update.proposedBy,
          filesCount: update.changes.length,
          reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/admin/docs/review/${update.id}`,
          timestamp: update.proposedAt.toISOString()
        })
      });

      if (!response.ok) {
        logger.error('Failed to trigger N8N notification', { 
          status: response.status,
          statusText: response.statusText 
        });
      }
    } catch (error) {
      logger.error('Error triggering N8N notification', error);
      // Don't throw - notification failure shouldn't block the update proposal
    }
  }

  /**
   * Apply approved update to the documentation
   */
  private async applyUpdate(update: DocumentationUpdate): Promise<void> {
    // This will be called when an update is approved
    // The actual implementation would write the changes to files
    
    // For now, we'll use the existing documentationService
    if (update.type === 'implementation' && update.metadata) {
      const { documentationService } = await import('./documentation.service');
      await documentationService.addImplementation({
        feature: update.metadata.feature || update.title,
        request: update.description,
        implementation: update.changes[0]?.after || '',
        filesChanged: update.metadata.filesChanged || [],
        patternsUsed: update.metadata.patternsUsed || [],
        learnings: update.metadata.learnings || '',
        gotchas: update.metadata.gotchas,
        relatedDocs: update.changes.map(c => c.file)
      });
    }

    // TODO: Implement file writing for other update types
  }
}

// Export singleton instance
export const documentationApprovalService = DocumentationApprovalService.getInstance();