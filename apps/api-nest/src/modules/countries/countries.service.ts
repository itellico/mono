import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@common/prisma/prisma.service';
import { LoggerService } from '@common/logging/logger.service';
import { RedisService } from '@common/redis/redis.service';
import { CountryDto, CountryQueryDto, CountriesResponseDto } from './dto/country.dto';

@Injectable()
export class CountriesService {
  private readonly CACHE_PREFIX = 'countries:';
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get all countries with pagination and filtering
   */
  async findAll(query: CountryQueryDto): Promise<CountriesResponseDto> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 20, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    this.logger.logBusiness('Fetching countries', { 
      page, 
      limit, 
      search: query.search,
      region: query.region,
      is_active: query.is_active 
    });

    // Build cache key
    const cacheKey = `${this.CACHE_PREFIX}list:${JSON.stringify(query)}`;
    
    try {
      // Try to get from cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Countries retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      // Build where clause for filtering
      const where: any = {};
      
      if (query.is_active !== undefined) {
        where.is_active = query.is_active;
      }

      if (query.region) {
        where.region = {
          contains: query.region,
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
            code: {
              contains: query.search.toUpperCase(),
              mode: 'insensitive'
            }
          },
          {
            alpha3: {
              contains: query.search.toUpperCase(),
              mode: 'insensitive'
            }
          }
        ];
      }

      // Execute queries in parallel for better performance
      const [countries, total] = await Promise.all([
        this.prisma.country.findMany({
          where,
          skip,
          take: limit,
          orderBy: [
            { display_order: 'asc' },
            { name: 'asc' }
          ]
        }),
        this.prisma.country.count({ where })
      ]);

      const totalPages = Math.ceil(total / limit);

      const result: CountriesResponseDto = {
        data: countries.map(this.mapCountryToDto),
        pagination: {
          page,
          limit,
          total,
          totalPages
        }
      };

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Countries fetched successfully', {
        count: countries.length,
        total,
        page,
        cached: false
      });

      return result;

    } catch (error) {
      this.logger.error('Error fetching countries', error, { query });
      throw new BadRequestException('Failed to fetch countries');
    }
  }

  /**
   * Get a single country by ID
   */
  async findOne(id: number): Promise<CountryDto> {
    this.logger.logBusiness('Fetching country by ID', { id });

    const cacheKey = `${this.CACHE_PREFIX}id:${id}`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Country retrieved from cache', { id, cacheKey });
        return JSON.parse(cached as string);
      }

      const country = await this.prisma.country.findUnique({
        where: { id }
      });

      if (!country) {
        throw new NotFoundException(`Country with ID ${id} not found`);
      }

      const result = this.mapCountryToDto(country);

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Country fetched successfully', { id, cached: false });

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching country by ID', error, { id });
      throw new BadRequestException('Failed to fetch country');
    }
  }

  /**
   * Get a single country by ISO code
   */
  async findByCode(code: string): Promise<CountryDto> {
    this.logger.logBusiness('Fetching country by code', { code });

    const cacheKey = `${this.CACHE_PREFIX}code:${code}`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Country retrieved from cache', { code, cacheKey });
        return JSON.parse(cached as string);
      }

      const country = await this.prisma.country.findFirst({
        where: {
          OR: [
            { code: code },
            { alpha3: code }
          ]
        }
      });

      if (!country) {
        throw new NotFoundException(`Country with code ${code} not found`);
      }

      const result = this.mapCountryToDto(country);

      // Cache the result
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL);

      this.logger.logBusiness('Country fetched by code successfully', { code, cached: false });

      return result;

    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching country by code', error, { code });
      throw new BadRequestException('Failed to fetch country');
    }
  }

  /**
   * Get list of all available regions
   */
  async getRegions(): Promise<string[]> {
    this.logger.logBusiness('Fetching available regions');

    const cacheKey = `${this.CACHE_PREFIX}regions`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Regions retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      const regions = await this.prisma.country.findMany({
        where: { 
          is_active: true,
          region: { not: null }
        },
        select: { region: true },
        distinct: ['region']
      });

      const result = regions
        .map(r => r.region)
        .filter(Boolean)
        .sort();

      // Cache the result for longer (regions don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 6);

      this.logger.logBusiness('Regions fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching regions', error);
      throw new BadRequestException('Failed to fetch regions');
    }
  }

  /**
   * Get popular countries (commonly used in applications)
   */
  async getPopularCountries(): Promise<CountryDto[]> {
    this.logger.logBusiness('Fetching popular countries');

    const cacheKey = `${this.CACHE_PREFIX}popular`;
    
    try {
      // Try cache first
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        this.logger.logBusiness('Popular countries retrieved from cache', { cacheKey });
        return JSON.parse(cached as string);
      }

      // List of commonly used country codes
      const popularCodes = [
        'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE',
        'JP', 'CN', 'KR', 'IN', 'BR', 'MX', 'AR', 'RU', 'SE', 'NO',
        'DK', 'FI', 'CH', 'AT', 'PL', 'SG', 'HK', 'NZ', 'IE', 'PT'
      ];

      const countries = await this.prisma.country.findMany({
        where: {
          code: { in: popularCodes },
          is_active: true
        },
        orderBy: { name: 'asc' }
      });

      const result = countries.map(this.mapCountryToDto);

      // Cache for longer (popular countries don't change often)
      await this.redis.set(cacheKey, JSON.stringify(result), this.CACHE_TTL * 12);

      this.logger.logBusiness('Popular countries fetched successfully', { count: result.length });

      return result;

    } catch (error) {
      this.logger.error('Error fetching popular countries', error);
      throw new BadRequestException('Failed to fetch popular countries');
    }
  }

  /**
   * Map Prisma Country model to DTO
   */
  private mapCountryToDto(country: any): CountryDto {
    return {
      id: country.id,
      code: country.code,
      alpha3: country.alpha3,
      name: country.name,
      native_name: country.native_name,
      phone_code: country.phone_code,
      flag_emoji: country.flag_emoji,
      region: country.region,
      subregion: country.subregion,
      is_active: country.is_active,
      display_order: country.display_order,
      created_at: country.created_at,
      updated_at: country.updated_at
    };
  }

  /**
   * Clear cache for all countries (useful after data updates)
   */
  async clearCache(): Promise<void> {
    try {
      const pattern = `${this.CACHE_PREFIX}*`;
      const keys = await this.redis.getClient().keys(pattern);
      
      if (keys.length > 0) {
        await this.redis.getClient().del(keys);
        this.logger.logBusiness('Countries cache cleared', { keysCleared: keys.length });
      }
    } catch (error) {
      this.logger.error('Error clearing countries cache', error);
    }
  }
}