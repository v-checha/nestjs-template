import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { ILivenessResponse } from '@application/dtos/responses/health.response';
import { HealthService } from '@core/services/health.service';

export class GetLivenessQuery implements IQuery {}

@Injectable()
@QueryHandler(GetLivenessQuery)
export class GetLivenessQueryHandler implements IQueryHandler<GetLivenessQuery> {
  constructor(private readonly healthService: HealthService) {}

  async execute(): Promise<ILivenessResponse> {
    return this.healthService.getLiveness();
  }
}
