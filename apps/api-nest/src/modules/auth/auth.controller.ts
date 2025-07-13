import { Controller, Post, Body, Res, Req, UseGuards, Get, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '@common/guards/local-auth.guard';
import { JwtAuthGuard } from '@common/guards/jwt-auth.guard';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser } from '@common/decorators/user.decorator';
import { SignInDto, RefreshTokenDto } from './dto/auth.dto';
import { AuthResponseDto, UserDataDto, SignOutResponseDto } from './dto/auth-response.dto';
import { CookieService } from './services/cookie.service';

@ApiTags('Public - Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  @Public()
  @Post('signin')
  @ApiOperation({ 
    summary: 'User sign in',
    description: 'Authenticate user with email and password. Sets secure HTTP-only cookies.'
  })
  @ApiBody({ type: SignInDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully authenticated',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid credentials'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Validation error'
  })
  async signIn(
    @Body() signInDto: SignInDto,
    @Res({ passthrough: true }) reply: FastifyReply,
  ): Promise<AuthResponseDto> {
    const result = await this.authService.signIn(signInDto);
    
    if (result.success && result.data.accessToken && result.data.refreshToken) {
      // Set secure HTTP-only cookies using Fastify's native cookie API
      this.cookieService.setAuthCookies(
        reply,
        result.data.accessToken,
        result.data.refreshToken
      );
      
      // Remove tokens from response body for security
      const { accessToken, refreshToken, ...safeData } = result.data;
      
      return {
        success: true,
        data: safeData,
        message: 'Successfully authenticated'
      };
    }
    
    throw new UnauthorizedException('Invalid credentials');
  }

  @UseGuards(JwtAuthGuard)
  @Post('signout')
  @ApiOperation({ 
    summary: 'User sign out',
    description: 'Sign out user and clear authentication cookies'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully signed out',
    type: SignOutResponseDto
  })
  async signOut(
    @CurrentUser() user: UserDataDto,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Req() request: FastifyRequest,
  ): Promise<SignOutResponseDto> {
    // Get refresh token from cookies for proper invalidation
    const refreshToken = this.cookieService.getRefreshToken(request);
    
    // Invalidate tokens in database/cache
    await this.authService.signOut(user.id, refreshToken);
    
    // Clear all authentication cookies
    this.cookieService.clearAuthCookies(reply);
    
    return {
      success: true,
      message: 'Successfully signed out'
    };
  }

  @Post('refresh')
  @ApiOperation({ 
    summary: 'Refresh access token',
    description: 'Refresh access token using refresh token from HTTP-only cookie'
  })
  @ApiBody({ type: RefreshTokenDto, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Successfully refreshed token',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Invalid or expired refresh token'
  })
  async refresh(
    @Body() refreshDto: RefreshTokenDto,
    @Res({ passthrough: true }) reply: FastifyReply,
    @Req() request: FastifyRequest,
  ): Promise<AuthResponseDto> {
    // Get refresh token from cookie or request body (cookie preferred)
    const refreshToken = this.cookieService.getRefreshToken(request) || refreshDto.refreshToken;
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    
    const result = await this.authService.refresh(refreshToken);
    
    if (result.success && result.data.accessToken && result.data.refreshToken) {
      // Set new tokens as HTTP-only cookies
      this.cookieService.setAuthCookies(
        reply,
        result.data.accessToken,
        result.data.refreshToken
      );
      
      // Remove tokens from response body
      const { accessToken, refreshToken: newRefreshToken, ...safeData } = result.data;
      
      return {
        success: true,
        data: safeData,
        message: 'Token refreshed successfully'
      };
    }
    
    throw new UnauthorizedException('Invalid refresh token');
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ 
    summary: 'Get current user data',
    description: 'Get authenticated user information with roles and permissions'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User data retrieved successfully',
    type: AuthResponseDto
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Authentication required'
  })
  async getMe(@CurrentUser() user: UserDataDto): Promise<AuthResponseDto> {
    // Get fresh user data with roles and permissions
    const userData = await this.authService.getUserWithRoles(user.id);
    
    return {
      success: true,
      data: userData,
      message: 'User data retrieved successfully'
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  @ApiOperation({ 
    summary: 'Change user password',
    description: 'Change the current user\'s password'
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['currentPassword', 'newPassword'],
      properties: {
        currentPassword: { type: 'string', minLength: 8 },
        newPassword: { type: 'string', minLength: 8 },
      },
    },
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Password changed successfully'
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid current password or validation error'
  })
  async changePassword(
    @CurrentUser() user: UserDataDto,
    @Body() changePasswordDto: { currentPassword: string; newPassword: string }
  ) {
    const result = await this.authService.changePassword(
      user.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword
    );
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
  }
}