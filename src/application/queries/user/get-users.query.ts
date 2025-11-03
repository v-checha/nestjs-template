import { UserDetailResponse } from '@application/dtos';
import { UserMapper } from '@application/mappers/user.mapper';
import { IUserRepository } from '@core/repositories/user.repository.interface';
import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { USER_REPOSITORY } from '@shared/constants/tokens';

export interface IGetUsersResult {
  users: UserDetailResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GetUsersQuery extends Query<IGetUsersResult> {
  constructor(
    public readonly search?: string,
    public readonly page: number = 1,
    public readonly limit: number = 20,
  ) {
    super();
  }
}

@Injectable()
@QueryHandler(GetUsersQuery)
export class GetUsersQueryHandler implements IQueryHandler<GetUsersQuery> {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: GetUsersQuery) {
    const { search, page, limit } = query;
    const offset = (page - 1) * limit;

    const { users, total } = await this.userRepository.findWithFilters({
      search,
      limit,
      offset,
    });

    return {
      users: users.map((user) => UserMapper.toDetailResponse(user)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
