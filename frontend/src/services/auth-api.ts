import type { AuthUser } from '../types/auth';
import { apiRequest } from './api-client';

export function register(input: { name: string; email: string; password: string }): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/register', { method: 'POST', body: input });
}

export function login(input: { email: string; password: string }): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/login', { method: 'POST', body: input });
}

export function getCurrentUser(): Promise<AuthUser> {
  return apiRequest<AuthUser>('/auth/me');
}

export function logout(): Promise<null> {
  return apiRequest<null>('/auth/logout', { method: 'POST' });
}
