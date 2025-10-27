import { UserBaseResponse } from '@application/dtos';
import { UserService } from '@core/services/user.service';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class ActivateUserCommand extends Command<UserBaseResponse> {
  constructor(
    public readonly userId: string,
    public readonly active: boolean,
  ) {
    super();
  }
}

@CommandHandler(ActivateUserCommand)
export class ActivateUserCommandHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(private readonly userService: UserService) {}

  async execute(command: ActivateUserCommand) {
    const { userId, active } = command;

    let user;
    if (active) {
      user = await this.userService.activateUser(userId);
    } else {
      user = await this.userService.deactivateUser(userId);
    }

    return {
      id: user.id,
      email: user.email.getValue(),
      firstName: user.firstName.getValue(),
      lastName: user.lastName.getValue(),
    };
  }
}
