import { PrismaClient, ChangeSet, ChangeLevel, ChangeStatus, ConflictType } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { diff } from 'deep-object-diff';
import { CacheService } from './cache.service';
import { AuditService } from './audit.service';

export interface ProcessChangeParams {
  changeSetId?: string;
  entityType: string;
  entityId: string;
  changes: any;
  userId: number;
  tenantId: number;
}

export interface CreateChangeSetParams {
  entityType: string;
  entityId: string;
  changes: any;
  level?: ChangeLevel;
  userId: number;
  tenantId: number;
  metadata?: any;
}

export interface GetHistoryParams {
  entityType: string;
  entityId: string;
  limit?: number;
  offset?: number;
  includeRollbacks?: boolean;
}

export interface ApproveChangeParams {
  changeSetId: string;
  approvedBy: number;
  applyImmediately?: boolean;
}

export interface RejectChangeParams {
  changeSetId: string;
  rejectedBy: number;
  reason?: string;
}

export class ConflictError extends Error {
  constructor(
    public conflicts: any[],
    public current: any,
    public incoming: any
  ) {
    super('Conflict detected');
    this.name = 'ConflictError';
  }
}

export class ValidationError extends Error {
  constructor(public errors: any[]) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

export class ChangeService {
  constructor(
    private prisma: PrismaClient,
    private cache: CacheService,
    private auditService: AuditService,
    private fastify: FastifyInstance
  ) {}

  async createChangeSet(params: CreateChangeSetParams): Promise<ChangeSet> {
    const { entityType, entityId, changes, level = 'OPTIMISTIC', userId, tenantId, metadata } = params;

    const changeSet = await this.prisma.changeSet.create({
      data: {
        entityType,
        entityId,
        changes,
        level,
        status: 'PENDING',
        userId,
        tenantId,
        metadata,
        conflictIds: [],
      },
      include: {
        user: true,
        tenant: true,
      },
    });

    // Broadcast to WebSocket clients
    if (this.fastify.websocketServer) {
      this.fastify.websocketServer.broadcast({
        type: 'CHANGE_CREATED',
        data: changeSet,
      });
    }

    return changeSet;
  }

  async processChange(params: ProcessChangeParams) {
    const { changeSetId, entityType, entityId, changes, userId, tenantId } = params;

    // Get current state from database
    const current = await this.getCurrentState(entityType, entityId);
    
    // Check for conflicts
    const conflicts = await this.checkConflicts({
      current,
      incoming: changes,
      entityType,
      entityId,
      userId,
    });
    
    if (conflicts.length > 0 && changeSetId) {
      await this.recordConflicts(changeSetId, conflicts);
      throw new ConflictError(conflicts, current, changes);
    }
    
    // Validate changes
    const validation = await this.validateChanges({
      entityType,
      changes,
      current,
      userId,
    });
    
    if (!validation.valid) {
      throw new ValidationError(validation.errors);
    }
    
    // Update change set status if provided
    if (changeSetId) {
      await this.updateChangeSetStatus(changeSetId, 'PROCESSING');
    }
    
    // Apply changes using transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Calculate old and new values
      const oldValues = current;
      const newValues = { ...current, ...changes, updatedAt: new Date() };
      
      // Apply the change to the actual entity
      const updated = await this.applyChange(tx, entityType, entityId, changes);
      
      // Update change set with old/new values
      if (changeSetId) {
        await tx.changeSet.update({
          where: { id: changeSetId },
          data: {
            oldValues,
            newValues,
            level: 'PROCESSING',
          },
        });
      }
      
      // Record in audit log
      await this.auditService.createAuditLog({
        action: 'UPDATE',
        entityType,
        entityId,
        oldValues,
        newValues,
        userId,
        tenantId,
        metadata: { changeSetId },
      });
      
      // Create version history entry
      const versionCount = await tx.versionHistory.count({
        where: { entityType, entityId },
      });
      
      await tx.versionHistory.create({
        data: {
          entityType,
          entityId,
          versionNumber: versionCount + 1,
          data: newValues,
          changeSetId,
          createdBy: userId,
          tenantId,
        },
      });
      
      return updated;
    });
    
    // Invalidate caches
    await Promise.all([
      this.cache.delete(`${entityType}:${entityId}`),
      this.cache.delete(`${entityType}:list`),
      this.cache.delete(`${entityType}:list:${tenantId}`),
    ]);
    
    // Broadcast change
    if (this.fastify.websocketServer) {
      this.fastify.websocketServer.broadcast({
        type: 'ENTITY_UPDATED',
        data: {
          entityType,
          entityId,
          changes,
          changeSetId,
        },
      });
    }
    
    return { success: true, data: result };
  }

  async commitChange(changeSetId: string) {
    const changeSet = await this.prisma.changeSet.update({
      where: { id: changeSetId },
      data: {
        status: 'APPLIED',
        level: 'COMMITTED',
        appliedAt: new Date(),
      },
    });

    // Broadcast commit
    if (this.fastify.websocketServer) {
      this.fastify.websocketServer.broadcast({
        type: 'CHANGE_COMMITTED',
        data: changeSet,
      });
    }

    return changeSet;
  }

  async approveChange(params: ApproveChangeParams) {
    const { changeSetId, approvedBy, applyImmediately } = params;

    const changeSet = await this.prisma.changeSet.update({
      where: { id: changeSetId },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedAt: new Date(),
      },
      include: {
        user: true,
        approver: true,
      },
    });

    if (applyImmediately) {
      // Apply the changes
      await this.processChange({
        changeSetId,
        entityType: changeSet.entityType,
        entityId: changeSet.entityId,
        changes: changeSet.changes,
        userId: changeSet.userId,
        tenantId: changeSet.tenantId,
      });
      
      // Commit the change
      await this.commitChange(changeSetId);
    }

    return changeSet;
  }

  async rejectChange(params: RejectChangeParams) {
    const { changeSetId, rejectedBy, reason } = params;

    const changeSet = await this.prisma.changeSet.update({
      where: { id: changeSetId },
      data: {
        status: 'REJECTED',
        rejectedBy,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
      include: {
        user: true,
        rejecter: true,
      },
    });

    // Broadcast rejection
    if (this.fastify.websocketServer) {
      this.fastify.websocketServer.broadcast({
        type: 'CHANGE_REJECTED',
        data: changeSet,
      });
    }

    return changeSet;
  }

  async getChangeHistory(params: GetHistoryParams) {
    const { entityType, entityId, limit = 50, offset = 0, includeRollbacks = false } = params;
    
    const statusFilter = includeRollbacks 
      ? ['APPLIED', 'ROLLED_BACK'] as ChangeStatus[]
      : ['APPLIED'] as ChangeStatus[];
    
    const changes = await this.prisma.changeSet.findMany({
      where: {
        entityType,
        entityId,
        status: { in: statusFilter },
      },
      include: {
        user: true,
        approver: true,
        conflicts: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
    
    // Get version history
    const versions = await this.prisma.versionHistory.findMany({
      where: { entityType, entityId },
      orderBy: { versionNumber: 'desc' },
      take: limit,
      skip: offset,
    });
    
    // Calculate diffs between versions
    const history = changes.map((change, index) => {
      const previousChange = changes[index + 1];
      const diffData = previousChange 
        ? diff(previousChange.newValues || {}, change.newValues || {})
        : change.changes;
        
      return {
        ...change,
        diff: diffData,
        version: versions.find(v => v.changeSetId === change.id),
      };
    });
    
    return {
      changes: history,
      total: await this.prisma.changeSet.count({
        where: { entityType, entityId, status: { in: statusFilter } },
      }),
    };
  }

  async rollbackChange(changeSetId: string, userId: number) {
    const changeSet = await this.prisma.changeSet.findUnique({
      where: { id: changeSetId },
      include: { user: true },
    });

    if (!changeSet) {
      throw new Error('Change set not found');
    }

    if (changeSet.status !== 'APPLIED') {
      throw new Error('Can only rollback applied changes');
    }

    // Create a new change set for the rollback
    const rollbackChangeSet = await this.createChangeSet({
      entityType: changeSet.entityType,
      entityId: changeSet.entityId,
      changes: changeSet.oldValues || {},
      userId,
      tenantId: changeSet.tenantId,
      metadata: {
        rollbackOf: changeSetId,
        originalChange: changeSet,
      },
    });

    // Apply the rollback
    await this.processChange({
      changeSetId: rollbackChangeSet.id,
      entityType: changeSet.entityType,
      entityId: changeSet.entityId,
      changes: changeSet.oldValues || {},
      userId,
      tenantId: changeSet.tenantId,
    });

    // Mark original change as rolled back
    await this.prisma.changeSet.update({
      where: { id: changeSetId },
      data: { status: 'ROLLED_BACK' },
    });

    // Commit the rollback
    await this.commitChange(rollbackChangeSet.id);

    return rollbackChangeSet;
  }

  private async getCurrentState(entityType: string, entityId: string) {
    // This is a generic method - in real implementation, you'd have specific logic per entity type
    const model = this.prisma[entityType as keyof typeof this.prisma] as any;
    if (!model || typeof model.findUnique !== 'function') {
      throw new Error(`Invalid entity type: ${entityType}`);
    }
    
    return await model.findUnique({
      where: { id: entityId },
    });
  }

  private async applyChange(tx: any, entityType: string, entityId: string, changes: any) {
    // This is a generic method - in real implementation, you'd have specific logic per entity type
    const model = tx[entityType as keyof typeof tx] as any;
    if (!model || typeof model.update !== 'function') {
      throw new Error(`Invalid entity type: ${entityType}`);
    }
    
    return await model.update({
      where: { id: entityId },
      data: changes,
    });
  }

  private async checkConflicts(params: {
    current: any;
    incoming: any;
    entityType: string;
    entityId: string;
    userId: number;
  }) {
    const conflicts: any[] = [];
    
    // Check for concurrent edits
    const recentChanges = await this.prisma.changeSet.findMany({
      where: {
        entityType: params.entityType,
        entityId: params.entityId,
        status: 'PROCESSING',
        userId: { not: params.userId },
        createdAt: { gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
      },
    });
    
    if (recentChanges.length > 0) {
      conflicts.push({
        type: 'CONCURRENT_EDIT' as ConflictType,
        data: { recentChanges },
      });
    }
    
    // Check for stale data (if current version is different from what user started with)
    if (params.current?.updatedAt && params.incoming?._version) {
      const currentVersion = new Date(params.current.updatedAt).getTime();
      const incomingVersion = new Date(params.incoming._version).getTime();
      
      if (currentVersion > incomingVersion) {
        conflicts.push({
          type: 'STALE_DATA' as ConflictType,
          data: {
            currentVersion: params.current.updatedAt,
            incomingVersion: params.incoming._version,
          },
        });
      }
    }
    
    return conflicts;
  }

  private async recordConflicts(changeSetId: string, conflicts: any[]) {
    await this.prisma.$transaction(
      conflicts.map(conflict =>
        this.prisma.changeConflict.create({
          data: {
            changeSetId,
            conflictType: conflict.type,
            conflictData: conflict.data,
          },
        })
      )
    );
    
    // Update change set status
    await this.prisma.changeSet.update({
      where: { id: changeSetId },
      data: {
        status: 'CONFLICTED',
        conflictIds: conflicts.map(c => c.id).filter(Boolean),
      },
    });
  }

  private async validateChanges(params: {
    entityType: string;
    changes: any;
    current: any;
    userId: number;
  }) {
    const errors: any[] = [];
    
    // Add entity-specific validation logic here
    // This is a placeholder for demonstration
    
    // Example: Check required fields
    if (params.entityType === 'products' && params.changes.price !== undefined) {
      if (params.changes.price < 0) {
        errors.push({ field: 'price', message: 'Price cannot be negative' });
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private async updateChangeSetStatus(changeSetId: string, status: ChangeStatus) {
    await this.prisma.changeSet.update({
      where: { id: changeSetId },
      data: { status },
    });
  }

  async resolveConflict(conflictId: string, resolution: any, resolvedBy: number) {
    const conflict = await this.prisma.changeConflict.update({
      where: { id: conflictId },
      data: {
        resolution: resolution.type,
        resolvedBy,
        resolvedAt: new Date(),
      },
      include: { changeSet: true },
    });

    // Apply resolution based on type
    switch (resolution.type) {
      case 'ACCEPT_CURRENT':
        // Reject the change set
        await this.rejectChange({
          changeSetId: conflict.changeSetId,
          rejectedBy: resolvedBy,
          reason: 'Conflict resolved: keeping current version',
        });
        break;
        
      case 'ACCEPT_INCOMING':
        // Re-process the change
        await this.processChange({
          changeSetId: conflict.changeSetId,
          entityType: conflict.changeSet.entityType,
          entityId: conflict.changeSet.entityId,
          changes: conflict.changeSet.changes,
          userId: conflict.changeSet.userId,
          tenantId: conflict.changeSet.tenantId,
        });
        break;
        
      case 'MERGE':
        // Apply merged changes
        if (resolution.mergedChanges) {
          await this.processChange({
            changeSetId: conflict.changeSetId,
            entityType: conflict.changeSet.entityType,
            entityId: conflict.changeSet.entityId,
            changes: resolution.mergedChanges,
            userId: resolvedBy,
            tenantId: conflict.changeSet.tenantId,
          });
        }
        break;
    }

    return conflict;
  }
}