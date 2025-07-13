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
import { AccountContext } from '@common/decorators/account.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { UsersService } from '../services/users.service';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { InviteUserDto } from '../dto/invite-user.dto';
import { UpdatePermissionsDto } from '../dto/update-permissions.dto';
import { BulkUpdatePermissionsDto } from '../dto/bulk-update-permissions.dto';
import { AuthenticatedUser } from '@common/types/auth.types';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Account - Team')
@Controller('account/users')
@Auth()
@Tier(UserTier.ACCOUNT)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // User Management
  @Get('management')
  @Permission('account.users.view')
  @ApiOperation({ summary: 'Get all account users with pagination and filtering' })
  async getAccountUsers(
    @AccountContext() accountId: string,
    @Query() query: { page?: number; limit?: number; search?: string },
  ) {
    return this.usersService.getAccountUsers(accountId, query);
  }

  @Get('management/:userId')
  @Permission('account.users.view')
  @ApiOperation({ summary: 'Get account user by ID' })
  @ApiParam({ 
    name: 'userId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async getAccountUser(
    @AccountContext() accountId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.getAccountUser(accountId, userId);
  }

  @Post('management')
  @Permission('account.users.create')
  @ApiOperation({ summary: 'Create new account user' })
  async createAccountUser(
    @AccountContext() accountId: string,
    @User() user: AuthenticatedUser,
    @Body() createUserDto: CreateUserDto,
  ) {
    return this.usersService.createAccountUser(accountId, user.id, createUserDto);
  }

  @Put('management/:userId')
  @Permission('account.users.update')
  @ApiOperation({ summary: 'Update account user' })
  @ApiParam({ 
    name: 'userId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async updateAccountUser(
    @AccountContext() accountId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.updateAccountUser(accountId, userId, updateUserDto);
  }

  @Delete('management/:userId')
  @Permission('account.users.delete')
  @ApiOperation({ summary: 'Remove account user' })
  @ApiParam({ 
    name: 'userId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async removeAccountUser(
    @AccountContext() accountId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.usersService.removeAccountUser(accountId, userId);
  }

  // Invitations
  @Get('invitations')
  @Permission('account.invitations.view')
  @ApiOperation({ summary: 'Get all invitations with filtering' })
  async getInvitations(
    @AccountContext() accountId: string,
    @Query() query: { status?: 'pending' | 'accepted' | 'expired' },
  ) {
    return this.usersService.getInvitations(accountId, query);
  }

  @Post('invitations')
  @Permission('account.invitations.create')
  @ApiOperation({ summary: 'Create new invitation' })
  async createInvitation(
    @AccountContext() accountId: string,
    @User() user: AuthenticatedUser,
    @Body() inviteUserDto: InviteUserDto,
  ) {
    return this.usersService.createInvitation(accountId, user.id, inviteUserDto);
  }

  @Delete('invitations/:invitationId')
  @Permission('account.invitations.delete')
  @ApiOperation({ summary: 'Cancel invitation' })
  @ApiParam({ 
    name: 'invitationId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async cancelInvitation(
    @AccountContext() accountId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.usersService.cancelInvitation(accountId, invitationId);
  }

  @Post('invitations/:invitationId/resend')
  @Permission('account.invitations.create')
  @ApiOperation({ summary: 'Resend invitation' })
  @ApiParam({ 
    name: 'invitationId', 
    type: String, 
    format: 'uuid',
    description: 'PostgreSQL UUID identifier. Validated server-side as proper UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  async resendInvitation(
    @AccountContext() accountId: string,
    @Param('invitationId', ParseUUIDPipe) invitationId: string,
  ) {
    return this.usersService.resendInvitation(accountId, invitationId);
  }

  // Permissions
  @Get('permissions')
  @ApiOperation({ summary: 'Get user permissions' })
  @Permission('account.permissions.view')
  async getUserPermissions(
    @AccountContext() accountId: string,
    @Query('userId', ParseUUIDPipe) user_id: string,
  ) {
    return this.usersService.getUserPermissions(accountId, user_id);
  }

  @Put('permissions')
  @ApiOperation({ summary: 'Update user permissions' })
  @Permission('account.permissions.update')
  async updateUserPermissions(
    @AccountContext() accountId: string,
    @Body() updatePermissionsDto: UpdatePermissionsDto,
  ) {
    return this.usersService.updateUserPermissions(accountId, updatePermissionsDto);
  }

  @Post('permissions/bulk')
  @ApiOperation({ summary: 'Bulk update permissions for multiple users' })
  @Permission('account.permissions.update')
  async bulkUpdatePermissions(
    @AccountContext() accountId: string,
    @Body() bulkUpdate: BulkUpdatePermissionsDto,
  ) {
    return this.usersService.bulkUpdatePermissions(accountId, bulkUpdate);
  }
}