import client from './client';
import type { HealthStatus } from '../types';

export const healthApi = {
  get: () => client.get<HealthStatus>('/health'),
};
