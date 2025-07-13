import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class CountryDto {
  @ApiProperty({ example: 1, description: 'Unique country identifier' })
  id: number;

  @ApiProperty({ example: 'US', description: 'ISO 3166-1 alpha-2 country code' })
  code: string;

  @ApiProperty({ example: 'USA', description: 'ISO 3166-1 alpha-3 country code' })
  alpha3: string;

  @ApiProperty({ example: 'United States', description: 'Country name in English' })
  name: string;

  @ApiProperty({ 
    example: 'United States', 
    description: 'Country name in native language',
    required: false 
  })
  native_name?: string;

  @ApiProperty({ 
    example: '+1', 
    description: 'International dialing code',
    required: false 
  })
  phone_code?: string;

  @ApiProperty({ 
    example: '🇺🇸', 
    description: 'Unicode flag emoji',
    required: false 
  })
  flag_emoji?: string;

  @ApiProperty({ 
    example: 'Americas', 
    description: 'Continental region',
    required: false 
  })
  region?: string;

  @ApiProperty({ 
    example: 'Northern America', 
    description: 'Sub-continental region',
    required: false 
  })
  subregion?: string;

  @ApiProperty({ example: true, description: 'Whether the country is active' })
  is_active: boolean;

  @ApiProperty({ example: 0, description: 'Display order for sorting' })
  display_order: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update timestamp' })
  updated_at: Date;
}

export class CountryQueryDto {
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
    example: 'United', 
    description: 'Search term for country names',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    example: 'Americas', 
    description: 'Filter by region',
    required: false 
  })
  @IsOptional()
  @IsString()
  region?: string;

  @ApiProperty({ 
    example: true, 
    description: 'Filter by active status',
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

export class CountriesResponseDto {
  @ApiProperty({ type: [CountryDto], description: 'List of countries' })
  data: CountryDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 20,
      total: 195,
      totalPages: 10
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