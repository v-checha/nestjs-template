import { PrismaClient } from '@generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import { ActionType, ResourceType } from '../src/core/value-objects/resource-action.vo';

// Roles
const roles = [
  {
    name: 'admin',
    description: 'Administrator role with full access',
    isDefault: false,
  },
  {
    name: 'user',
    description: 'Default user role with limited access',
    isDefault: true,
  },
];

// Permissions
const permissions = [
  {
    name: 'user:read',
    description: 'Can read user information',
    resource: ResourceType.USER,
    action: ActionType.READ,
  },
  {
    name: 'user:create',
    description: 'Can create users',
    resource: ResourceType.USER,
    action: ActionType.CREATE,
  },
  {
    name: 'user:update',
    description: 'Can update user information',
    resource: ResourceType.USER,
    action: ActionType.UPDATE,
  },
  {
    name: 'user:delete',
    description: 'Can delete users',
    resource: ResourceType.USER,
    action: ActionType.DELETE,
  },
  {
    name: 'role:read',
    description: 'Can read role information',
    resource: ResourceType.ROLE,
    action: ActionType.READ,
  },
  {
    name: 'role:create',
    description: 'Can create roles',
    resource: ResourceType.ROLE,
    action: ActionType.CREATE,
  },
  {
    name: 'role:update',
    description: 'Can update roles',
    resource: ResourceType.ROLE,
    action: ActionType.UPDATE,
  },
  {
    name: 'role:delete',
    description: 'Can delete roles',
    resource: ResourceType.ROLE,
    action: ActionType.DELETE,
  },
  {
    name: 'storage:create',
    description: 'Can upload files',
    resource: ResourceType.STORAGE,
    action: ActionType.CREATE,
  },
  {
    name: 'storage:read',
    description: 'Can read file information',
    resource: ResourceType.STORAGE,
    action: ActionType.READ,
  },
  {
    name: 'storage:update',
    description: 'Can update file information',
    resource: ResourceType.STORAGE,
    action: ActionType.UPDATE,
  },
  {
    name: 'storage:delete',
    description: 'Can delete files',
    resource: ResourceType.STORAGE,
    action: ActionType.DELETE,
  },
  {
    name: 'audit:read',
    description: 'Can read audit logs',
    resource: ResourceType.AUDIT,
    action: ActionType.READ,
  },
];

// Map of role names to permissions they should have
const rolePermissionsMap = {
  admin: [
    'user:read',
    'user:create',
    'user:update',
    'user:delete',
    'role:read',
    'role:create',
    'role:update',
    'role:delete',
    'storage:create',
    'storage:read',
    'storage:update',
    'storage:delete',
    'audit:read',
  ],
  user: ['user:read', 'storage:create', 'storage:read', 'storage:update'],
};

// Default admin user
const adminUser = {
  email: 'admin@example.com',
  firstName: 'Admin',
  lastName: 'User',
  password: 'Admin@123', // This will be hashed before saving
};

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

const connectionString = `${process.env.DATABASE_URL}`;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');

  // Create roles
  console.log('Creating roles...');
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // Create permissions
  console.log('Creating permissions...');
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { name: permission.name },
      update: {},
      create: permission,
    });
  }

  // Assign permissions to roles
  console.log('Assigning permissions to roles...');
  for (const [roleName, permissionNames] of Object.entries(rolePermissionsMap)) {
    const role = await prisma.role.findUnique({
      where: { name: roleName },
    });

    if (!role) {
      console.error(`Role ${roleName} not found`);
      continue;
    }

    for (const permissionName of permissionNames) {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (!permission) {
        console.error(`Permission ${permissionName} not found`);
        continue;
      }

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  // Create admin user
  console.log('Creating admin user...');
  const hashedPassword = await hashPassword(adminUser.password);

  const user = await prisma.user.upsert({
    where: { email: adminUser.email },
    update: {},
    create: {
      email: adminUser.email,
      passwordHash: hashedPassword,
      firstName: adminUser.firstName,
      lastName: adminUser.lastName,
    },
  });

  // Assign admin role to admin user
  console.log('Assigning admin role to admin user...');
  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
  });

  if (adminRole) {
    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: user.id,
          roleId: adminRole.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
