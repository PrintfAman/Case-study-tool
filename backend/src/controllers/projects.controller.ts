import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { database } from '../storage/database';
import { AppError } from '../utils/app-error';
import { successResponse } from '../utils/api-response';

const projectSchema = z.object({
  name: z.string().trim().min(2).max(120),
  websiteUrl: z.string().trim().url().refine((value) => ['http:', 'https:'].includes(new URL(value).protocol), 'Must use HTTP or HTTPS').nullable().optional(),
  githubUrl: z.string().trim().url().refine((value) => {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname.toLowerCase() === 'github.com' && url.pathname.split('/').filter(Boolean).length === 2;
  }, 'GitHub repository must use https://github.com/owner/repository').nullable().optional(),
}).superRefine((value, context) => {
  if (!value.websiteUrl && !value.githubUrl) {
    context.addIssue({ code: 'custom', message: 'Provide a website URL or a GitHub repository URL', path: ['websiteUrl'] });
  }
});

interface ProjectRow {
  id: string;
  name: string;
  website_url: string | null;
  github_url: string | null;
  status: string;
  input_json: string;
  created_at: string;
  updated_at: string;
}

function serializeProject(row: ProjectRow) {
  return {
    id: row.id,
    name: row.name,
    websiteUrl: row.website_url,
    githubUrl: row.github_url,
    status: row.status,
    input: JSON.parse(row.input_json) as unknown,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createProject(req: Request, res: Response): void {
  const input = projectSchema.parse(req.body);
  const id = randomUUID();
  const now = new Date().toISOString();
  database.prepare(`
    INSERT INTO projects (id, user_id, name, website_url, github_url, status, input_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, 'anonymous', input.name, input.websiteUrl ?? null, input.githubUrl ?? null, 'draft', JSON.stringify(input), now, now);
  const row = database.prepare('SELECT * FROM projects WHERE id = ?').get(id) as unknown as ProjectRow;
  res.status(201).json(successResponse(serializeProject(row), 'Project created'));
}

export function listProjects(_req: Request, res: Response): void {
  const rows = database.prepare(`
    SELECT * FROM projects WHERE user_id = 'anonymous' ORDER BY updated_at DESC
  `).all() as unknown as ProjectRow[];
  res.status(200).json(successResponse({ projects: rows.map(serializeProject) }, 'Projects retrieved'));
}

export function getProject(req: Request, res: Response): void {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const row = database.prepare("SELECT * FROM projects WHERE id = ? AND user_id = 'anonymous'").get(projectId) as unknown as ProjectRow | undefined;
  if (!row) throw AppError.notFound('Project');
  res.status(200).json(successResponse(serializeProject(row), 'Project retrieved'));
}

export function deleteProject(req: Request, res: Response): void {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const result = database.prepare("DELETE FROM projects WHERE id = ? AND user_id = 'anonymous'").run(projectId);
  if (result.changes === 0) throw AppError.notFound('Project');
  res.status(200).json(successResponse(null, 'Project deleted'));
}
