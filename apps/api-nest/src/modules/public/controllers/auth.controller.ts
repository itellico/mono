import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { Public } from '@common/decorators/public.decorator';
import { PublicAuthService } from '../services/public-auth.service';

@ApiTags('Public - Auth')
@Public()
@Controller('public/auth')
export class PublicAuthController {
  constructor(private readonly publicAuthService: PublicAuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ 
    schema: {
      type: 'object',
      required: ['email', 'password', 'name'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
        password: { type: 'string', minLength: 8, example: 'SecurePassword123!' },
        name: { type: 'string', example: 'John Doe' },
        tenant_id: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Validation error or user already exists' })
  async register(@Body() registerDto: {
    email: string;
    password: string;
    name: string;
    tenantId?: string;
  }) {
    return this.publicAuthService.register(registerDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({ 
    schema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string', format: 'email', example: 'user@example.com' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() forgotPasswordDto: { email: string }) {
    return this.publicAuthService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using token' })
  @ApiBody({ 
    schema: {
      type: 'object',
      required: ['token', 'password'],
      properties: {
        token: { type: 'string', example: 'reset-token-here' },
        password: { type: 'string', minLength: 8, example: 'NewPassword123!' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() resetPasswordDto: {
    token: string;
    password: string;
  }) {
    return this.publicAuthService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.password,
    );
  }

  @Post('verify-email')
  @ApiOperation({ summary: 'Verify email address' })
  @ApiBody({ 
    schema: {
      type: 'object',
      required: ['token'],
      properties: {
        token: { type: 'string', example: 'verification-token-here' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmail(@Body() verifyEmailDto: { token: string }) {
    return this.publicAuthService.verifyEmail(verifyEmailDto.token);
  }

  @Get('verify-email/:token')
  @ApiOperation({ summary: 'Verify email via link' })
  @ApiResponse({ status: 200, description: 'Email verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async verifyEmailByLink(@Param('token') token: string) {
    return this.publicAuthService.verifyEmail(token);
  }
}