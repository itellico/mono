import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '@common/decorators/roles.decorator';
import { PrismaService } from '@common/prisma/prisma.service';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // No roles required
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      return false; // No authenticated user
    }

    // Get user with roles from database
    const userWithRoles = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!userWithRoles || !userWithRoles.userRoles) {
      return false;
    }

    // Extract user's role codes
    const userRoleCodes = userWithRoles.userRoles.map(ur => ur.role.code);

    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => userRoleCodes.includes(role));

    // Special case: super_admin can access everything
    if (userRoleCodes.includes('super_admin')) {
      return true;
    }

    return hasRequiredRole;
  }
}