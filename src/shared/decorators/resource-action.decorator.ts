import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to specify resource and action for permission checking
 * Used with the enhanced PermissionsGuard
 *
 * @param resource - The resource being accessed (e.g., 'user', 'role')
 * @param action - The action being performed (e.g., 'create', 'delete')
 */
export const RequiresResourceAction =
  (resource: string, action: string) =>
  (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata('resource', resource)(target, propertyKey, descriptor);
    SetMetadata('action', action)(target, propertyKey, descriptor);
  };
