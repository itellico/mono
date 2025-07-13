import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/prisma/prisma.service';
import { FastifyRequest } from 'fastify';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  tier: string;
  tenantId?: string;
  accountId?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Primary: Extract from HTTP-only cookies (most secure)
        (request: FastifyRequest) => {
          return request?.cookies?.['access-token'] || request?.cookies?.['auth-token'];
        },
        // Fallback: Extract from Authorization header for API clients
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get('app.jwtSecret'),
      // Pass request to validate method for additional security checks
      passReqToCallback: false,
    });
  }

  async validate(payload: JwtPayload) {
    // Verify user still exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: parseInt(payload.sub) },
      include: {
        account: true,
      },
    });

    if (!user || !user.is_active || !user.account?.is_active) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Return user data that will be attached to request
    return {
      id: user.id.toString(),
      email: user.account.email,
      name: `${user.first_name} ${user.last_name}`.trim(),
      tier: payload.tier,
      tenant_id: user.account.tenant_id.toString(),
      account_id: user.account_id.toString(),
    };
  }
}