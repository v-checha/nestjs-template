import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import {
  USER_REPOSITORY,
  ROLE_REPOSITORY,
  PERMISSION_REPOSITORY,
  OTP_REPOSITORY,
  REFRESH_TOKEN_REPOSITORY,
  EMAIL_VERIFICATION_REPOSITORY,
  PASSWORD_RESET_REPOSITORY,
} from '@shared/constants/tokens';

// Controllers
import { AdminAuthController } from './admin-auth.controller';
import { AdminController } from './admin.controller';
import { AdminUserController } from './admin-user.controller';
import { AdminRoleController } from './admin-role.controller';
import { AdminHealthController } from './admin-health.controller';

// Repositories
import { UserRepository } from '@infrastructure/repositories/user.repository';
import { RoleRepository } from '@infrastructure/repositories/role.repository';
import { PermissionRepository } from '@infrastructure/repositories/permission.repository';
import { OtpRepository } from '@infrastructure/repositories/otp.repository';
import { RefreshTokenRepository } from '@infrastructure/repositories/refresh-token.repository';
import { EmailVerificationRepository } from '@infrastructure/repositories/email-verification.repository';
import { PasswordResetRepository } from '@infrastructure/repositories/password-reset.repository';
import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { CoreModule } from '@core/core.module';

// Services
import { UserService } from '@core/services/user.service';
import { RoleService } from '@core/services/role.service';
import { AuthService } from '@core/services/auth.service';

// Providers
import { TokenProvider } from '@presentation/modules/auth/providers/token.provider';

// Query Handlers
import { AdminGetUserQueryHandler } from '@application/queries/admin/get-user.query';
import { GetUsersQueryHandler } from '@application/queries/user/get-users.query';
import { GetRolesQueryHandler } from '@application/queries/role/get-roles.query';
import { GetRoleQueryHandler } from '@application/queries/role/get-role.query';
import { GetPermissionsQueryHandler } from '@application/queries/permission/get-permissions.query';
import { AdminGetHealthQueryHandler } from '@application/queries/admin/get-health.query';
import { GetDatabaseHealthQueryHandler } from '@application/queries/health/get-database-health.query';
import { GetReadinessQueryHandler } from '@application/queries/health/get-readiness.query';
import { GetLivenessQueryHandler } from '@application/queries/health/get-liveness.query';

// Command Handlers
import { AdminUpdateUserCommandHandler } from '@application/commands/admin/update-user.command';
import { AdminChangePasswordCommandHandler } from '@application/commands/admin/change-password.command';
import { ActivateUserCommandHandler } from '@application/commands/user/activate-user.command';
import { AssignRoleCommandHandler } from '@application/commands/user/assign-role.command';
import { RemoveRoleCommandHandler } from '@application/commands/user/remove-role.command';
import { LoginCommandHandler } from '@application/commands/auth/login.command';
import { RefreshTokenCommandHandler } from '@application/commands/auth/refresh-token.command';
import { LogoutCommandHandler } from '@application/commands/auth/logout.command';
import { CreateRoleCommandHandler } from '@application/commands/role/create-role.command';
import { UpdateRoleCommandHandler } from '@application/commands/role/update-role.command';
import { DeleteRoleCommandHandler } from '@application/commands/role/delete-role.command';
import { AssignPermissionCommandHandler } from '@application/commands/role/assign-permission.command';
import { RemovePermissionCommandHandler } from '@application/commands/role/remove-permission.command';

const queryHandlers = [
  AdminGetUserQueryHandler,
  GetUsersQueryHandler,
  GetRolesQueryHandler,
  GetRoleQueryHandler,
  GetPermissionsQueryHandler,
  AdminGetHealthQueryHandler,
  GetDatabaseHealthQueryHandler,
  GetReadinessQueryHandler,
  GetLivenessQueryHandler,
];

const commandHandlers = [
  AdminUpdateUserCommandHandler,
  AdminChangePasswordCommandHandler,
  ActivateUserCommandHandler,
  AssignRoleCommandHandler,
  RemoveRoleCommandHandler,
  LoginCommandHandler,
  RefreshTokenCommandHandler,
  LogoutCommandHandler,
  CreateRoleCommandHandler,
  UpdateRoleCommandHandler,
  DeleteRoleCommandHandler,
  AssignPermissionCommandHandler,
  RemovePermissionCommandHandler,
];

/**
 * Admin Module
 *
 * Provides secure admin-only functionality with complete isolation from regular user operations.
 * All controllers in this module require admin privileges enforced at the controller level.
 *
 * Security Features:
 * - @RequiresAdmin() decorator on all admin controllers
 * - Separate routing namespace (/admin/*)
 * - Admin-specific authentication endpoints
 * - Complete separation from user profile operations
 */
@Module({
  imports: [
    CqrsModule,
    PrismaModule,
    CoreModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get('JWT_ACCESS_EXPIRATION', '15m'),
        },
      }),
    }),
  ],
  controllers: [AdminAuthController, AdminController, AdminUserController, AdminRoleController, AdminHealthController],
  providers: [
    // Services
    {
      provide: UserService,
      useClass: UserService,
    },
    {
      provide: RoleService,
      useClass: RoleService,
    },
    {
      provide: AuthService,
      useClass: AuthService,
    },

    // Providers
    TokenProvider,

    // Repository tokens
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepository,
    },
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PermissionRepository,
    },
    {
      provide: OTP_REPOSITORY,
      useClass: OtpRepository,
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository,
    },
    {
      provide: EMAIL_VERIFICATION_REPOSITORY,
      useClass: EmailVerificationRepository,
    },
    {
      provide: PASSWORD_RESET_REPOSITORY,
      useClass: PasswordResetRepository,
    },

    // Query handlers
    ...queryHandlers,

    // Command handlers
    ...commandHandlers,
  ],
  exports: [UserService, USER_REPOSITORY, ROLE_REPOSITORY, PERMISSION_REPOSITORY],
})
export class AdminModule {}
