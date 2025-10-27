import { UserService } from '@core/services/user.service';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class ChangePasswordCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly newPassword: string,
    public readonly currentPassword?: string,
  ) {
    super();
  }
}

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordCommandHandler implements ICommandHandler<ChangePasswordCommand> {
  constructor(private readonly userService: UserService) {}

  async execute(command: ChangePasswordCommand) {
    const { userId, newPassword, currentPassword } = command;

    await this.userService.changePassword(userId, newPassword, currentPassword);
  }
}
