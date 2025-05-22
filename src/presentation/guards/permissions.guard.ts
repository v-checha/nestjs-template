import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserAuthorizationService } from '@core/services/user-authorization.service';
import { User } from '@core/entities/user.entity';

/**
 * Enhanced PermissionsGuard that uses the UserAuthorizationService
 * for sophisticated permission checking
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userAuthorizationService: UserAuthorizationService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      return false;
    }

    // Check for resource and action metadata
    const resource = this.reflector.get<string>('resource', context.getHandler());
    const action = this.reflector.get<string>('action', context.getHandler());

    if (resource && action) {
      return this.userAuthorizationService.canAccessResource(user, resource, action);
    }

    // Check for admin access requirement
    const requiresAdmin = this.reflector.get<boolean>('admin', context.getHandler());
    if (requiresAdmin) {
      return this.userAuthorizationService.canAccessAdminFeatures(user);
    }

    // Check for sensitive operation requirement
    const requiresSensitive = this.reflector.get<boolean>('sensitive', context.getHandler());
    if (requiresSensitive) {
      return this.userAuthorizationService.canPerformSensitiveOperations(user);
    }

    // Default to authenticated user check
    return true;
  }
}
