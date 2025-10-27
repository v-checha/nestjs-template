import { UserService } from '@core/services/user.service';
import { LoggerService } from '@infrastructure/logger/logger.service';
import { Inject, Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class AdminUpdateUserCommand extends Command<void> {
  constructor(
    public readonly userId: string,
    public readonly firstName?: string,
    public readonly lastName?: string,
    public readonly email?: string,
  ) {
    super();
  }
}

@Injectable()
@CommandHandler(AdminUpdateUserCommand)
export class AdminUpdateUserCommandHandler implements ICommandHandler<AdminUpdateUserCommand> {
  constructor(
    private readonly userService: UserService,
    @Inject(LoggerService) private readonly logger: LoggerService,
  ) {
    this.logger.setContext(AdminUpdateUserCommandHandler.name);
  }

  async execute(command: AdminUpdateUserCommand) {
    const { userId, firstName, lastName, email } = command;

    this.logger.log({
      message: 'Admin updating user',
      userId,
      adminAction: true,
    });

    await this.userService.updateUserDetails(userId, firstName, lastName, email);

    this.logger.log({
      message: 'Admin user update completed',
      userId,
      adminAction: true,
    });
  }
}
