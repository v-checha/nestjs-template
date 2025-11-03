import { PermissionResponse } from '@application/dtos';
import { IPermissionRepository } from '@core/repositories/permission.repository.interface';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PERMISSION_REPOSITORY } from '@shared/constants/tokens';

export class GetPermissionsQuery extends Query<PermissionResponse[]> {}

@Injectable()
@QueryHandler(GetPermissionsQuery)
export class GetPermissionsQueryHandler implements IQueryHandler<GetPermissionsQuery> {
  constructor(
    @Inject(PERMISSION_REPOSITORY)
    private readonly permissionRepository: IPermissionRepository,
  ) {}

  async execute() {
    const permissions = await this.permissionRepository.findAll();

    return permissions.map((permission) => PermissionResponse.fromEntity(permission));
  }
}
