import { RoleService } from '@core/services/role.service';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class DeleteRoleCommand extends Command<boolean> {
  constructor(
    public readonly id: string,
    public readonly deleterId?: string, // ID of the user performing the deletion
  ) {
    super();
  }
}

@CommandHandler(DeleteRoleCommand)
export class DeleteRoleCommandHandler implements ICommandHandler<DeleteRoleCommand> {
  constructor(private readonly roleService: RoleService) {}

  async execute(command: DeleteRoleCommand) {
    const { id, deleterId } = command;

    return this.roleService.deleteRole(id, deleterId);
  }
}
