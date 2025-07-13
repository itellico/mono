import { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { checkUserPermissions } from '@/lib/permissions';
import { successResponse, errorResponse } from '@/lib/response';
import { handleRouteError } from '@/lib/errors';
import { generateId } from '@/lib/utils';

const featureSetSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  features: z.array(z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    category: z.string(),
    tier: z.enum(['platform', 'tenant', 'account', 'user', 'public']),
    enabled: z.boolean(),
    limits: z.record(z.union([z.number(), z.boolean()])).optional(),
  })),
  isDefault: z.boolean().default(false),
  tier: z.enum(['platform', 'tenant', 'account', 'user', 'public']),
});

export async function GET(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return errorResponse(reply, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const hasPermission = await checkUserPermissions(userId, ['platform.feature-sets.view']);
    if (!hasPermission) {
      return errorResponse(reply, 'FORBIDDEN', 'Insufficient permissions', 403);
    }

    const featureSets = await prisma.featureSet.findMany({
      include: {
        features: {
          include: {
            feature: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedSets = featureSets.map(set => ({
      id: set.id,
      name: set.name,
      description: set.description,
      tier: set.tier,
      isDefault: set.isDefault,
      features: set.features.map(fsf => ({
        id: fsf.feature.id,
        name: fsf.feature.name,
        description: fsf.feature.description,
        category: fsf.feature.category,
        tier: fsf.feature.tier,
        enabled: fsf.enabled,
        limits: fsf.limits,
      })),
      createdAt: set.createdAt,
      updatedAt: set.updatedAt,
    }));

    return successResponse(reply, formattedSets);
  } catch (error) {
    return handleRouteError(reply, error);
  }
}

export async function POST(request: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return errorResponse(reply, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const hasPermission = await checkUserPermissions(userId, ['platform.feature-sets.create']);
    if (!hasPermission) {
      return errorResponse(reply, 'FORBIDDEN', 'Insufficient permissions', 403);
    }

    const body = featureSetSchema.parse(request.body);

    const featureSet = await prisma.$transaction(async (tx) => {
      if (body.isDefault) {
        await tx.featureSet.updateMany({
          where: { tier: body.tier, isDefault: true },
          data: { isDefault: false },
        });
      }

      const newSet = await tx.featureSet.create({
        data: {
          id: generateId(),
          name: body.name,
          description: body.description,
          tier: body.tier,
          isDefault: body.isDefault,
        },
      });

      if (body.features.length > 0) {
        await tx.featureSetFeature.createMany({
          data: body.features.map(feature => ({
            featureSetId: newSet.id,
            featureId: feature.id,
            enabled: feature.enabled,
            limits: feature.limits || {},
          })),
        });
      }

      return tx.featureSet.findUnique({
        where: { id: newSet.id },
        include: {
          features: {
            include: {
              feature: true,
            },
          },
        },
      });
    });

    await tx.auditLog.create({
      data: {
        id: generateId(),
        userId,
        action: 'create',
        entityType: 'feature_set',
        entityId: featureSet.id,
        metadata: {
          name: body.name,
          featureCount: body.features.length,
        },
      },
    });

    const formattedSet = {
      id: featureSet.id,
      name: featureSet.name,
      description: featureSet.description,
      tier: featureSet.tier,
      isDefault: featureSet.isDefault,
      features: featureSet.features.map(fsf => ({
        id: fsf.feature.id,
        name: fsf.feature.name,
        description: fsf.feature.description,
        category: fsf.feature.category,
        tier: fsf.feature.tier,
        enabled: fsf.enabled,
        limits: fsf.limits,
      })),
      createdAt: featureSet.createdAt,
      updatedAt: featureSet.updatedAt,
    };

    return successResponse(reply, formattedSet, 201);
  } catch (error) {
    return handleRouteError(reply, error);
  }
}

export async function PUT(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return errorResponse(reply, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const hasPermission = await checkUserPermissions(userId, ['platform.feature-sets.update']);
    if (!hasPermission) {
      return errorResponse(reply, 'FORBIDDEN', 'Insufficient permissions', 403);
    }

    const { id } = request.params;
    const body = featureSetSchema.parse(request.body);

    const featureSet = await prisma.$transaction(async (tx) => {
      const existing = await tx.featureSet.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new Error('Feature set not found');
      }

      if (body.isDefault && !existing.isDefault) {
        await tx.featureSet.updateMany({
          where: { tier: body.tier, isDefault: true },
          data: { isDefault: false },
        });
      }

      await tx.featureSet.update({
        where: { id },
        data: {
          name: body.name,
          description: body.description,
          tier: body.tier,
          isDefault: body.isDefault,
          updatedAt: new Date(),
        },
      });

      await tx.featureSetFeature.deleteMany({
        where: { featureSetId: id },
      });

      if (body.features.length > 0) {
        await tx.featureSetFeature.createMany({
          data: body.features.map(feature => ({
            featureSetId: id,
            featureId: feature.id,
            enabled: feature.enabled,
            limits: feature.limits || {},
          })),
        });
      }

      return tx.featureSet.findUnique({
        where: { id },
        include: {
          features: {
            include: {
              feature: true,
            },
          },
        },
      });
    });

    await tx.auditLog.create({
      data: {
        id: generateId(),
        userId,
        action: 'update',
        entityType: 'feature_set',
        entityId: id,
        metadata: {
          name: body.name,
          featureCount: body.features.length,
        },
      },
    });

    const formattedSet = {
      id: featureSet.id,
      name: featureSet.name,
      description: featureSet.description,
      tier: featureSet.tier,
      isDefault: featureSet.isDefault,
      features: featureSet.features.map(fsf => ({
        id: fsf.feature.id,
        name: fsf.feature.name,
        description: fsf.feature.description,
        category: fsf.feature.category,
        tier: fsf.feature.tier,
        enabled: fsf.enabled,
        limits: fsf.limits,
      })),
      createdAt: featureSet.createdAt,
      updatedAt: featureSet.updatedAt,
    };

    return successResponse(reply, formattedSet);
  } catch (error) {
    return handleRouteError(reply, error);
  }
}

export async function DELETE(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const userId = request.user?.id;
    if (!userId) {
      return errorResponse(reply, 'UNAUTHORIZED', 'Authentication required', 401);
    }

    const hasPermission = await checkUserPermissions(userId, ['platform.feature-sets.delete']);
    if (!hasPermission) {
      return errorResponse(reply, 'FORBIDDEN', 'Insufficient permissions', 403);
    }

    const { id } = request.params;

    const planCount = await prisma.plan.count({
      where: { featureSetId: id },
    });

    if (planCount > 0) {
      return errorResponse(
        reply,
        'CONFLICT',
        `Cannot delete feature set. It is used by ${planCount} plan(s).`,
        409
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.featureSetFeature.deleteMany({
        where: { featureSetId: id },
      });

      await tx.featureSet.delete({
        where: { id },
      });
    });

    await tx.auditLog.create({
      data: {
        id: generateId(),
        userId,
        action: 'delete',
        entityType: 'feature_set',
        entityId: id,
      },
    });

    return successResponse(reply, { message: 'Feature set deleted successfully' });
  } catch (error) {
    return handleRouteError(reply, error);
  }
}