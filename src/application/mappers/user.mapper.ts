import { User } from '@core/entities/user.entity';
import { Role } from '@core/entities/role.entity';
import { UserBaseResponse, UserDetailResponse, UserAuthResponse, UserRoleDetailResponse } from '@application/dtos';

export class UserMapper {
  /**
   * Maps a Role entity to a UserRoleDetailResponse DTO
   */
  static toRoleResponse(role: Role): UserRoleDetailResponse {
    return {
      id: role.id.getValue(),
      name: role.name,
      description: role.description,
      isDefault: role.isDefault,
    };
  }

  /**
   * Maps a User entity to a UserBaseResponse DTO
   */
  static toBaseResponse(user: User, emailVerified: boolean = false): UserBaseResponse {
    return {
      id: user.id.getValue(),
      email: user.email.getValue(),
      firstName: user.firstName.getValue(),
      lastName: user.lastName.getValue(),
      emailVerified,
    };
  }

  /**
   * Maps a User entity to a UserDetailResponse DTO
   */
  static toDetailResponse(user: User, emailVerified: boolean = false): UserDetailResponse {
    return {
      ...this.toBaseResponse(user, emailVerified),
      isActive: user.isActive,
      otpEnabled: user.otpEnabled,
      lastLoginAt: user.lastLoginAt,
      roles: user.roles?.map((role) => this.toRoleResponse(role)) || [],
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Maps a User entity to a UserAuthResponse DTO
   */
  static toAuthResponse(user: User, emailVerified: boolean = false): UserAuthResponse {
    return {
      ...this.toBaseResponse(user, emailVerified),
      roles: user.roles?.map((role) => this.toRoleResponse(role)) || [],
    };
  }
}
