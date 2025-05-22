import { SetMetadata } from '@nestjs/common';

/**
 * Decorator to mark endpoints as requiring sensitive operations (2FA)
 * Used with the enhanced PermissionsGuard
 */
export const RequiresSensitive = () => SetMetadata('sensitive', true);
