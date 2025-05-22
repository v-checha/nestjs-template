// Health response interfaces

export interface IHealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
}

export interface IDatabaseHealthResponse {
  status: string;
  database: string;
  timestamp: string;
}

export interface IReadinessResponse {
  status: string;
  timestamp: string;
  checks: {
    database: string;
    config: string;
  };
}

export interface ILivenessResponse {
  status: string;
  timestamp: string;
  uptime: number;
}

export interface IHealthCheckDetail {
  name: string;
  status: 'ok' | 'error';
  message?: string;
  duration?: number;
}

export interface IComprehensiveHealthResponse {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  environment: string;
  version: string;
  checks: IHealthCheckDetail[];
}
