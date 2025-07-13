import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AuditService } from '@/modules/audit/audit.service';
import { CacheInvalidatorService } from '@/modules/cache/services/cache-invalidator.service';

export interface CrudOptions {
  includeDeleted?: boolean;
  auditEnabled?: boolean;
  cacheEnabled?: boolean;
}

/**
 * Base CRUD service with UUID support and best practices
 * Handles both UUID and numeric ID during migration
 */
@Injectable()
export abstract class BaseCrudService<
  Model,
  CreateInput,
  UpdateInput,
  WhereInput = any,
  WhereUniqueInput = any,
> {
  protected abstract readonly modelName: string;

  constructor(
    protected readonly prisma: PrismaService,
    protected readonly auditService?: AuditService,
    protected readonly cacheInvalidator?: CacheInvalidatorService,
  ) {}

  /**
   * Find a single record by UUID or ID
   */
  async findOne(
    identifier: string | number,
    options?: {
      include?: any;
      select?: any;
      includeDeleted?: boolean;
    },
  ): Promise<Model | null> {
    const where = this.buildWhereClause(identifier, options?.includeDeleted);
    
    const result = await (this.prisma[this.modelName] as any).findFirst({
      where,
      include: options?.include,
      select: options?.select,
    });

    if (!result) {
      throw new NotFoundException(
        `${this.modelName} with identifier ${identifier} not found`,
      );
    }

    return result;
  }

  /**
   * Find many records with pagination
   */
  async findMany(
    args: {
      where?: WhereInput;
      orderBy?: any;
      skip?: number;
      take?: number;
      include?: any;
      select?: any;
    },
    options?: CrudOptions,
  ): Promise<{
    items: Model[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { skip = 0, take = 20 } = args;
    const where = this.enhanceWhereClause(args.where, options);

    const [items, total] = await Promise.all([
      (this.prisma[this.modelName] as any).findMany({
        ...args,
        where,
        skip,
        take,
      }),
      (this.prisma[this.modelName] as any).count({ where }),
    ]);

    return {
      items,
      total,
      page: Math.floor(skip / take) + 1,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Create a new record with UUID
   */
  async create(
    data: CreateInput,
    userId?: number,
    tenantId?: number,
  ): Promise<Model> {
    const createData = {
      ...data,
      ...(userId && { createdBy: userId }),
    } as any;

    const result = await (this.prisma[this.modelName] as any).create({
      data: createData,
    });

    // Audit log
    if (this.auditService) {
      await this.auditService.logEvent({
        category: 'DATA_CHANGE',
        eventType: 'create',
        entityType: this.modelName,
        entityId: result.uuid || result.id,
        userId,
        tenantId,
        operation: `create_${this.modelName.toLowerCase()}`,
        changes: { created: data },
      });
    }

    // Invalidate cache
    if (this.cacheInvalidator) {
      await this.cacheInvalidator.invalidateForModel(this.modelName, result);
    }

    return result;
  }

  /**
   * Update a record by UUID or ID
   */
  async update(
    identifier: string | number,
    data: UpdateInput,
    userId?: number,
    tenantId?: number,
  ): Promise<Model> {
    const where = this.buildWhereClause(identifier);
    
    // Get original for audit
    const original = await this.findOne(identifier);
    
    const updateData = {
      ...data,
      ...(userId && { updatedBy: userId }),
      updatedAt: new Date(),
    } as any;

    const result = await (this.prisma[this.modelName] as any).update({
      where,
      data: updateData,
    });

    // Audit log
    if (this.auditService && original) {
      await this.auditService.logEvent({
        category: 'DATA_CHANGE',
        eventType: 'update',
        entityType: this.modelName,
        entityId: result.uuid || result.id,
        userId,
        tenantId,
        operation: `update_${this.modelName.toLowerCase()}`,
        changes: this.diffObjects(original, result),
      });
    }

    // Invalidate cache
    if (this.cacheInvalidator) {
      await this.cacheInvalidator.invalidateForModel(this.modelName, result);
    }

    return result;
  }

  /**
   * Soft delete a record
   */
  async softDelete(
    identifier: string | number,
    userId?: number,
    tenantId?: number,
  ): Promise<Model> {
    const updateData = {
      deletedAt: new Date(),
      ...(userId && { deletedBy: userId }),
    };

    const result = await this.update(identifier, updateData as any, userId, tenantId);

    // Additional audit for delete
    if (this.auditService) {
      await this.auditService.logEvent({
        category: 'DATA_CHANGE',
        eventType: 'delete',
        severity: 'WARN',
        entityType: this.modelName,
        entityId: result.uuid || result.id,
        userId,
        tenantId,
        operation: `delete_${this.modelName.toLowerCase()}`,
      });
    }

    return result;
  }

  /**
   * Hard delete a record (use with caution)
   */
  async hardDelete(
    identifier: string | number,
    userId?: number,
    tenantId?: number,
  ): Promise<void> {
    const where = this.buildWhereClause(identifier);
    const record = await this.findOne(identifier);

    await (this.prisma[this.modelName] as any).delete({ where });

    // Audit log
    if (this.auditService && record) {
      await this.auditService.logEvent({
        category: 'DATA_CHANGE',
        eventType: 'delete',
        severity: 'CRITICAL',
        entityType: this.modelName,
        entityId: record.uuid || record.id,
        userId,
        tenantId,
        operation: `hard_delete_${this.modelName.toLowerCase()}`,
        changes: { deleted: record },
      });
    }

    // Invalidate cache
    if (this.cacheInvalidator && record) {
      await this.cacheInvalidator.invalidateForModel(this.modelName, record);
    }
  }

  /**
   * Build where clause supporting both UUID and ID
   */
  protected buildWhereClause(
    identifier: string | number,
    includeDeleted = false,
  ): any {
    const isUuid = typeof identifier === 'string' && identifier.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    const where: any = isUuid
      ? { uuid: identifier }
      : { id: typeof identifier === 'string' ? parseInt(identifier, 10) : identifier };

    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return where;
  }

  /**
   * Enhance where clause with soft delete filter
   */
  protected enhanceWhereClause(
    where: any = {},
    options?: CrudOptions,
  ): any {
    if (!options?.includeDeleted) {
      return {
        ...where,
        deletedAt: null,
      };
    }
    return where;
  }

  /**
   * Diff two objects for audit logging
   */
  protected diffObjects(original: any, updated: any): any {
    const changes: any = {};
    
    for (const key in updated) {
      if (
        original[key] !== updated[key] &&
        !['createdAt', 'updatedAt'].includes(key)
      ) {
        changes[key] = {
          old: original[key],
          new: updated[key],
        };
      }
    }

    return changes;
  }
}