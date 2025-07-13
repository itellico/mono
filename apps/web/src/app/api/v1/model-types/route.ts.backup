import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { db as prisma } from '@/lib/db';
import { Prisma } from '@prisma/client';

// ============================
// 🏷️ MODEL TYPES API
// ============================

// Model Type Creation Schema
const createModelTypeSchema = z.object({
  type: z.string().min(2, 'Type is required').max(50, 'Type must be under 50 characters'),
  subType: z.string().min(2, 'Sub-type is required').max(50, 'Sub-type must be under 50 characters'),
  displayName: z.object({
    'en-US': z.string().min(2, 'Display name is required')
  }),
  description: z.object({
    'en-US': z.string().optional()
  }).optional(),
  category: z.string().min(1, 'Category is required'),
  modelId: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    logger.info('[Model Types API] Creating new model type');

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      logger.warn('[Model Types API] Unauthorized access attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = createModelTypeSchema.parse(body);

    logger.info('[Model Types API] Creating model type', {
      type: validatedData.type,
      subType: validatedData.subType,
      userId: session.user.id
    });

    // Create the model schema entry
    const newModelType = await prisma.modelSchema.create({
      data: {
        type: validatedData.type,
        subType: validatedData.subType,
        displayName: validatedData.displayName,
        description: validatedData.description || Prisma.JsonNull,
        schema: { fields: [], version: '1.0.0', category: validatedData.category, metadata: { createdBy: session.user.id, modelId: validatedData.modelId, category: validatedData.category } },
        isActive: true,
        metadata: { createdBy: session.user.id, modelId: validatedData.modelId, category: validatedData.category },
      },
    });

    logger.info('[Model Types API] Model type created successfully', {
      id: newModelType.id,
      type: validatedData.type,
      subType: validatedData.subType
    });

    return NextResponse.json({
      success: true,
      data: {
        id: newModelType.id,
        type: newModelType.type,
        subType: newModelType.subType,
        displayName: newModelType.displayName,
        description: newModelType.description,
        category: validatedData.category,
        createdAt: newModelType.createdAt
      },
      message: 'Model type created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.warn('[Model Types API] Validation error', { errors: error.errors });
      return NextResponse.json(
        { 
          success: false, 
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      );
    }

    logger.error('[Model Types API] Unexpected error', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    logger.info('[Model Types API] Fetching model types');

    // Check authentication
    const session = await auth();
    if (!session?.user) {
      logger.warn('[Model Types API] Unauthorized access attempt');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const modelId = searchParams.get('modelId');
    const category = searchParams.get('category');

    // Fetch model types (simplified query for now)
    const modelTypes = await prisma.modelSchema.findMany();

    // Filter active types and apply additional filters
    const filteredTypes = modelTypes
      .filter(type => type.isActive)
      .filter(type => !modelId || (type.metadata as any)?.modelId === modelId)
      .filter(type => !category || (type.metadata as any)?.category === category);

    logger.info('[Model Types API] Model types retrieved', {
      count: filteredTypes.length,
      modelId,
      category
    });

    return NextResponse.json({
      success: true,
      data: filteredTypes.map(type => ({
        id: type.id,
        type: type.type,
        subType: type.subType,
        displayName: type.displayName,
        description: type.description,
        category: (type.metadata as any)?.category,
        modelId: (type.metadata as any)?.modelId,
        createdAt: type.createdAt,
        updatedAt: type.updatedAt
      }))
    });

  } catch (error) {
    logger.error('[Model Types API] Error fetching model types', { error: error.message });
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 