import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ROLE_REPOSITORY, PERMISSION_REPOSITORY } from '@shared/constants/tokens';

// Controllers
import { RoleController } from './role.controller';

// Repositories
import { RoleRepository } from '@infrastructure/repositories/role.repository';
import { PermissionRepository } from '@infrastructure/repositories/permission.repository';
import { PrismaModule } from '@infrastructure/database/prisma/prisma.module';
import { CoreModule } from '@core/core.module';

// Services
import { RoleService } from '@core/services/role.service';
import { PermissionService } from '@core/services/permission.service';

// Query Handlers
import { GetRolesQueryHandler } from '@application/queries/role/get-roles.query';
import { GetRoleQueryHandler } from '@application/queries/role/get-role.query';

// Command Handlers
import { CreateRoleCommandHandler } from '@application/commands/role/create-role.command';
import { UpdateRoleCommandHandler } from '@application/commands/role/update-role.command';
import { DeleteRoleCommandHandler } from '@application/commands/role/delete-role.command';
import { AssignPermissionCommandHandler } from '@application/commands/role/assign-permission.command';
import { RemovePermissionCommandHandler } from '@application/commands/role/remove-permission.command';

const queryHandlers = [GetRolesQueryHandler, GetRoleQueryHandler];

const commandHandlers = [
  CreateRoleCommandHandler,
  UpdateRoleCommandHandler,
  DeleteRoleCommandHandler,
  AssignPermissionCommandHandler,
  RemovePermissionCommandHandler,
];

@Module({
  imports: [CqrsModule, PrismaModule, CoreModule],
  controllers: [RoleController],
  providers: [
    // Services
    RoleService,
    PermissionService,

    // Repository tokens
    {
      provide: ROLE_REPOSITORY,
      useClass: RoleRepository,
    },
    {
      provide: PERMISSION_REPOSITORY,
      useClass: PermissionRepository,
    },

    // Query handlers
    ...queryHandlers,

    // Command handlers
    ...commandHandlers,
  ],
})
export class RoleModule {}
