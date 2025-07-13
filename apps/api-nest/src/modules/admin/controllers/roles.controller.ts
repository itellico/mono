import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { 
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Auth } from '@common/decorators/auth.decorator';
import { User } from '@common/decorators/user.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { AuthenticatedUser } from '@common/types/auth.types';
import { RolesService } from '../services/roles.service';

// DTOs
export class CreateRoleDto {
  name: string;
  description?: string;
  permissionIds: number[];
}

export class UpdateRoleDto {
  name?: string;
  description?: string;
  permissionIds?: number[];
}

export class RoleResponseDto {
  id: number;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    users: number;
    permissions: number;
  };
  permissions?: Array<{
    permission: {
      id: number;
      name: string;
      description: string | null;
      category: string;
    };
  }>;
}

export class RolesListResponseDto {
  success: boolean;
  data: RoleResponseDto[];
}

export class RoleDetailResponseDto {
  success: boolean;
  data: RoleResponseDto;
}

@ApiTags('Admin - Roles Management')
@ApiBearerAuth('JWT-auth')
@Controller('admin/roles')
@Auth()
@Tier(UserTier.PLATFORM)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @Permission('admin.roles.view')
  @ApiOperation({ summary: 'Get all roles with permissions' })
  @ApiQuery({ name: 'tenantId', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Roles retrieved successfully',
    type: RolesListResponseDto
  })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getRoles(
    @User() user: AuthenticatedUser,
    @Query('tenantId', new ParseIntPipe({ optional: true })) tenantId?: number,
  ): Promise<RolesListResponseDto> {
    try {
      const roles = await this.rolesService.getAllRoles(
        parseInt(user.id), 
        tenantId || null
      );

      return {
        success: true,
        data: roles,
      };
    } catch (error) {
      return {
        success: false,
        data: [],
      };
    }
  }

  @Get(':id')
  @Permission('admin.roles.view')
  @ApiOperation({ summary: 'Get role by ID' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiQuery({ name: 'tenantId', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Role retrieved successfully',
    type: RoleDetailResponseDto
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async getRole(
    @User() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('tenantId', new ParseIntPipe({ optional: true })) tenantId?: number,
  ): Promise<RoleDetailResponseDto> {
    try {
      const role = await this.rolesService.getRoleById(
        parseInt(user.id), 
        tenantId || null,
        id
      );

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post()
  @Permission('admin.roles.create')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiQuery({ name: 'tenantId', required: false, type: Number })
  @ApiBody({ type: CreateRoleDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Role created successfully',
    type: RoleDetailResponseDto
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async createRole(
    @User() user: AuthenticatedUser,
    @Body() createRoleDto: CreateRoleDto,
    @Query('tenantId', new ParseIntPipe({ optional: true })) tenantId?: number,
  ): Promise<RoleDetailResponseDto> {
    try {
      const role = await this.rolesService.createRole(
        parseInt(user.id),
        tenantId || null,
        createRoleDto
      );

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  @Permission('admin.roles.update')
  @ApiOperation({ summary: 'Update an existing role' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiQuery({ name: 'tenantId', required: false, type: Number })
  @ApiBody({ type: UpdateRoleDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Role updated successfully',
    type: RoleDetailResponseDto
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  async updateRole(
    @User() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRoleDto: UpdateRoleDto,
    @Query('tenantId', new ParseIntPipe({ optional: true })) tenantId?: number,
  ): Promise<RoleDetailResponseDto> {
    try {
      const role = await this.rolesService.updateRole(
        parseInt(user.id),
        tenantId || null,
        id,
        updateRoleDto
      );

      return {
        success: true,
        data: role,
      };
    } catch (error) {
      throw error;
    }
  }

  @Delete(':id')
  @Permission('admin.roles.delete')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiParam({ name: 'id', type: Number, description: 'Role ID' })
  @ApiQuery({ name: 'tenantId', required: false, type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Role deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Role deleted successfully' },
      },
    }
  })
  @ApiResponse({ status: 404, description: 'Role not found' })
  @ApiResponse({ status: 403, description: 'Insufficient permissions' })
  @ApiResponse({ status: 400, description: 'Cannot delete role with assigned users' })
  async deleteRole(
    @User() user: AuthenticatedUser,
    @Param('id', ParseIntPipe) id: number,
    @Query('tenantId', new ParseIntPipe({ optional: true })) tenantId?: number,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.rolesService.deleteRole(
        parseInt(user.id),
        tenantId || null,
        id
      );

      return {
        success: true,
        message: 'Role deleted successfully',
      };
    } catch (error) {
      throw error;
    }
  }
}