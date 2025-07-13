import { PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';
import { IsBoolean, IsOptional, IsDateString, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {
  @ApiPropertyOptional({
    description: 'Whether the tenant is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Date and time when the tenant was suspended',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  @IsOptional()
  suspendedAt?: string;

  @ApiPropertyOptional({
    description: 'Date and time when the tenant expires',
    example: '2024-12-31T23:59:59Z',
  })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Reason for tenant suspension',
    example: 'Payment overdue',
  })
  @IsString()
  @IsOptional()
  suspensionReason?: string;
}