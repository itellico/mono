import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { 
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { User } from '@common/decorators/user.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { TenantsService } from '../services/tenants.service';
import { CreateTenantDto } from '../dto/create-tenant.dto';
import { UpdateTenantDto } from '../dto/update-tenant.dto';
import { AuthenticatedUser } from '@common/types/auth.types';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Platform - Management')
@ApiBearerAuth('JWT-auth')
@Controller('platform/system/tenants')
@Auth()
@Tier(UserTier.PLATFORM)
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @Permission('platform.tenants.view')
  @ApiOperation({ summary: 'Get all tenants with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['active', 'suspended', 'trial', 'expired'] 
  })
  @ApiQuery({ name: 'plan', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns paginated list of tenants' })
  async getTenants(
    @Query() query: { 
      page?: number; 
      limit?: number; 
      search?: string;
      status?: 'active' | 'suspended' | 'trial' | 'expired';
      plan?: string;
    },
  ) {
    return this.tenantsService.getTenants(query);
  }

  @Get(':tenantId')
  @Permission('platform.tenants.view')
  @ApiOperation({ summary: 'Get tenant by ID' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier (e.g. 123e4567-e89b-12d3-a456-426614174000). Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Returns tenant details' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async getTenant(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.getTenant(tenantId);
  }

  @Post()
  @Permission('platform.tenants.create')
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createTenant(
    @User() user: AuthenticatedUser,
    @Body() createTenantDto: CreateTenantDto,
  ) {
    return this.tenantsService.createTenant(user.id, createTenantDto);
  }

  @Put(':tenantId')
  @Permission('platform.tenants.update')
  @ApiOperation({ summary: 'Update tenant details' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Tenant updated successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async updateTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ) {
    return this.tenantsService.updateTenant(tenantId, updateTenantDto);
  }

  @Delete(':tenantId')
  @Permission('platform.tenants.delete')
  @ApiOperation({ summary: 'Delete a tenant' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Tenant deleted successfully' })
  @ApiResponse({ status: 404, description: 'Tenant not found' })
  async deleteTenant(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.deleteTenant(tenantId);
  }

  // Tenant Status Management
  @Post(':tenantId/suspend')
  @Permission('platform.tenants.suspend')
  @ApiOperation({ summary: 'Suspend a tenant' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async suspendTenant(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() data: { reason: string; notifyUsers?: boolean },
  ) {
    return this.tenantsService.suspendTenant(tenantId, data);
  }

  @Post(':tenantId/activate')
  @Permission('platform.tenants.activate')
  @ApiOperation({ summary: 'Activate a tenant' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async activateTenant(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.activateTenant(tenantId);
  }

  // Tenant Statistics
  @Get(':tenantId/stats')
  @Permission('platform.tenants.view')
  @ApiOperation({ summary: 'Get tenant statistics' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getTenantStats(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.getTenantStats(tenantId);
  }

  @Get(':tenantId/usage')
  @Permission('platform.tenants.view')
  @ApiOperation({ summary: 'Get tenant usage metrics' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getTenantUsage(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: { 
      metric?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.tenantsService.getTenantUsage(tenantId, query);
  }

  // Tenant Plan Management
  @Get(':tenantId/subscription')
  @Permission('platform.tenants.view')
  @ApiOperation({ summary: 'Get tenant subscription details' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getTenantSubscription(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.getTenantSubscription(tenantId);
  }

  @Put(':tenantId/subscription')
  @Permission('platform.tenants.manage-subscription')
  @ApiOperation({ summary: 'Update tenant subscription' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async updateTenantSubscription(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() data: { 
      planId: string;
      expiresAt?: string;
      customLimits?: Record<string, number>;
    },
  ) {
    return this.tenantsService.updateTenantSubscription(tenantId, data);
  }

  // Tenant Features
  @Get(':tenantId/features')
  @Permission('platform.tenants.view')
  @ApiOperation({ summary: 'Get tenant features' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getTenantFeatures(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.getTenantFeatures(tenantId);
  }

  @Post(':tenantId/features/:featureId/enable')
  @Permission('platform.tenants.manage-features')
  @ApiOperation({ summary: 'Enable tenant feature' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiParam({ name: 'featureId', type: String, description: 'Feature identifier' })
  async enableFeature(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('featureId') featureId: string,
  ) {
    return this.tenantsService.enableFeature(tenantId, featureId);
  }

  @Post(':tenantId/features/:featureId/disable')
  @Permission('platform.tenants.manage-features')
  @ApiOperation({ summary: 'Disable tenant feature' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiParam({ name: 'featureId', type: String, description: 'Feature identifier' })
  async disableFeature(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Param('featureId') featureId: string,
  ) {
    return this.tenantsService.disableFeature(tenantId, featureId);
  }

  // Tenant Settings
  @Get(':tenantId/settings')
  @Permission('platform.tenants.view')
  @ApiOperation({ summary: 'Get tenant settings' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getTenantSettings(@Param('tenantId', ParseUUIDPipe) tenantId: string) {
    return this.tenantsService.getTenantSettings(tenantId);
  }

  @Put(':tenantId/settings')
  @Permission('platform.tenants.update')
  @ApiOperation({ summary: 'Update tenant settings' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async updateTenantSettings(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() settings: Record<string, any>,
  ) {
    return this.tenantsService.updateTenantSettings(tenantId, settings);
  }

  // Tenant Backup & Export
  @Post(':tenantId/backup')
  @Permission('platform.tenants.backup')
  @ApiOperation({ summary: 'Create tenant backup' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async createTenantBackup(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() data: { includeMedia?: boolean; compress?: boolean },
  ) {
    return this.tenantsService.createTenantBackup(tenantId, data);
  }

  @Get(':tenantId/export')
  @Permission('platform.tenants.export')
  @ApiOperation({ summary: 'Export tenant data' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async exportTenantData(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Query() query: { format?: 'json' | 'csv' | 'sql' },
  ) {
    return this.tenantsService.exportTenantData(tenantId, query);
  }

  // Tenant Clone
  @Post(':tenantId/clone')
  @Permission('platform.tenants.create')
  @ApiOperation({ summary: 'Clone tenant' })
  @ApiParam({ 
    name: 'tenantId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async cloneTenant(
    @User() user: AuthenticatedUser,
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() data: { 
      name: string;
      subdomain: string;
      cloneData?: boolean;
      cloneUsers?: boolean;
      cloneSettings?: boolean;
    },
  ) {
    return this.tenantsService.cloneTenant(tenantId, user.id, data);
  }
}