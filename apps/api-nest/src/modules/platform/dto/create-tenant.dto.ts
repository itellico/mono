import { IsString, IsNotEmpty, IsOptional, IsEmail, IsEnum, IsObject, Matches, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TenantStatus {
  ACTIVE = 'active',
  TRIAL = 'trial',
  SUSPENDED = 'suspended',
  EXPIRED = 'expired',
}

export enum TenantType {
  STANDARD = 'standard',
  ENTERPRISE = 'enterprise',
  PARTNER = 'partner',
  INTERNAL = 'internal',
}

export class CreateTenantDto {
  @ApiProperty({ 
    description: 'Tenant name',
    example: 'Acme Corporation',
    minLength: 3,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({ 
    description: 'Subdomain for tenant access',
    example: 'acme',
    pattern: '^[a-z0-9-]+$',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Subdomain must contain only lowercase letters, numbers, and hyphens',
  })
  subdomain: string;

  @ApiProperty({ 
    description: 'Email address of the tenant administrator',
    example: 'admin@acme.com',
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({ 
    description: 'Full name of the tenant administrator',
    example: 'John Doe',
  })
  @IsString()
  @IsNotEmpty()
  adminName: string;

  @ApiPropertyOptional({ 
    description: 'Tenant description',
    example: 'Leading provider of innovative solutions',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ 
    description: 'Type of tenant',
    enum: TenantType,
    default: TenantType.STANDARD,
  })
  @IsEnum(TenantType)
  @IsOptional()
  type?: TenantType = TenantType.STANDARD;

  @ApiPropertyOptional({ 
    description: 'Initial status of the tenant',
    enum: TenantStatus,
    default: TenantStatus.TRIAL,
  })
  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus = TenantStatus.TRIAL;

  @ApiPropertyOptional({ 
    description: 'Subscription plan ID',
    example: 'plan_enterprise_annual',
  })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiPropertyOptional({ 
    description: 'Tenant-specific settings',
    example: {
      timezone: 'America/New_York',
      language: 'en',
      currency: 'USD',
      dateFormat: 'MM/DD/YYYY',
    },
  })
  @IsObject()
  @IsOptional()
  settings?: {
    timezone?: string;
    language?: string;
    currency?: string;
    dateFormat?: string;
  };

  @ApiPropertyOptional({ 
    description: 'Resource limits for the tenant',
    example: {
      users: 100,
      storage: 10240,
      apiCalls: 1000000,
      customFields: 50,
    },
  })
  @IsObject()
  @IsOptional()
  limits?: {
    users?: number;
    storage?: number;
    apiCalls?: number;
    customFields?: number;
  };

  @ApiPropertyOptional({ 
    description: 'Additional metadata',
    example: { industry: 'Technology', size: 'Enterprise' },
  })
  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}