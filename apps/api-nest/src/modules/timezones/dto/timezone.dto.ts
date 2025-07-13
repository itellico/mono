import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class TimezoneDto {
  @ApiProperty({ example: 1, description: 'Unique timezone identifier' })
  id: number;

  @ApiProperty({ example: 'Europe/Vienna', description: 'IANA timezone name' })
  name: string;

  @ApiProperty({ example: '(UTC+01:00) Vienna', description: 'Human readable label' })
  label: string;

  @ApiProperty({ 
    example: 'Europe', 
    description: 'Continental region',
    required: false 
  })
  region?: string;

  @ApiProperty({ 
    example: 'Vienna', 
    description: 'Primary city',
    required: false 
  })
  city?: string;

  @ApiProperty({ example: 60, description: 'UTC offset in minutes' })
  utc_offset: number;

  @ApiProperty({ 
    example: 60, 
    description: 'DST offset in minutes',
    required: false 
  })
  dst_offset?: number;

  @ApiProperty({ example: true, description: 'Whether this timezone observes DST' })
  has_dst: boolean;

  @ApiProperty({ 
    example: 'CET', 
    description: 'Current timezone abbreviation',
    required: false 
  })
  abbreviation?: string;

  @ApiProperty({ example: true, description: 'Whether the timezone is active' })
  is_active: boolean;

  @ApiProperty({ example: 0, description: 'Display order for sorting' })
  display_order: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update timestamp' })
  updated_at: Date;
}

export class TimezoneQueryDto {
  @ApiProperty({ 
    example: 1, 
    description: 'Page number for pagination',
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiProperty({ 
    example: 20, 
    description: 'Number of items per page',
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiProperty({ 
    example: 'Vienna', 
    description: 'Search term for timezone names',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    example: 'Europe', 
    description: 'Filter by region',
    required: false 
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ 
    example: 60, 
    description: 'Filter by UTC offset in minutes',
    required: false 
  })
  @IsOptional()
  @IsInt()
  utc_offset?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Filter by DST support',
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  has_dst?: boolean;

  @ApiProperty({ 
    example: true, 
    description: 'Filter by active status',
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

export class TimezonesResponseDto {
  @ApiProperty({ type: [TimezoneDto], description: 'List of timezones' })
  data: TimezoneDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 20,
      total: 400,
      totalPages: 20
    },
    description: 'Pagination information'
  })
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}