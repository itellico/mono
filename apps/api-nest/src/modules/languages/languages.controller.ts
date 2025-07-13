import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiParam, 
  ApiQuery, 
  ApiBearerAuth,
  ApiOkResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';
import { LanguagesService } from './languages.service';
import { Auth } from '@common/decorators/auth.decorator';
import { Permission } from '@common/decorators/permission.decorator';
import { Tier } from '@common/decorators/tier.decorator';
import { UserTier } from '@common/types/tier.types';
import { LanguageDto, LanguageQueryDto, LanguagesResponseDto } from './dto/language.dto';

@Controller('public/languages')
@ApiTags('Languages')
@ApiBearerAuth('JWT-auth')
export class LanguagesController {
  constructor(private readonly languagesService: LanguagesService) {}

  @Get()
  @Auth()
  @Permission('public.languages.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'List all languages with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'direction', required: false, enum: ['ltr', 'rtl'], description: 'Text direction' })
  @ApiQuery({ name: 'family', required: false, type: String, description: 'Language family' })
  @ApiQuery({ name: 'is_active', required: false, type: Boolean, description: 'Filter by active status' })
  @ApiOkResponse({ 
    description: 'Languages retrieved successfully',
    type: LanguagesResponseDto
  })
  async findAll(@Query() query: LanguageQueryDto): Promise<LanguagesResponseDto> {
    return this.languagesService.findAll(query);
  }

  @Get(':id')
  @Auth()
  @Permission('public.languages.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get language by ID' })
  @ApiParam({ name: 'id', type: 'integer', description: 'Language ID' })
  @ApiOkResponse({ 
    description: 'Language retrieved successfully',
    type: LanguageDto
  })
  @ApiNotFoundResponse({ description: 'Language not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<LanguageDto> {
    return this.languagesService.findOne(id);
  }

  @Get('code/:code')
  @Auth()
  @Permission('public.languages.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get language by code' })
  @ApiParam({ 
    name: 'code', 
    type: 'string', 
    description: 'ISO 639-1 language code or locale (e.g., en, en-US)',
    example: 'en'
  })
  @ApiOkResponse({ 
    description: 'Language retrieved successfully',
    type: LanguageDto
  })
  @ApiNotFoundResponse({ description: 'Language not found' })
  async findByCode(@Param('code') code: string): Promise<LanguageDto> {
    return this.languagesService.findByCode(code.toLowerCase());
  }

  @Get('families/list')
  @Auth()
  @Permission('public.languages.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of all language families' })
  @ApiOkResponse({ 
    description: 'Language families retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'array',
          items: { type: 'string' },
          example: ['Germanic', 'Romance', 'Slavic', 'Sino-Tibetan']
        }
      }
    }
  })
  async getFamilies(): Promise<{ success: boolean; data: string[] }> {
    const families = await this.languagesService.getFamilies();
    return { success: true, data: families };
  }

  @Get('rtl/list')
  @Auth()
  @Permission('public.languages.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of RTL (right-to-left) languages' })
  @ApiOkResponse({ 
    description: 'RTL languages retrieved successfully',
    type: [LanguageDto]
  })
  async getRtlLanguages(): Promise<LanguageDto[]> {
    return this.languagesService.getRtlLanguages();
  }

  @Get('popular/list')
  @Auth()
  @Permission('public.languages.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of popular languages (commonly used)' })
  @ApiOkResponse({ 
    description: 'Popular languages retrieved successfully',
    type: [LanguageDto]
  })
  async getPopularLanguages(): Promise<LanguageDto[]> {
    return this.languagesService.getPopularLanguages();
  }

  @Get('locales/list')
  @Auth()
  @Permission('public.languages.read')
  @Tier(UserTier.PUBLIC)
  @ApiOperation({ summary: 'Get list of locale variants (e.g., en-US, en-GB)' })
  @ApiOkResponse({ 
    description: 'Locale variants retrieved successfully',
    type: [LanguageDto]
  })
  async getLocaleVariants(): Promise<LanguageDto[]> {
    return this.languagesService.getLocaleVariants();
  }
}