import { Permission } from '@core/entities/permission.entity';
import { Role } from '@core/entities/role.entity';
import { User } from '@core/entities/user.entity';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { ActionType, ResourceAction } from '@core/value-objects/resource-action.vo';
import {
  Permission as PrismaPermission,
  Role as PrismaRole,
  RolePermission as PrismaRolePermission,
  User as PrismaUser,
  UserRole as PrismaUserRole,
} from '@generated/prisma/client';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from './base.repository';

// Define a type for User with its relations (roles with nested permissions)
type UserWithRelations = PrismaUser & {
  roles: (PrismaUserRole & {
    role: PrismaRole & {
      permissions: (PrismaRolePermission & {
        permission: PrismaPermission;
      })[];
    };
  })[];
};

@Injectable()
export class UserRepository extends BaseRepository<User> implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<User | null> {
    return this.executeWithErrorHandling('findById', async () => {
      const userRecord = await this.prisma.user.findUnique({
        where: { id },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!userRecord) {
        return null;
      }

      return this.mapToModel(userRecord as UserWithRelations);
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.executeWithErrorHandling('findByEmail', async () => {
      const userRecord = await this.prisma.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!userRecord) {
        return null;
      }

      return this.mapToModel(userRecord as UserWithRelations);
    });
  }

  async findAll(): Promise<User[]> {
    return this.executeWithErrorHandling('findAll', async () => {
      const userRecords = await this.prisma.user.findMany({
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return userRecords.map((record) => this.mapToModel(record as UserWithRelations));
    });
  }

  async findWithFilters(filters: {
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number }> {
    return this.executeWithErrorHandling('findWithFilters', async () => {
      const { search, limit = 20, offset = 0 } = filters;

      // Build where clause for search
      const where = search
        ? {
            OR: [
              { email: { contains: search, mode: 'insensitive' as const } },
              { firstName: { contains: search, mode: 'insensitive' as const } },
              { lastName: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      // Get total count
      const total = await this.prisma.user.count({ where });

      // Get users with pagination
      const userRecords = await this.prisma.user.findMany({
        where,
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      });

      const users = userRecords.map((record) => this.mapToModel(record as UserWithRelations));

      return { users, total };
    });
  }

  async findUsersByRoleId(roleId: string): Promise<User[]> {
    return this.executeWithErrorHandling('findUsersByRoleId', async () => {
      const userRecords = await this.prisma.user.findMany({
        where: {
          roles: {
            some: {
              roleId,
            },
          },
        },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return userRecords.map((record) => this.mapToModel(record as UserWithRelations));
    });
  }

  async create(user: User): Promise<User> {
    return this.executeWithErrorHandling('create', async () => {
      const createdUser = await this.prisma.user.create({
        data: {
          id: user.id.getValue(),
          email: user.email.getValue(),
          passwordHash: user.passwordHash,
          firstName: user.firstName.getValue(),
          lastName: user.lastName.getValue(),
          isActive: user.isActive,
          otpEnabled: user.otpEnabled,
          otpSecret: user.otpSecret,
          lastLoginAt: user.lastLoginAt,
          roles: {
            create: user.roles.map((role) => ({
              role: {
                connect: { id: role.id.getValue() },
              },
            })),
          },
        },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return this.mapToModel(createdUser as UserWithRelations);
    });
  }

  async update(user: User): Promise<User> {
    return this.executeWithErrorHandling('update', async () => {
      // First, delete all role associations to recreate them
      await this.prisma.userRole.deleteMany({
        where: {
          userId: user.id.getValue(),
        },
      });

      // Update the user with new role associations
      const updatedUser = await this.prisma.user.update({
        where: { id: user.id.getValue() },
        data: {
          email: user.email.getValue(),
          passwordHash: user.passwordHash,
          firstName: user.firstName.getValue(),
          lastName: user.lastName.getValue(),
          isActive: user.isActive,
          otpEnabled: user.otpEnabled,
          otpSecret: user.otpSecret,
          lastLoginAt: user.lastLoginAt,
          roles: {
            create: user.roles.map((role) => ({
              role: {
                connect: { id: role.id.getValue() },
              },
            })),
          },
        },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      return this.mapToModel(updatedUser as UserWithRelations);
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.executeWithErrorHandling(
      'delete',
      async () => {
        await this.prisma.user.delete({
          where: { id },
        });

        return true;
      },
      false,
    );
  }

  private mapToModel(record: UserWithRelations): User {
    // Map roles first
    const roles = record.roles.map((roleRelation) => {
      const roleRecord = roleRelation.role;

      // Map permissions
      const permissions =
        roleRecord.permissions?.map((permissionRelation) => {
          const permissionRecord = permissionRelation.permission;

          // Create the ResourceAction value object
          const resourceAction = new ResourceAction(permissionRecord.resource, permissionRecord.action as ActionType);

          return Permission.fromData({
            id: permissionRecord.id,
            resourceAction,
            description: permissionRecord.description,
            createdAt: permissionRecord.createdAt,
            updatedAt: permissionRecord.updatedAt,
          });
        }) || [];

      return Role.fromData({
        id: roleRecord.id,
        name: roleRecord.name,
        description: roleRecord.description,
        isDefault: roleRecord.isDefault,
        permissions,
        createdAt: roleRecord.createdAt,
        updatedAt: roleRecord.updatedAt,
      });
    });

    return User.fromData({
      id: record.id,
      email: record.email,
      passwordHash: record.passwordHash,
      firstName: record.firstName,
      lastName: record.lastName,
      isActive: record.isActive,
      otpEnabled: record.otpEnabled,
      otpSecret: record.otpSecret || undefined,
      roles,
      lastLoginAt: record.lastLoginAt || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
