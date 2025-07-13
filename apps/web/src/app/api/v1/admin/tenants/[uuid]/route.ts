import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { canAccessAPI, extractUserContext } from '@/lib/permissions/enhanced-unified-permission-system';
import { TenantsService } from '@/lib/services/tenants.service';
import { logger } from '@/lib/logger';
import { z } from 'zod';

const updateTenantSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  domain: z.string().optional(),
  slug: z.string().optional(),
  description: z.union([z.string(), z.record(z.string()), z.null()]).optional(),
  features: z.union([z.record(z.any()), z.null()]).optional(),
  settings: z.union([z.record(z.any()), z.null()]).optional(),
  categories: z.array(z.string()).optional(),
  allowedCountries: z.array(z.string()).optional(),
  defaultCurrency: z.union([z.string(), z.null()]).optional(),
  isActive: z.boolean().optional(),
  // ✅ FIXED: Add missing contact and other tenant fields
  contactEmail: z.string().email('Invalid email format').optional(),
  contactPhone: z.string().optional(),
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
  plan: z.enum(['starter', 'professional', 'enterprise']).optional(),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD']).optional(),
  timezone: z.string().optional(),
});

/**
 * @openapi
 * /api/v1/admin/tenants/{uuid}:
 *   get:
 *     summary: Get tenant by UUID
 *     tags: [Tenants]
 *     parameters:
 *       - name: uuid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tenant retrieved successfully
 *       404:
 *         description: Tenant not found
 *       403:
 *         description: Access denied
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { uuid } = resolvedParams;

    // Check API access permission
    const userContext = extractUserContext(session);
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/tenants', 'GET');

    if (!hasAccess.allowed) {
      logger.warn('Tenant GET access denied', {
        userId: session.user.id,
        uuid,
        reason: hasAccess.reason,
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const tenantsService = new TenantsService();
    const tenant = await tenantsService.getTenantByUuid(uuid);

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    return NextResponse.json({ tenant });
  } catch (error) {
    logger.error('Failed to get tenant', { error, uuid: (await params).uuid });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/v1/admin/tenants/{uuid}:
 *   put:
 *     summary: Update tenant
 *     tags: [Tenants]
 *     parameters:
 *       - name: uuid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Tenant updated successfully
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Access denied
 *       404:
 *         description: Tenant not found
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { uuid } = resolvedParams;

    // Check API access permission
    const userContext = extractUserContext(session);
    
    console.log('DEBUG: User context in tenants PUT route', {
      isAuthenticated: !!session?.user,
      userId: session.user.id,
      email: session.user.email,
      role: userContext?.role,
      tenantId: userContext?.tenantId,
      adminRole: userContext?.adminRole
    });
    
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/tenants', 'PUT');

    if (!hasAccess.allowed) {
      console.log('DEBUG: Access denied:', hasAccess);
      logger.warn('Tenant PUT access denied', {
        userId: session.user.id,
        uuid,
        reason: hasAccess.reason,
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    console.log('DEBUG: Access granted, proceeding with request');

    let body;
    try {
      body = await request.json();
      console.log('DEBUG: Request body received:', JSON.stringify(body, null, 2));
    } catch (parseError) {
      console.log('DEBUG: Failed to parse JSON body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
    }
    
    let validatedData;
    try {
      validatedData = updateTenantSchema.parse(body);
      console.log('DEBUG: Validated data:', JSON.stringify(validatedData, null, 2));
    } catch (validationError) {
      console.log('DEBUG: Validation error:', validationError);
      if (validationError instanceof z.ZodError) {
        console.log('DEBUG: Zod validation errors:', JSON.stringify(validationError.errors, null, 2));
        return NextResponse.json(
          { error: 'Validation failed', details: validationError.errors },
          { status: 400 }
        );
      }
      throw validationError;
    }

    console.log('DEBUG: About to call tenantsService.updateTenantByUuid');
    const tenantsService = new TenantsService();
    
    // Transform the validated data to handle null values
    const transformedData: any = {};
    
    if (validatedData.name !== undefined) transformedData.name = validatedData.name;
    if (validatedData.domain !== undefined) transformedData.domain = validatedData.domain;
    if (validatedData.slug !== undefined) transformedData.slug = validatedData.slug;
    if (validatedData.description !== undefined && validatedData.description !== null) {
      transformedData.description = validatedData.description;
    }
    if (validatedData.features !== undefined && validatedData.features !== null) {
      transformedData.features = validatedData.features;
    }
    if (validatedData.settings !== undefined && validatedData.settings !== null) {
      transformedData.settings = validatedData.settings;
    }
    if (validatedData.categories !== undefined) transformedData.categories = validatedData.categories;
    if (validatedData.allowedCountries !== undefined) transformedData.allowedCountries = validatedData.allowedCountries;
    if (validatedData.defaultCurrency !== undefined && validatedData.defaultCurrency !== null) {
      transformedData.defaultCurrency = validatedData.defaultCurrency;
    }
    if (validatedData.isActive !== undefined) transformedData.isActive = validatedData.isActive;
    // ✅ FIXED: Add missing contact and other fields to transformation
    if (validatedData.contactEmail !== undefined) transformedData.contactEmail = validatedData.contactEmail;
    if (validatedData.contactPhone !== undefined) transformedData.contactPhone = validatedData.contactPhone;
    if (validatedData.status !== undefined) transformedData.status = validatedData.status;
    if (validatedData.plan !== undefined) transformedData.plan = validatedData.plan;
    if (validatedData.currency !== undefined) transformedData.currency = validatedData.currency;
    if (validatedData.timezone !== undefined) transformedData.timezone = validatedData.timezone;
    
    console.log('DEBUG: Transformed data for service:', JSON.stringify(transformedData, null, 2));
    
    // ✅ AUDIT LOGGING: Pass userId to service for audit tracking
    const updatedTenant = await tenantsService.updateTenantByUuid(uuid, transformedData, session.user.id as string);

    if (!updatedTenant) {
      console.log('DEBUG: Tenant not found after update');
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    console.log('DEBUG: Tenant updated successfully:', updatedTenant);

    logger.info('Tenant updated successfully', {
      userId: session.user.id,
      tenantUuid: uuid,
      updatedFields: Object.keys(validatedData),
    });

    return NextResponse.json({ tenant: updatedTenant });
  } catch (error) {
    console.log('DEBUG: Error in tenants PUT route:', error);
    logger.error('Failed to update tenant', { 
      error: error instanceof Error ? error.message : 'Unknown error',
      uuid: (await params).uuid 
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * @openapi
 * /api/v1/admin/tenants/{uuid}:
 *   delete:
 *     summary: Delete tenant
 *     tags: [Tenants]
 *     parameters:
 *       - name: uuid
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Tenant deleted successfully
 *       403:
 *         description: Access denied
 *       404:
 *         description: Tenant not found
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const { uuid } = resolvedParams;

    // Check API access permission
    const userContext = extractUserContext(session);
    const hasAccess = canAccessAPI(userContext, '/api/v1/admin/tenants', 'DELETE');

    if (!hasAccess.allowed) {
      logger.warn('Tenant DELETE access denied', {
        userId: session.user.id,
        uuid,
        reason: hasAccess.reason,
      });
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const tenantsService = new TenantsService();
    
    // ✅ AUDIT LOGGING: Pass userId to service for audit tracking
    const success = await tenantsService.deleteTenantByUuid(uuid, session.user.id as string);

    if (!success) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    logger.info('Tenant deleted successfully', {
      userId: session.user.id,
      tenantUuid: uuid,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete tenant', { error, uuid: (await params).uuid });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 