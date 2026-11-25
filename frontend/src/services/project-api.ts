import type { CreateProjectInput, Project } from '../types/projects';
import { apiRequest } from './api-client';

export function createProject(input: CreateProjectInput): Promise<Project> {
  return apiRequest<Project>('/projects/', { method: 'POST', body: input });
}

export function listProjects(): Promise<{ projects: Project[] }> {
  return apiRequest<{ projects: Project[] }>('/projects/');
}

export function getProject(id: string): Promise<Project> {
  return apiRequest<Project>(`/projects/${encodeURIComponent(id)}`);
}

export function deleteProject(id: string): Promise<null> {
  return apiRequest<null>(`/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export function runProjectAnalysis(id: string): Promise<{ projectId: string; status: string; content: Record<string, unknown> }> {
  return apiRequest<{ projectId: string; status: string; content: Record<string, unknown> }>(`/analysis/projects/${encodeURIComponent(id)}/analyze`, { method: 'POST' });
}

export function getProjectCaseStudy(id: string): Promise<{ status: string; content: Record<string, unknown>; createdAt: string; updatedAt: string }> {
  return apiRequest<{ status: string; content: Record<string, unknown>; createdAt: string; updatedAt: string }>(`/analysis/projects/${encodeURIComponent(id)}/case-study`);
}

export function generateProjectReport(id: string): Promise<{ fileName: string; downloadUrl: string }> {
  return apiRequest<{ fileName: string; downloadUrl: string }>(`/reports/projects/${encodeURIComponent(id)}/report`, { method: 'POST' });
}
