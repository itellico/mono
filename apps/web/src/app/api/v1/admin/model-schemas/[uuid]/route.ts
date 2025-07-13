import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { ModelSchemasService } from '@/lib/services/model-schemas.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ============================
// 🏗️ INDIVIDUAL MODEL SCHEMA API ENDPOINTS
// ============================

// Validation schema for updates
const updateModelSchemaSchema = z.object({
  displayName: z.record(z.string(), z.string()).optional(),
  description: z.record(z.string(), z.string()).optional(),
  schema: z.object({
    fields: z.array(z.object({
      id: z.string(),
      name: z.string(),
      label: z.record(z.string(), z.string()),
      type: z.enum(['string', 'number', 'boolean', 'date', 'email', 'url', 'phone', 'enum', 'multiselect', 'option_set', 'text', 'file', 'image']),
      required: z.boolean(),
      validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
        pattern: z.string().optional(),
        custom: z.string().optional(),
      }).optional(),
      defaultValue: z.any().optional(),
      options: z.array(z.object({
        value: z.string(),
        label: z.record(z.string(), z.string()),
        metadata: z.record(z.string(), z.any()).optional(),
      })).optional(),
      optionSetId: z.number().optional(), // Reference to option_sets table
      allowMultiple: z.boolean().optional(), // For multiselect fields using option sets
      metadata: z.record(z.string(), z.any()).optional(),
    })),
    version: z.string(),
    validationRules: z.record(z.string(), z.any()).optional(),
  }).optional(),
  isActive: z.boolean().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

// ============================
// 📋 GET - Get specific model schema
// ============================
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    // Simplified admin access for development - matching admin layout approach
    // TODO: Replace with proper authentication in production
    const session = await auth();

    // For development, allow access if no session (matching admin layout approach)
    // In production, this should require proper authentication
    if (session?.user && (session.user as any).adminRole && (session.user as any).adminRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const modelSchema = await ModelSchemasService.getModelSchemaById(params.id);

    if (!modelSchema) {
      return NextResponse.json(
        { success: false, error: 'Model schema not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: modelSchema,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error({ error, modelSchemaId: (await props.params).id }, 'Failed to fetch model schema');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================
// ✏️ PUT - Update model schema
// ============================
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    // Simplified admin access for development - matching admin layout approach
    // TODO: Replace with proper authentication in production
    const session = await auth();

    // For development, allow access if no session (matching admin layout approach)
    // In production, this should require proper authentication
    if (session?.user && (session.user as any).adminRole && (session.user as any).adminRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = updateModelSchemaSchema.parse(body);

    // Validate schema definition if provided
    if (validatedData.schema && !ModelSchemasService.validateSchemaDefinition(validatedData.schema as any)) {
      return NextResponse.json(
        { success: false, error: 'Invalid schema definition' },
        { status: 400 }
      );
    }

    const modelSchema = await ModelSchemasService.updateModelSchema(params.id, validatedData as any);

    if (!modelSchema) {
      return NextResponse.json(
        { success: false, error: 'Model schema not found' },
        { status: 404 }
      );
    }

    logger.info(
      { 
        modelSchemaId: modelSchema.id, 
        type: modelSchema.type, 
        subType: modelSchema.subType,
        userId: session.user.id 
      }, 
      'Model schema updated'
    );

    return NextResponse.json({
      success: true,
      data: modelSchema,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    logger.error({ error, modelSchemaId: (await props.params).id }, 'Failed to update model schema');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================
// 🗑️ DELETE - Delete model schema
// ============================
export async function DELETE(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    // Simplified admin access for development - matching admin layout approach
    // TODO: Replace with proper authentication in production
    const session = await auth();

    // For development, allow access if no session (matching admin layout approach)
    // In production, this should require proper authentication
    if (session?.user && (session.user as any).adminRole && (session.user as any).adminRole !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const success = await ModelSchemasService.deleteModelSchema(params.id);

    if (!success) {
      return NextResponse.json(
        { success: false, error: 'Model schema not found' },
        { status: 404 }
      );
    }

    logger.info(
      { 
        modelSchemaId: params.id,
        userId: session.user.id 
      }, 
      'Model schema deleted'
    );

    return NextResponse.json({
      success: true,
      message: 'Model schema deleted successfully',
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.error({ error, modelSchemaId: (await props.params).id }, 'Failed to delete model schema');
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 