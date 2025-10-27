import { UserDetailResponse } from '@application/dtos';
import { UserMapper } from '@application/mappers/user.mapper';
import { UserService } from '@core/services/user.service';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class AssignRoleCommand extends Command<UserDetailResponse> {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
    public readonly assignerId?: string, // ID of the user performing the assignment
  ) {
    super();
  }
}

@CommandHandler(AssignRoleCommand)
export class AssignRoleCommandHandler implements ICommandHandler<AssignRoleCommand> {
  constructor(private readonly userService: UserService) {}

  async execute(command: AssignRoleCommand) {
    const { userId, roleId, assignerId } = command;

    const user = await this.userService.assignRoleToUser(userId, roleId, assignerId);

    // Use the mapper to convert to response DTO
    return UserMapper.toDetailResponse(user);
  }
}
