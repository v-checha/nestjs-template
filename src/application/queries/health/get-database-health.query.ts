import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { IDatabaseHealthResponse } from '@application/dtos/responses/health.response';
import { HealthService } from '@core/services/health.service';

export class GetDatabaseHealthQuery implements IQuery {}

@Injectable()
@QueryHandler(GetDatabaseHealthQuery)
export class GetDatabaseHealthQueryHandler implements IQueryHandler<GetDatabaseHealthQuery> {
  constructor(private readonly healthService: HealthService) {}

  async execute(): Promise<IDatabaseHealthResponse> {
    return this.healthService.getDatabaseHealth();
  }
}
