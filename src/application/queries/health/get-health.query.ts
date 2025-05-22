import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { IHealthResponse } from '@application/dtos/responses/health.response';
import { HealthService } from '@core/services/health.service';

export class GetHealthQuery implements IQuery {}

@Injectable()
@QueryHandler(GetHealthQuery)
export class GetHealthQueryHandler implements IQueryHandler<GetHealthQuery> {
  constructor(private readonly healthService: HealthService) {}

  async execute(): Promise<IHealthResponse> {
    return this.healthService.getHealth();
  }
}
