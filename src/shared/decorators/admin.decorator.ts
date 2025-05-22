import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark endpoints as requiring admin access
 * Used with the enhanced PermissionsGuard
 */
export const RequiresAdmin = () => SetMetadata('admin', true);
