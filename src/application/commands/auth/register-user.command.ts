import { ICommand, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { RegisterDto } from '@application/dtos/auth/register.dto';
import { IUserBaseResponse } from '@application/dtos/responses/user.response';
import { Injectable } from '@nestjs/common';
import { UserService } from '@core/services/user.service';
import { UserMapper } from '@application/mappers/user.mapper';

export class RegisterUserCommand implements ICommand {
  constructor(public readonly registerDto: RegisterDto) {}
}

@Injectable()
@CommandHandler(RegisterUserCommand)
export class RegisterUserCommandHandler implements ICommandHandler<RegisterUserCommand> {
  constructor(private readonly userService: UserService) {}

  async execute(command: RegisterUserCommand): Promise<IUserBaseResponse> {
    const { email, password, firstName, lastName } = command.registerDto;

    const user = await this.userService.createUser(email, password, firstName, lastName);

    // Use the mapper to convert to response DTO
    return UserMapper.toBaseResponse(user);
  }
}
