import type { HealthReport } from '../types/health';
import { apiRequest } from './api-client';

/**
 * HEALTH API
 * ----------
 * A thin, typed wrapper over GET /api/v1/health. It exists so components never
 * contain a URL string: the endpoint lives with the rest of the API surface.
 *
 * In Phase 2 this file grows: createProject, listProjects, getProject, ...
 * all following the same shape.
 */
export function fetchHealth(signal?: AbortSignal): Promise<HealthReport> {
  return apiRequest<HealthReport>('/health', { signal });
}
