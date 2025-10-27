import { UserDetailResponse } from '@application/dtos';
import { UserMapper } from '@application/mappers/user.mapper';
import { UserService } from '@core/services/user.service';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class RemoveRoleCommand extends Command<UserDetailResponse> {
  constructor(
    public readonly userId: string,
    public readonly roleId: string,
  ) {
    super();
  }
}

@CommandHandler(RemoveRoleCommand)
export class RemoveRoleCommandHandler implements ICommandHandler<RemoveRoleCommand> {
  constructor(private readonly userService: UserService) {}

  async execute(command: RemoveRoleCommand) {
    const { userId, roleId } = command;

    const user = await this.userService.removeRoleFromUser(userId, roleId);

    // Use the mapper to convert to response DTO
    return UserMapper.toDetailResponse(user);
  }
}
