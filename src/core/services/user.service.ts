import * as bcrypt from 'bcrypt';
import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY, ROLE_REPOSITORY } from '@shared/constants/tokens';
import { User } from '../entities/user.entity';
import { IUserRepository } from '../repositories/user.repository.interface';
import { IRoleRepository } from '../repositories/role.repository.interface';
import {
  EntityNotFoundException,
  EntityAlreadyExistsException,
  AuthenticationException,
  ForbiddenActionException,
} from '@core/exceptions/domain-exceptions';
import { Email } from '@core/value-objects/email.vo';
import { Password } from '@core/value-objects/password.vo';
import { FirstName, LastName } from '@core/value-objects/name.vo';
import { RoleId } from '@core/value-objects/role-id.vo';
import { UserAuthorizationService } from './user-authorization.service';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
    private readonly userAuthorizationService: UserAuthorizationService,
  ) {}

  async createUser(emailStr: string, passwordStr: string, firstName: string, lastName: string): Promise<User> {
    // Validate email using value object
    const email = new Email(emailStr);

    // Validate password using value object
    const password = new Password(passwordStr);

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email.getValue());
    if (existingUser) {
      throw new EntityAlreadyExistsException('User', 'email');
    }

    // Hash the password
    const passwordHash = await this.hashPassword(password.getValue());

    // Create a new user with value objects for name
    const user = User.create(email, passwordHash, new FirstName(firstName), new LastName(lastName));

    // Assign default role
    const defaultRole = await this.roleRepository.findDefaultRole();
    if (defaultRole) {
      user.addRole(defaultRole);
    }

    // Save the user
    return this.userRepository.create(user);
  }

  async validateCredentials(emailStr: string, passwordStr: string): Promise<User | null> {
    try {
      // Validate email format
      const email = new Email(emailStr);

      const user = await this.userRepository.findByEmail(email.getValue());
      if (!user || !user.isActive) {
        return null;
      }

      const isPasswordValid = await this.comparePasswords(passwordStr, user.passwordHash);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      if (error instanceof EntityNotFoundException) {
        // Handle user not found error
        return null;
      }

      // If email is invalid, return null instead of throwing
      return null;
    }
  }

  async updateUserDetails(
    userId: string,
    firstName?: string,
    lastName?: string,
    emailStr?: string,
    roleIds?: string[],
    isActive?: boolean,
  ): Promise<User> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    // Update profile with new names if provided
    user.updateProfile(firstName ? new FirstName(firstName) : undefined, lastName ? new LastName(lastName) : undefined);

    if (emailStr) {
      // Validate email using value object
      const email = new Email(emailStr);

      // Check if email is already in use by another user
      const existingUser = await this.userRepository.findByEmail(email.getValue());
      // If the email is already in use, check if it's the same user
      if (existingUser && existingUser.id.getValue() !== userId) {
        throw new EntityAlreadyExistsException('User', 'email');
      }

      user.changeEmail(email);
    }

    // Handle role updates
    if (roleIds !== undefined) {
      // Get current role IDs
      const currentRoleIds = user.roles.map((role) => role.id.getValue());
      const newRoleIds = [...new Set(roleIds)]; // Remove duplicates

      // Remove roles that are no longer selected
      for (const currentRoleId of currentRoleIds) {
        if (!newRoleIds.includes(currentRoleId)) {
          user.removeRole(RoleId.fromString(currentRoleId));
        }
      }

      // Add new roles that weren't previously assigned
      for (const roleIdStr of newRoleIds) {
        if (!currentRoleIds.includes(roleIdStr)) {
          const role = await this.roleRepository.findById(roleIdStr);
          if (!role) {
            throw new EntityNotFoundException('Role', roleIdStr);
          }
          user.addRole(role);
        }
      }
    }

    // Handle activation status update
    if (isActive !== undefined) {
      if (isActive) {
        user.activate();
      } else {
        user.deactivate();
      }
    }

    // Entity handles updating timestamps

    return this.userRepository.update(user);
  }

  async verifyCurrentPassword(userId: string, currentPassword: string): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    return this.comparePasswords(currentPassword, user.passwordHash);
  }

  async changePassword(userId: string, newPasswordStr: string, currentPassword?: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    // If current password is provided, verify it
    if (currentPassword) {
      const isCurrentPasswordValid = await this.comparePasswords(currentPassword, user.passwordHash);

      if (!isCurrentPasswordValid) {
        throw new AuthenticationException('Current password is incorrect');
      }
    }

    // Validate new password using value object (includes complexity validation)
    const newPassword = new Password(newPasswordStr);

    user.changePassword(await this.hashPassword(newPassword.getValue()));
    // Entity handles updating timestamps

    return this.userRepository.update(user);
  }

  async assignRoleToUser(userId: string, roleId: string, assignerId?: string): Promise<User> {
    const targetUser = await this.userRepository.findById(userId);
    if (!targetUser) {
      throw new EntityNotFoundException('User', userId);
    }

    const role = await this.roleRepository.findById(roleId);
    if (!role) {
      throw new EntityNotFoundException('Role', roleId);
    }

    // If assignerId is provided, check authorization
    if (assignerId) {
      const assignerUser = await this.userRepository.findById(assignerId);
      if (!assignerUser) {
        throw new EntityNotFoundException('User', assignerId);
      }

      // Check if the assigner can assign this role
      if (!this.userAuthorizationService.canAssignRole(assignerUser, targetUser, role)) {
        throw new ForbiddenActionException('You are not authorized to assign this role');
      }
    }

    // Role assignment validation is handled by the User entity's addRole method
    targetUser.addRole(role);

    return this.userRepository.update(targetUser);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    user.removeRole(RoleId.fromString(roleId));

    return this.userRepository.update(user);
  }

  async activateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    user.activate();

    return this.userRepository.update(user);
  }

  async deactivateUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    user.deactivate();

    return this.userRepository.update(user);
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new EntityNotFoundException('User', userId);
    }

    return user;
  }

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);

    return bcrypt.hash(password, salt);
  }

  private async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
