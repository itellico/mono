import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsInt, Min, IsIn } from 'class-validator';

export class CurrencyDto {
  @ApiProperty({ example: 1, description: 'Unique currency identifier' })
  id: number;

  @ApiProperty({ example: 'USD', description: 'ISO 4217 currency code' })
  code: string;

  @ApiProperty({ 
    example: '840', 
    description: 'ISO 4217 numeric currency code',
    required: false 
  })
  numeric_code?: string;

  @ApiProperty({ example: 'US Dollar', description: 'Currency name' })
  name: string;

  @ApiProperty({ 
    example: '$', 
    description: 'Currency symbol',
    required: false 
  })
  symbol?: string;

  @ApiProperty({ 
    example: 'before', 
    description: 'Symbol position relative to amount',
    enum: ['before', 'after']
  })
  symbol_position: string;

  @ApiProperty({ example: 2, description: 'Number of decimal places' })
  decimal_places: number;

  @ApiProperty({ example: '.', description: 'Decimal separator character' })
  decimal_separator: string;

  @ApiProperty({ example: ',', description: 'Thousands separator character' })
  thousands_separator: string;

  @ApiProperty({ example: true, description: 'Whether the currency is active' })
  is_active: boolean;

  @ApiProperty({ example: 0, description: 'Display order for sorting' })
  display_order: number;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Creation timestamp' })
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00Z', description: 'Last update timestamp' })
  updated_at: Date;
}

export class CurrencyQueryDto {
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
    example: 'Dollar', 
    description: 'Search term for currency names or codes',
    required: false 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ 
    example: 'before', 
    description: 'Filter by symbol position',
    required: false,
    enum: ['before', 'after']
  })
  @IsOptional()
  @IsIn(['before', 'after'])
  symbol_position?: string;

  @ApiProperty({ 
    example: 2, 
    description: 'Filter by decimal places',
    required: false 
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  decimal_places?: number;

  @ApiProperty({ 
    example: true, 
    description: 'Filter by active status',
    required: false 
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean = true;
}

export class CurrenciesResponseDto {
  @ApiProperty({ type: [CurrencyDto], description: 'List of currencies' })
  data: CurrencyDto[];

  @ApiProperty({
    example: {
      page: 1,
      limit: 20,
      total: 40,
      totalPages: 2
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

export class CurrencyFormatDto {
  @ApiProperty({ example: 1234.56, description: 'Amount to format' })
  amount: number;

  @ApiProperty({ example: 'USD', description: 'Currency code' })
  currency_code: string;

  @ApiProperty({ example: '$1,234.56', description: 'Formatted amount' })
  formatted: string;

  @ApiProperty({ example: '$', description: 'Currency symbol used' })
  symbol: string;

  @ApiProperty({ example: 'before', description: 'Symbol position used' })
  symbol_position: string;
}