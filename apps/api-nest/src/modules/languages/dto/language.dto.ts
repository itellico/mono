import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, IsIn } from 'class-validator';

export class LanguageDto {
  @ApiProperty({ example: 1, description: 'Unique language identifier' })
  id: number;

  @ApiProperty({ example: 'en', description: 'Language code (ISO 639-1 or locale)' })
  code: string;

  @ApiProperty({ 
    example: 'en', 
    description: 'ISO 639-1 two-letter language code',
    required: false 
  })
  iso639_1?: string;

  @ApiProperty({ 
    example: 'eng', 
    description: 'ISO 639-2 three-letter language code',
    required: false 
  })
  iso639_2?: string;

  @ApiProperty({ example: 'English', description: 'Language name in English' })
  name: string;

  @ApiProperty({ 
    example: 'English', 
    description: 'Language name in native script',
    required: false 
  })
  native_name?: string;

  @ApiProperty({ 
    example: 'ltr', 
    description: 'Text direction (ltr or rtl)',
    enum: ['ltr', 'rtl']
  })
  direction: string;

  @ApiProperty({ 
    example: 'Germanic', 
    description: 'Language family',
    required: false 
  })
  family?: string;

  @ApiProperty({ 
    example: 1500000000, 
    description: 'Number of native speakers',
    required: false 
  })
  speakers?: number;

  @ApiProperty({ example: true, description: 'Whether the language is active' })
  is_active: boolean;

  @ApiProperty({ example: 0, description: 'Display order for sorting' })
  display_order: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update timestamp' })
  updated_at: Date;
}

export class LanguageQueryDto {
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
    example: 'English', 
    description: 'Search term for language names',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    example: 'ltr', 
    description: 'Filter by text direction',
    required: false,
    enum: ['ltr', 'rtl']
  })
  @IsOptional()
  @IsIn(['ltr', 'rtl'])
  direction?: string;

  @ApiProperty({ 
    example: 'Germanic', 
    description: 'Filter by language family',
    required: false 
  })
  @IsOptional()
  @IsString()
  family?: string;

  @ApiProperty({ 
    example: true, 
    description: 'Filter by active status',
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

export class LanguagesResponseDto {
  @ApiProperty({ type: [LanguageDto], description: 'List of languages' })
  data: LanguageDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 20,
      total: 45,
      totalPages: 3
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