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
import { PlatformUsersService } from '../services/users.service';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { AuthenticatedUser } from '@common/types/auth.types';

@ApiTags('Platform - Management')
@ApiBearerAuth('JWT-auth')
@Controller('platform/admin/users')
@Auth()
@Tier(UserTier.PLATFORM)
export class PlatformUsersController {
  constructor(private readonly usersService: PlatformUsersService) {}

  @Get()
  @Permission('platform.users.view')
  @ApiOperation({ summary: 'Get all platform users with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  @ApiQuery({ name: 'userType', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Returns paginated list of platform users' })
  async getUsers(
    @Query() query: { 
      page?: number; 
      limit?: number; 
      search?: string;
      active?: boolean;
      userType?: string;
    },
  ) {
    return this.usersService.getUsers(query);
  }

  @Get(':uuid')
  @Permission('platform.users.view')
  @ApiOperation({ summary: 'Get platform user by UUID' })
  @ApiParam({ 
    name: 'uuid', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Returns platform user details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserByUuid(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.usersService.getUserByUuid(uuid);
  }

  @Get(':uuid/extended')
  @Permission('platform.users.view')
  @ApiOperation({ summary: 'Get platform user with extended details (includes account, tenant, sessions)' })
  @ApiParam({ 
    name: 'uuid', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Returns platform user with extended details' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUserExtendedByUuid(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.usersService.getUserExtendedByUuid(uuid);
  }

  @Post()
  @Permission('platform.users.create')
  @ApiOperation({ summary: 'Create a new platform user' })
  @ApiResponse({ status: 201, description: 'Platform user created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createUser(
    @User() user: AuthenticatedUser,
    @Body() createUserDto: {
      firstName: string;
      lastName: string;
      email: string;
      userType?: string;
      tenantId?: string;
      isActive?: boolean;
    },
  ) {
    return this.usersService.createUser(user.id, createUserDto);
  }

  @Put(':uuid')
  @Permission('platform.users.update')
  @ApiOperation({ summary: 'Update platform user details' })
  @ApiParam({ 
    name: 'uuid', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Platform user updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateUser(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() updateUserDto: {
      firstName?: string;
      lastName?: string;
      userType?: string;
      isActive?: boolean;
      tenantId?: string;
    },
  ) {
    return this.usersService.updateUser(uuid, updateUserDto);
  }

  @Delete(':uuid')
  @Permission('platform.users.delete')
  @ApiOperation({ summary: 'Delete a platform user' })
  @ApiParam({ 
    name: 'uuid', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Platform user deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async deleteUser(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.usersService.deleteUser(uuid);
  }

  // User Status Management
  @Post(':uuid/activate')
  @Permission('platform.users.activate')
  @ApiOperation({ summary: 'Activate a platform user' })
  @ApiParam({ 
    name: 'uuid', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async activateUser(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.usersService.activateUser(uuid);
  }

  @Post(':uuid/deactivate')
  @Permission('platform.users.deactivate')
  @ApiOperation({ summary: 'Deactivate a platform user' })
  @ApiParam({ 
    name: 'uuid', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async deactivateUser(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Body() data: { reason?: string },
  ) {
    return this.usersService.deactivateUser(uuid, data);
  }

  // User Statistics
  @Get(':uuid/stats')
  @Permission('platform.users.view')
  @ApiOperation({ summary: 'Get platform user statistics' })
  @ApiParam({ 
    name: 'uuid', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getUserStats(@Param('uuid', ParseUUIDPipe) uuid: string) {
    return this.usersService.getUserStats(uuid);
  }

  @Get(':uuid/activity')
  @Permission('platform.users.view')
  @ApiOperation({ summary: 'Get platform user activity log' })
  @ApiParam({ 
    name: 'uuid', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getUserActivity(
    @Param('uuid', ParseUUIDPipe) uuid: string,
    @Query() query: { 
      page?: number;
      limit?: number;
      startDate?: string;
      endDate?: string;
    },
  ) {
    return this.usersService.getUserActivity(uuid, query);
  }
}
