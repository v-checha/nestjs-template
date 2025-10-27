import { UserService } from '@core/services/user.service';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class VerifyPasswordCommand extends Command<boolean> {
  constructor(
    public readonly userId: string,
    public readonly password: string,
  ) {
    super();
  }
}

@CommandHandler(VerifyPasswordCommand)
export class VerifyPasswordCommandHandler implements ICommandHandler<VerifyPasswordCommand> {
  constructor(private readonly userService: UserService) {}

  async execute(command: VerifyPasswordCommand) {
    const { userId, password } = command;

    return this.userService.verifyCurrentPassword(userId, password);
  }
}
