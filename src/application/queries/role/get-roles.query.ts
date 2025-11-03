import { RoleDetailResponse } from '@application/dtos';
import { RoleMapper } from '@application/mappers/role.mapper';
import { IRoleRepository } from '@core/repositories/role.repository.interface';
import { Inject } from '@nestjs/common';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { ROLE_REPOSITORY } from '@shared/constants/tokens';

export class GetRolesQuery extends Query<RoleDetailResponse[]> {}

@QueryHandler(GetRolesQuery)
export class GetRolesQueryHandler implements IQueryHandler<GetRolesQuery> {
  constructor(
    @Inject(ROLE_REPOSITORY)
    private readonly roleRepository: IRoleRepository,
  ) {}

  async execute() {
    const roles = await this.roleRepository.findAll();

    // Use the mapper to convert each role to response DTO
    return roles.map((role) => RoleMapper.toDetailResponse(role));
  }
}
