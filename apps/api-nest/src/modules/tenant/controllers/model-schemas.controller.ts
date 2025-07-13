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
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { User } from '@common/decorators/user.decorator';
import { TenantContext } from '@common/decorators/tenant.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { ModelSchemasService } from '../services/model-schemas.service';
import { CreateModelSchemaDto } from '../dto/create-model-schema.dto';
import { UpdateModelSchemaDto } from '../dto/update-model-schema.dto';
import { BulkOperationDto } from '../dto/bulk-operation.dto';
import { AuthenticatedUser } from '@common/types/auth.types';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Configuration')
@Controller('tenant/model-schemas')
@Auth()
@Tier(UserTier.TENANT)
export class ModelSchemasController {
  constructor(private readonly modelSchemasService: ModelSchemasService) {}

  @Get()
  @Permission('tenant.schemas.view')
  @ApiOperation({ summary: 'Get all model schemas with pagination and filtering' })
  async getModelSchemas(
    @TenantContext() tenantId: string,
    @Query() query: { 
      page?: number; 
      limit?: number; 
      search?: string;
      type?: string;
      status?: string;
    },
  ) {
    return this.modelSchemasService.getModelSchemas(tenantId, query);
  }

  @Get(':schemaId')
  @Permission('tenant.schemas.view')
  @ApiOperation({ summary: 'Get model schema by ID' })
  @ApiParam({ 
    name: 'schemaId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getModelSchema(
    @TenantContext() tenantId: string,
    @Param('schemaId', ParseUUIDPipe) schemaId: string,
  ) {
    return this.modelSchemasService.getModelSchema(tenantId, schemaId);
  }

  @Post()
  @Permission('tenant.schemas.create')
  @ApiOperation({ summary: 'Create a new model schema' })
  async createModelSchema(
    @TenantContext() tenantId: string,
    @User() user: AuthenticatedUser,
    @Body() createModelSchemaDto: CreateModelSchemaDto,
  ) {
    return this.modelSchemasService.createModelSchema(
      tenantId, 
      user.id, 
      createModelSchemaDto
    );
  }

  @Put(':schemaId')
  @Permission('tenant.schemas.update')
  @ApiOperation({ summary: 'Update model schema' })
  @ApiParam({ 
    name: 'schemaId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async updateModelSchema(
    @TenantContext() tenantId: string,
    @User() user: AuthenticatedUser,
    @Param('schemaId', ParseUUIDPipe) schemaId: string,
    @Body() updateModelSchemaDto: UpdateModelSchemaDto,
  ) {
    return this.modelSchemasService.updateModelSchema(
      tenantId, 
      schemaId,
      user.id,
      updateModelSchemaDto
    );
  }

  @Delete(':schemaId')
  @Permission('tenant.schemas.delete')
  @ApiOperation({ summary: 'Delete model schema' })
  @ApiParam({ 
    name: 'schemaId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async deleteModelSchema(
    @TenantContext() tenantId: string,
    @Param('schemaId', ParseUUIDPipe) schemaId: string,
  ) {
    return this.modelSchemasService.deleteModelSchema(tenantId, schemaId);
  }

  // Bulk Operations
  @Post('bulk/create')
  @Permission('tenant.schemas.create')
  async bulkCreateSchemas(
    @TenantContext() tenantId: string,
    @User() user: AuthenticatedUser,
    @Body() schemas: CreateModelSchemaDto[],
  ) {
    return this.modelSchemasService.bulkCreateSchemas(tenantId, user.id, schemas);
  }

  @Put('bulk/update')
  @Permission('tenant.schemas.update')
  async bulkUpdateSchemas(
    @TenantContext() tenantId: string,
    @User() user: AuthenticatedUser,
    @Body() updates: BulkOperationDto<UpdateModelSchemaDto>,
  ) {
    return this.modelSchemasService.bulkUpdateSchemas(tenantId, user.id, updates);
  }

  @Delete('bulk/delete')
  @Permission('tenant.schemas.delete')
  async bulkDeleteSchemas(
    @TenantContext() tenantId: string,
    @Body() ids: string[],
  ) {
    return this.modelSchemasService.bulkDeleteSchemas(tenantId, ids);
  }

  @Post('bulk/upsert')
  @Permission('tenant.schemas.create')
  async bulkUpsertSchemas(
    @TenantContext() tenantId: string,
    @User() user: AuthenticatedUser,
    @Body() schemas: CreateModelSchemaDto[],
  ) {
    return this.modelSchemasService.bulkUpsertSchemas(tenantId, user.id, schemas);
  }

  // Import/Export
  @Get('export')
  @Permission('tenant.schemas.export')
  async exportSchemas(
    @TenantContext() tenantId: string,
    @Query() query: { format?: 'json' | 'csv' | 'yaml'; ids?: string[] },
  ) {
    return this.modelSchemasService.exportSchemas(tenantId, query);
  }

  @Get('export/template')
  @Permission('tenant.schemas.view')
  async getImportTemplate(@TenantContext() tenantId: string) {
    return this.modelSchemasService.getImportTemplate(tenantId);
  }

  @Post('import/append')
  @Permission('tenant.schemas.import')
  async importAppend(
    @TenantContext() tenantId: string,
    @User() user: AuthenticatedUser,
    @Body() data: { schemas: any[]; format: 'json' | 'csv' | 'yaml' },
  ) {
    return this.modelSchemasService.importAppend(tenantId, user.id, data);
  }

  @Post('import/replace')
  @Permission('tenant.schemas.import')
  async importReplace(
    @TenantContext() tenantId: string,
    @User() user: AuthenticatedUser,
    @Body() data: { schemas: any[]; format: 'json' | 'csv' | 'yaml' },
  ) {
    return this.modelSchemasService.importReplace(tenantId, user.id, data);
  }

  // Schema Operations
  @Post(':schemaId/validate')
  @Permission('tenant.schemas.view')
  @ApiOperation({ summary: 'Validate data against schema' })
  @ApiParam({ 
    name: 'schemaId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async validateSchema(
    @TenantContext() tenantId: string,
    @Param('schemaId', ParseUUIDPipe) schemaId: string,
    @Body() data: any,
  ) {
    return this.modelSchemasService.validateAgainstSchema(tenantId, schemaId, data);
  }

  @Post(':schemaId/generate-sample')
  @Permission('tenant.schemas.view')
  @ApiOperation({ summary: 'Generate sample data for schema' })
  @ApiParam({ 
    name: 'schemaId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async generateSampleData(
    @TenantContext() tenantId: string,
    @Param('schemaId', ParseUUIDPipe) schemaId: string,
    @Query('count') count: number = 1,
  ) {
    return this.modelSchemasService.generateSampleData(tenantId, schemaId, count);
  }

  @Get(':schemaId/versions')
  @Permission('tenant.schemas.view')
  @ApiOperation({ summary: 'Get schema version history' })
  @ApiParam({ 
    name: 'schemaId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getSchemaVersions(
    @TenantContext() tenantId: string,
    @Param('schemaId', ParseUUIDPipe) schemaId: string,
  ) {
    return this.modelSchemasService.getSchemaVersions(tenantId, schemaId);
  }

  @Post(':schemaId/clone')
  @Permission('tenant.schemas.create')
  @ApiOperation({ summary: 'Clone model schema' })
  @ApiParam({ 
    name: 'schemaId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async cloneSchema(
    @TenantContext() tenantId: string,
    @User() user: AuthenticatedUser,
    @Param('schemaId', ParseUUIDPipe) schemaId: string,
    @Body() data: { name: string; description?: string },
  ) {
    return this.modelSchemasService.cloneSchema(tenantId, schemaId, user.id, data);
  }
}