import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
  path?: string;
  maxAge?: number;
  domain?: string;
}

@Injectable()
export class CookieService {
  private readonly defaultOptions: CookieOptions;

  constructor(private configService: ConfigService) {
    this.defaultOptions = {
      httpOnly: true,
      secure: this.configService.get('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    };
  }

  /**
   * Set a secure HTTP-only cookie using Fastify's native cookie API
   */
  setCookie(
    reply: FastifyReply,
    name: string,
    value: string,
    options?: Partial<CookieOptions>,
  ): void {
    const finalOptions = { ...this.defaultOptions, ...options };
    
    reply.setCookie(name, value, finalOptions);
  }

  /**
   * Get cookie value using Fastify's native cookie API
   */
  getCookie(request: FastifyRequest, name: string): string | undefined {
    return request.cookies?.[name];
  }

  /**
   * Clear a cookie by setting it with maxAge 0
   */
  clearCookie(
    reply: FastifyReply,
    name: string,
    options?: Partial<CookieOptions>,
  ): void {
    const finalOptions = {
      ...this.defaultOptions,
      ...options,
      maxAge: 0,
    };
    
    reply.setCookie(name, '', finalOptions);
  }

  /**
   * Set authentication tokens as HTTP-only cookies
   */
  setAuthCookies(
    reply: FastifyReply,
    accessToken: string,
    refreshToken: string,
  ): void {
    // Access token - shorter expiry
    this.setCookie(reply, 'access-token', accessToken, {
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    // Refresh token - longer expiry
    this.setCookie(reply, 'refresh-token', refreshToken, {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  }

  /**
   * Clear all authentication cookies
   */
  clearAuthCookies(reply: FastifyReply): void {
    this.clearCookie(reply, 'access-token');
    this.clearCookie(reply, 'refresh-token');
    // Legacy cookie cleanup
    this.clearCookie(reply, 'auth-token');
  }

  /**
   * Get access token from cookies
   */
  getAccessToken(request: FastifyRequest): string | undefined {
    return this.getCookie(request, 'access-token') || this.getCookie(request, 'auth-token');
  }

  /**
   * Get refresh token from cookies
   */
  getRefreshToken(request: FastifyRequest): string | undefined {
    return this.getCookie(request, 'refresh-token');
  }
}