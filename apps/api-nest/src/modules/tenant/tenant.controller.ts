import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TenantService } from './tenant.service';
import { Auth } from '@common/decorators/auth.decorator';
import { TenantId } from '@common/decorators/tenant.decorator';
import { CurrentUser } from '@common/decorators/user.decorator';
import { UserTier } from '@common/types/tier.types';

@ApiTags('Tenant - Core')
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Auth({ tier: UserTier.TENANT, permissions: ['tenant.accounts.read'] })
  @Get('accounts')
  getAccounts(@TenantId() tenant_id: string, @Query() query: any) {
    return this.tenantService.getAccounts(tenant_id, query);
  }

  @Auth({ tier: UserTier.TENANT, permissions: ['tenant.accounts.create'] })
  @Post('accounts')
  createAccount(@TenantId() tenant_id: string, @Body() accountData: any) {
    return this.tenantService.createAccount(tenant_id, accountData);
  }

  @Auth({ tier: UserTier.TENANT, permissions: ['tenant.users.read'] })
  @Get('users')
  getUsers(@TenantId() tenant_id: string, @Query() query: any) {
    return this.tenantService.getUsers(tenant_id, query);
  }


  @Auth({ tier: UserTier.TENANT, permissions: ['tenant.analytics.read'] })
  @Get('analytics')
  getAnalytics(@TenantId() tenant_id: string) {
    return this.tenantService.getAnalytics(tenant_id);
  }
}