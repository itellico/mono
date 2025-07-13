import { Controller, Get, Param, Query, ParseIntPipe, UseGuards } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { CountriesService } from './countries.service';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { CountryDto, CountryQueryDto, CountriesResponseDto } from './dto/country.dto';

@Controller('public/countries')
@ApiTags('Countries')
@ApiBearerAuth('JWT-auth')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Get()
  @Auth()
  @Permission('public.countries.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'List all countries with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'region', required: false, type: String, description: 'Filter by region' })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiOkResponse({ 
    description: 'Countries retrieved successfully',
    type: CountriesResponseDto
  })
  async findAll(@Query() query: CountryQueryDto): Promise<CountriesResponseDto> {
    return this.countriesService.findAll(query);
  }

  @Get(':id')
  @Auth()
  @Permission('public.countries.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get country by ID' })
  @ApiParam({ name: 'id', type: 'integer', description: 'Country ID' })
  @ApiOkResponse({ 
    description: 'Country retrieved successfully',
    type: CountryDto
  })
  @ApiNotFoundResponse({ description: 'Country not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<CountryDto> {
    return this.countriesService.findOne(id);
  }

  @Get('code/:code')
  @Auth()
  @Permission('public.countries.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get country by ISO code' })
  @ApiParam({ 
    name: 'code', 
    type: 'string', 
    description: 'ISO 3166-1 alpha-2 country code (e.g., US, DE)',
    example: 'US'
  })
  @ApiOkResponse({ 
    description: 'Country retrieved successfully',
    type: CountryDto
  })
  @ApiNotFoundResponse({ description: 'Country not found' })
  async findByCode(@Param('code') code: string): Promise<CountryDto> {
    return this.countriesService.findByCode(code.toUpperCase());
  }

  @Get('regions/list')
  @Auth()
  @Permission('public.countries.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of all available regions' })
  @ApiOkResponse({ 
    description: 'Regions retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { type: 'string' },
          example: ['Europe', 'Asia', 'Americas', 'Africa', 'Oceania']
        }
      }
    }
  })
  async getRegions(): Promise<{ success: boolean; data: string[] }> {
    const regions = await this.countriesService.getRegions();
    return { success: true, data: regions };
  }

  @Get('popular/list')
  @Auth()
  @Permission('public.countries.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of popular countries (commonly used)' })
  @ApiOkResponse({ 
    description: 'Popular countries retrieved successfully',
    type: [CountryDto]
  })
  async getPopularCountries(): Promise<CountryDto[]> {
    return this.countriesService.getPopularCountries();
  }
}