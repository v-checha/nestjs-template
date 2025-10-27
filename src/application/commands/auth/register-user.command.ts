import { RegisterRequest, UserBaseResponse } from '@application/dtos';
import { UserMapper } from '@application/mappers/user.mapper';
import { UserService } from '@core/services/user.service';
import { Injectable } from '@nestjs/common';
import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

export class RegisterUserCommand extends Command<UserBaseResponse> {
  constructor(public readonly registerDto: RegisterRequest) {
    super();
  }
}

@Injectable()
@CommandHandler(RegisterUserCommand)
export class RegisterUserCommandHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(private readonly userService: UserService) {}

  async execute(command: RegisterUserCommand) {
    const { email, password, firstName, lastName } = command.registerDto;

    const user = await this.userService.createUser(email, password, firstName, lastName);

    // Use the mapper to convert to response DTO
    return UserMapper.toBaseResponse(user);
  }
}
