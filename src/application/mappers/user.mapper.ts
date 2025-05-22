import { User } from '@core/entities/user.entity';
import { Role } from '@core/entities/role.entity';
import {
  IUserBaseResponse,
  IUserDetailResponse,
  IUserRoleResponse,
  IUserWithAuthResponse,
} from '@application/dtos/responses/user.response';

export class UserMapper {
  /**
   * Maps a Role entity to a IUserRoleResponse DTO
   */
  static toRoleResponse(role: Role): IUserRoleResponse {
    return {
      id: role.id.getValue(),
      name: role.name,
    };
  }

  /**
   * Maps a User entity to a IUserBaseResponse DTO
   */
  static toBaseResponse(user: User, emailVerified: boolean = false): IUserBaseResponse {
    return {
      id: user.id.getValue(),
      email: user.email.getValue(),
      firstName: user.firstName.getValue(),
      lastName: user.lastName.getValue(),
      emailVerified,
    };
  }

  /**
   * Maps a User entity to a IUserDetailResponse DTO
   */
  static toDetailResponse(user: User, emailVerified: boolean = false): IUserDetailResponse {
    return {
      ...this.toBaseResponse(user, emailVerified),
      isActive: user.isActive,
      otpEnabled: user.otpEnabled,
      lastLoginAt: user.lastLoginAt,
      roles: user.roles?.map(role => this.toRoleResponse(role)) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Maps a User entity to a IUserWithAuthResponse DTO
   */
  static toAuthResponse(user: User, emailVerified: boolean = false): IUserWithAuthResponse {
    return {
      ...this.toBaseResponse(user, emailVerified),
      roles: user.roles?.map(role => this.toRoleResponse(role)) || [],
    };
  }
}
