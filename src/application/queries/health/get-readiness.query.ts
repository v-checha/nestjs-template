import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { IReadinessResponse } from '@application/dtos/responses/health.response';
import { HealthService } from '@core/services/health.service';

export class GetReadinessQuery implements IQuery {}

@Injectable()
@QueryHandler(GetReadinessQuery)
export class GetReadinessQueryHandler implements IQueryHandler<GetReadinessQuery> {
  constructor(private readonly healthService: HealthService) {}

  async execute(): Promise<IReadinessResponse> {
    return this.healthService.getReadiness();
  }
}
