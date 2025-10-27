import { UserBaseResponse } from '@application/dtos';
import { UserMapper } from '@application/mappers/user.mapper';
import { UserService } from '@core/services/user.service';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class UpdateUserCommand extends Command<UserBaseResponse> {
  constructor(
    public readonly userId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly email?: string,
    public readonly roleIds?: string[],
    public readonly isActive?: boolean,
  ) {
    super();
  }
}

@CommandHandler(UpdateUserCommand)
export class UpdateUserCommandHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(private readonly userService: UserService) {}

  async execute(command: UpdateUserCommand) {
    const { userId, firstName, lastName, email, roleIds, isActive } = command;

    const user = await this.userService.updateUserDetails(
      userId,
      firstName,
      lastName,
      email,
      roleIds,
      isActive,
    );

    // Use the mapper to convert to response DTO
    return UserMapper.toBaseResponse(user);
  }
}
