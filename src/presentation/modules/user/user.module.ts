import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { USER_REPOSITORY, ROLE_REPOSITORY } from '@shared/constants/tokens';

// Controllers
import { UserController } from './user.controller';

// Repositories
import { UserRepository } from '@infrastructure/repositories/user.repository';
import { RoleRepository } from '@infrastructure/repositories/role.repository';
import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { CoreModule } from '@core/core.module';

// Services
import { UserService } from '@core/services/user.service';

// Profile-specific Query Handlers (shared handlers are in AdminModule)
import { GetUserQueryHandler } from '@application/queries/user/get-user.query';

// Profile-specific Command Handlers (shared handlers are in AdminModule)
import { UpdateUserCommandHandler } from '@application/commands/user/update-user.command';
import { ChangePasswordCommandHandler } from '@application/commands/user/change-password.command';
import { VerifyPasswordCommandHandler } from '@application/commands/user/verify-password.command';

const queryHandlers = [GetUserQueryHandler];

const commandHandlers = [UpdateUserCommandHandler, ChangePasswordCommandHandler, VerifyPasswordCommandHandler];

@Module({
  imports: [CqrsModule, PrismaModule, CoreModule],
  controllers: [UserController],
  providers: [
    // Services
    {
      provide: UserService,
      useClass: UserService,
    },

    // Repository tokens
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepository,
    },

    // Query handlers
    ...queryHandlers,

    // Command handlers
    ...commandHandlers,
  ],
  exports: [UserService, USER_REPOSITORY],
})
export class UserModule {}
