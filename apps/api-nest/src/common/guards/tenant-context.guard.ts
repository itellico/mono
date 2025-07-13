import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract tenant ID from various sources
    let tenantId: string;

    // 1. From route params (e.g., /api/v2/tenant/:tenantId/...)
    if (request.params?.tenantId) {
      tenantId = request.params.tenantId;
    }
    // 2. From query params
    else if (request.query?.tenantId) {
      tenantId = request.query.tenantId;
    }
    // 3. From request body
    else if (request.body?.tenantId) {
      tenantId = request.body.tenantId;
    }
    // 4. From user's default tenant
    else if (user.tenantId) {
      tenantId = user.tenantId;
    }

    // Verify user has access to this tenant
    if (tenantId && user.tier !== 'platform') {
      // Non-platform users can only access their own tenant
      if (user.tenantId !== tenantId) {
        throw new ForbiddenException('Access denied to this tenant');
      }
    }

    // Attach tenant context to request
    request.tenant = {
      id: tenantId,
      user_id: user.id,
      tier: user.tier,
    };

    return true;
  }
}