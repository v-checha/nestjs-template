import { UserBaseResponse } from '@application/dtos';
import { UserMapper } from '@application/mappers/user.mapper';
import { AuthService } from '@core/services/auth.service';
import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class Disable2FACommand extends Command<UserBaseResponse> {
  constructor(public readonly userId: string) {
    super();
  }
}

@Injectable()
@CommandHandler(Disable2FACommand)
export class Disable2FACommandHandler implements ICommandHandler<Disable2FACommand> {
  constructor(private readonly authService: AuthService) {}

  async execute(command: Disable2FACommand) {
    const { userId } = command;

    // Disable 2FA for the user
    const user = await this.authService.disableTwoFactorAuth(userId);

    // Use the mapper to convert to response DTO
    return UserMapper.toBaseResponse(user);
  }
}
