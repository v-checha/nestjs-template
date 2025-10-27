import { UserService } from '@core/services/user.service';
import { LoggerService } from '@infrastructure/logger/logger.service';
import { Inject, Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class AdminChangePasswordCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly newPassword: string,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(AdminChangePasswordCommand)
export class AdminChangePasswordCommandHandler
  implements ICommandHandler<AdminChangePasswordCommand>
{
  constructor(
    private readonly userService: UserService,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {
    this.logger.setContext(AdminChangePasswordCommandHandler.name);
  }

  async execute(command: AdminChangePasswordCommand) {
    const { userId, newPassword } = command;

    this.logger.log({
      message: 'Admin changing user password',
      userId,
      adminAction: true,
    });

    // Admin can change password without current password verification
    await this.userService.changePassword(userId, newPassword);

    this.logger.log({
      message: 'Admin password change completed',
      userId,
      adminAction: true,
    });
  }
}
