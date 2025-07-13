import { Controller, Get, Param, Query, ParseIntPipe, ParseFloatPipe } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { CurrencyDto, CurrencyQueryDto, CurrenciesResponseDto, CurrencyFormatDto } from './dto/currency.dto';

@Controller('public/currencies')
@ApiTags('Currencies')
@ApiBearerAuth('JWT-auth')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @Auth()
  @Permission('public.currencies.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'List all currencies with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'symbol_position', required: false, enum: ['before', 'after'], description: 'Symbol position' })
  @ApiQuery({ name: 'decimal_places', required: false, type: Number, description: 'Number of decimal places' })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiOkResponse({ 
    description: 'Currencies retrieved successfully',
    type: CurrenciesResponseDto
  })
  async findAll(@Query() query: CurrencyQueryDto): Promise<CurrenciesResponseDto> {
    return this.currenciesService.findAll(query);
  }

  @Get(':id')
  @Auth()
  @Permission('public.currencies.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get currency by ID' })
  @ApiParam({ name: 'id', type: 'integer', description: 'Currency ID' })
  @ApiOkResponse({ 
    description: 'Currency retrieved successfully',
    type: CurrencyDto
  })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CurrencyDto> {
    return this.currenciesService.findOne(id);
  }

  @Get('code/:code')
  @Auth()
  @Permission('public.currencies.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get currency by ISO code' })
  @ApiParam({ 
    name: 'code', 
    type: 'string', 
    description: 'ISO 4217 currency code (e.g., USD, EUR)',
    example: 'USD'
  })
  @ApiOkResponse({ 
    description: 'Currency retrieved successfully',
    type: CurrencyDto
  })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async findByCode(@Param('code') code: string): Promise<CurrencyDto> {
    return this.currenciesService.findByCode(code.toUpperCase());
  }

  @Get('format/:code/:amount')
  @Auth()
  @Permission('public.currencies.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Format amount with currency formatting rules' })
  @ApiParam({ 
    name: 'code', 
    type: 'string', 
    description: 'ISO 4217 currency code',
    example: 'USD'
  })
  @ApiParam({ 
    name: 'amount', 
    type: 'number', 
    description: 'Amount to format',
    example: 1234.56
  })
  @ApiOkResponse({ 
    description: 'Amount formatted successfully',
    type: CurrencyFormatDto
  })
  @ApiNotFoundResponse({ description: 'Currency not found' })
  async formatAmount(
    @Param('code') code: string,
    @Param('amount', ParseFloatPipe) amount: number
  ): Promise<CurrencyFormatDto> {
    return this.currenciesService.formatAmount(code.toUpperCase(), amount);
  }

  @Get('popular/list')
  @Auth()
  @Permission('public.currencies.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of popular currencies (commonly used)' })
  @ApiOkResponse({ 
    description: 'Popular currencies retrieved successfully',
    type: [CurrencyDto]
  })
  async getPopularCurrencies(): Promise<CurrencyDto[]> {
    return this.currenciesService.getPopularCurrencies();
  }

  @Get('crypto/list')
  @Auth()
  @Permission('public.currencies.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of supported cryptocurrencies' })
  @ApiOkResponse({ 
    description: 'Cryptocurrencies retrieved successfully',
    type: [CurrencyDto]
  })
  async getCryptocurrencies(): Promise<CurrencyDto[]> {
    return this.currenciesService.getCryptocurrencies();
  }

  @Get('symbols/list')
  @Auth()
  @Permission('public.currencies.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of currency symbols with their codes' })
  @ApiOkResponse({ 
    description: 'Currency symbols retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'USD' },
              symbol: { type: 'string', example: '$' },
              name: { type: 'string', example: 'US Dollar' }
            }
          }
        }
      }
    }
  })
  async getCurrencySymbols(): Promise<{ success: boolean; data: Array<{ code: string; symbol: string; name: string }> }> {
    const symbols = await this.currenciesService.getCurrencySymbols();
    return { success: true, data: symbols };
  }

  @Get('zero-decimal/list')
  @Auth()
  @Permission('public.currencies.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of zero-decimal currencies (no fractional units)' })
  @ApiOkResponse({ 
    description: 'Zero-decimal currencies retrieved successfully',
    type: [CurrencyDto]
  })
  async getZeroDecimalCurrencies(): Promise<CurrencyDto[]> {
    return this.currenciesService.getZeroDecimalCurrencies();
  }
}