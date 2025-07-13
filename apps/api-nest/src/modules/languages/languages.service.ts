import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { LoggerService } from '@common/logging/logger.service';
import { RedisService } from '@common/redis/redis.service';
import { LanguageDto, LanguageQueryDto, LanguagesResponseDto } from './dto/language.dto';

@Injectable()
export class LanguagesService {
  private readonly CACHE_PREFIX = 'languages:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get all languages with pagination and filtering
   */
  async findAll(query: LanguageQueryDto): Promise<LanguagesResponseDto> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    this.logger.logBusiness('Fetching languages', { 
      page, 
      limit, 
      search: query.search,
      direction: query.direction,
      family: query.family,
      is_active: query.is_active 
    });

    // Build cache key
    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(query)}`;
    
    try {
      // Try to get from cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Languages retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      // Build where clause for filtering
      const where: any = {};
      
      if (query.is_active !== undefined) {
        where.is_active = query.is_active;
      }

      if (query.direction) {
        where.direction = query.direction;
      }

      if (query.family) {
        where.family = {
          contains: query.family,
          mode: 'insensitive'
        };
      }

      if (query.search) {
        where.OR = [
          {
            name: {
              contains: query.search,
              mode: 'insensitive'
            }
          },
          {
            native_name: {
              contains: query.search,
              mode: 'insensitive'
            }
          },
          {
            code: {
              contains: query.search.toLowerCase(),
              mode: 'insensitive'
            }
          },
          {
            iso639_1: {
              contains: query.search.toLowerCase(),
              mode: 'insensitive'
            }
          }
        ];
      }

      // Execute queries in parallel for better performance
      const [languages, total] = await Promise.all([
        this.prisma.language.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { display_order: 'asc' },
            { speakers: 'desc' },
            { name: 'asc' }
          ]
        }),
        this.prisma.language.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      const result: LanguagesResponseDto = {
        data: languages.map(this.mapLanguageToDto),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Languages fetched successfully', {
        count: languages.length,
        total,
        page,
        cached: false
      });

      return result;

    } catch (error) {
      this.logger.error('Error fetching languages', error, { query });
      throw new BadRequestException('Failed to fetch languages');
    }
  }

  /**
   * Get a single language by ID
   */
  async findOne(id: number): Promise<LanguageDto> {
    this.logger.logBusiness('Fetching language by ID', { id });

    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Language retrieved from cache', { id, cacheKey });
        return JSON.parse(cached as string);
      }

      const language = await this.prisma.language.findUnique({
        where: { id }
      });

      if (!language) {
        throw new NotFoundException(`Language with ID ${id} not found`);
      }

      const result = this.mapLanguageToDto(language);

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Language fetched successfully', { id, cached: false });

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching language by ID', error, { id });
      throw new BadRequestException('Failed to fetch language');
    }
  }

  /**
   * Get a single language by code
   */
  async findByCode(code: string): Promise<LanguageDto> {
    this.logger.logBusiness('Fetching language by code', { code });

    const cacheKey = `${this.CACHE_PREFIX}code:${code}`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Language retrieved from cache', { code, cacheKey });
        return JSON.parse(cached as string);
      }

      const language = await this.prisma.language.findFirst({
        where: {
          OR: [
            { code: code },
            { iso639_1: code },
            { iso639_2: code }
          ]
        }
      });

      if (!language) {
        throw new NotFoundException(`Language with code ${code} not found`);
      }

      const result = this.mapLanguageToDto(language);

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Language fetched by code successfully', { code, cached: false });

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching language by code', error, { code });
      throw new BadRequestException('Failed to fetch language');
    }
  }

  /**
   * Get list of all language families
   */
  async getFamilies(): Promise<string[]> {
    this.logger.logBusiness('Fetching language families');

    const cacheKey = `${this.CACHE_PREFIX}families`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Language families retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      const families = await this.prisma.language.findMany({
        where: { 
          is_active: true,
          family: { not: null }
        },
        select: { family: true },
        distinct: ['family']
      });

      const result = families
        .map(f => f.family)
        .filter(Boolean)
        .sort();

      // Cache the result for longer (families don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 6);

      this.logger.logBusiness('Language families fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching language families', error);
      throw new BadRequestException('Failed to fetch language families');
    }
  }

  /**
   * Get RTL (right-to-left) languages
   */
  async getRtlLanguages(): Promise<LanguageDto[]> {
    this.logger.logBusiness('Fetching RTL languages');

    const cacheKey = `${this.CACHE_PREFIX}rtl`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('RTL languages retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      const languages = await this.prisma.language.findMany({
        where: {
          direction: 'rtl',
          is_active: true
        },
        orderBy: [
          { speakers: 'desc' },
          { name: 'asc' }
        ]
      });

      const result = languages.map(this.mapLanguageToDto);

      // Cache for longer (RTL languages don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 12);

      this.logger.logBusiness('RTL languages fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching RTL languages', error);
      throw new BadRequestException('Failed to fetch RTL languages');
    }
  }

  /**
   * Get popular languages (commonly used in applications)
   */
  async getPopularLanguages(): Promise<LanguageDto[]> {
    this.logger.logBusiness('Fetching popular languages');

    const cacheKey = `${this.CACHE_PREFIX}popular`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Popular languages retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      // List of commonly used language codes
      const popularCodes = [
        'en', 'es', 'zh', 'hi', 'ar', 'pt', 'bn', 'ru', 'ja', 'pa',
        'de', 'ko', 'fr', 'tr', 'it', 'ur', 'fa', 'pl', 'uk', 'nl'
      ];

      const languages = await this.prisma.language.findMany({
        where: {
          OR: [
            { code: { in: popularCodes } },
            { iso639_1: { in: popularCodes } }
          ],
          is_active: true
        },
        orderBy: [
          { speakers: 'desc' },
          { name: 'asc' }
        ]
      });

      const result = languages.map(this.mapLanguageToDto);

      // Cache for longer (popular languages don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 12);

      this.logger.logBusiness('Popular languages fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching popular languages', error);
      throw new BadRequestException('Failed to fetch popular languages');
    }
  }

  /**
   * Get locale variants (languages with region codes like en-US, fr-CA)
   */
  async getLocaleVariants(): Promise<LanguageDto[]> {
    this.logger.logBusiness('Fetching locale variants');

    const cacheKey = `${this.CACHE_PREFIX}locales`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Locale variants retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      const languages = await this.prisma.language.findMany({
        where: {
          code: { contains: '-' }, // Locale codes contain hyphens
          is_active: true
        },
        orderBy: [
          { code: 'asc' }
        ]
      });

      const result = languages.map(this.mapLanguageToDto);

      // Cache for longer (locales don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 6);

      this.logger.logBusiness('Locale variants fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching locale variants', error);
      throw new BadRequestException('Failed to fetch locale variants');
    }
  }

  /**
   * Map Prisma Language model to DTO
   */
  private mapLanguageToDto(language: any): LanguageDto {
    return {
      id: language.id,
      code: language.code,
      iso639_1: language.iso639_1,
      iso639_2: language.iso639_2,
      name: language.name,
      native_name: language.native_name,
      direction: language.direction,
      family: language.family,
      speakers: language.speakers,
      is_active: language.is_active,
      display_order: language.display_order,
      created_at: language.created_at,
      updated_at: language.updated_at
    };
  }

  /**
   * Clear cache for all languages (useful after data updates)
   */
  async clearCache(): Promise<void> {
    try {
      const pattern = `${this.CACHE_PREFIX}*`;
      const keys = await this.redis.getClient().keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.getClient().del(keys);
        this.logger.logBusiness('Languages cache cleared', { keysCleared: keys.length });
      }
    } catch (error) {
      this.logger.error('Error clearing languages cache', error);
    }
  }
}