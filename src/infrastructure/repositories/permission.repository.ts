import { Injectable } from '@nestjs/common';
import { Permission } from '@core/entities/permission.entity';
import { IPermissionRepository } from '@core/repositories/permission.repository.interface';
import { PrismaService } from '@infrastructure/database/prisma/prisma.service';
import { Permission as PrismaPermission } from '@prisma/client';
import { ResourceAction, ActionType } from '@core/value-objects/resource-action.vo';
import { BaseRepository } from './base.repository';

@Injectable()
export class PermissionRepository
  extends BaseRepository<Permission>
  implements IPermissionRepository
{
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<Permission | null> {
    return this.executeWithErrorHandling('findById', async () => {
      const permissionRecord = await this.prisma.permission.findUnique({
        where: { id },
      });

      if (!permissionRecord) {
        return null;
      }

      return this.mapToModel(permissionRecord);
    });
  }

  async findByName(name: string): Promise<Permission | null> {
    return this.executeWithErrorHandling('findByName', async () => {
      const permissionRecord = await this.prisma.permission.findUnique({
        where: { name },
      });

      if (!permissionRecord) {
        return null;
      }

      return this.mapToModel(permissionRecord);
    });
  }

  async findAll(): Promise<Permission[]> {
    return this.executeWithErrorHandling('findAll', async () => {
      const permissionRecords = await this.prisma.permission.findMany();

      return permissionRecords.map(record => this.mapToModel(record));
    });
  }

  async findByResource(resource: string): Promise<Permission[]> {
    return this.executeWithErrorHandling('findByResource', async () => {
      const permissionRecords = await this.prisma.permission.findMany({
        where: { resource },
      });

      return permissionRecords.map(record => this.mapToModel(record));
    });
  }

  async create(permission: Permission): Promise<Permission> {
    return this.executeWithErrorHandling('create', async () => {
      const createdPermission = await this.prisma.permission.create({
        data: {
          id: permission.id.getValue(),
          name: permission.name.getValue(),
          description: permission.description,
          resource: permission.resourceAction.getResource(),
          action: permission.resourceAction.getAction(),
        },
      });

      return this.mapToModel(createdPermission);
    });
  }

  async update(permission: Permission): Promise<Permission> {
    return this.executeWithErrorHandling('update', async () => {
      const updatedPermission = await this.prisma.permission.update({
        where: { id: permission.id.getValue() },
        data: {
          name: permission.name.getValue(),
          description: permission.description,
          resource: permission.resourceAction.getResource(),
          action: permission.resourceAction.getAction(),
        },
      });

      return this.mapToModel(updatedPermission);
    });
  }

  async delete(id: string): Promise<boolean> {
    return this.executeWithErrorHandling(
      'delete',
      async () => {
        await this.prisma.permission.delete({
          where: { id },
        });

        return true;
      },
      false,
    );
  }

  private mapToModel(record: PrismaPermission): Permission {
    // Create value objects from primitive values
    const resourceAction = new ResourceAction(record.resource, record.action as ActionType);

    return Permission.fromData({
      id: record.id,
      resourceAction,
      description: record.description,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    });
  }
}
