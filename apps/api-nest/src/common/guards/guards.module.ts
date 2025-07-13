import { Module, Global } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionGuard } from './permission.guard';
import { EnhancedPermissionGuard } from './enhanced-permission.guard';
import { TierGuard } from './tier.guard';
import { TenantContextGuard } from './tenant-context.guard';
import { AccountContextGuard } from './account-context.guard';
import { RoleGuard } from './role.guard';
import { LocalAuthGuard } from './local-auth.guard';
import { PermissionsModule } from '@modules/permissions/permissions.module';
import { MetricsModule } from '../metrics/metrics.module';

/**
 * Guards Module - Centralizes all guard configuration
 * Following NestJS best practices for modular architecture
 */
@Global()
@Module({
  imports: [
    PermissionsModule,
    MetricsModule,
  ],
  providers: [
    // Authentication Guards
    JwtAuthGuard,
    LocalAuthGuard,
    
    // Authorization Guards
    PermissionGuard,
    EnhancedPermissionGuard,
    RoleGuard,
    TierGuard,
    
    // Context Guards
    TenantContextGuard,
    AccountContextGuard,
    
    // Global JWT Authentication (commented out - enable when ready)
    // {
    //   provide: APP_GUARD,
    //   useClass: JwtAuthGuard,
    // },
  ],
  exports: [
    JwtAuthGuard,
    LocalAuthGuard,
    PermissionGuard,
    EnhancedPermissionGuard,
    RoleGuard,
    TierGuard,
    TenantContextGuard,
    AccountContextGuard,
  ],
})
export class GuardsModule {}