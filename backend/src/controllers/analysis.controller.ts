import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { database } from '../storage/database';
import { AppError } from '../utils/app-error';
import { successResponse } from '../utils/api-response';
import { analyzeGitHubRepository } from '../services/github-analyzer.service';
import { crawlWebsite } from '../services/website-crawler.service';
import { synthesizeCaseStudy } from '../services/case-study.service';

interface ProjectRow {
  id: string;
  name: string;
  website_url: string | null;
  github_url: string | null;
}

export async function runAnalysis(req: Request, res: Response): Promise<void> {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = database.prepare("SELECT id, name, website_url, github_url FROM projects WHERE id = ? AND user_id = 'anonymous'").get(projectId) as unknown as ProjectRow | undefined;
  if (!project) throw AppError.notFound('Project');

  database.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?').run('analyzing', new Date().toISOString(), project.id);

  let website: unknown | null = null;
  let github: unknown | null = null;
  const sourceWarnings: string[] = [];

  if (project.website_url) {
    try {
      website = await crawlWebsite(project.website_url, 6);
    } catch (error) {
      sourceWarnings.push(`Website analysis unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  if (project.github_url) {
    try {
      github = await analyzeGitHubRepository(project.github_url);
    } catch (error) {
      sourceWarnings.push(`GitHub analysis unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  const content = await synthesizeCaseStudy({
    project: { name: project.name, websiteUrl: project.website_url, githubUrl: project.github_url },
    website,
    github,
  });

  const id = randomUUID();
  const now = new Date().toISOString();
  database.prepare(`
    INSERT INTO case_studies (id, project_id, status, content_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(project_id) DO UPDATE SET
      status = excluded.status,
      content_json = excluded.content_json,
      updated_at = excluded.updated_at
  `).run(id, project.id, 'completed', JSON.stringify({ ...content, evidence: { website, github }, sourceWarnings }), now, now);
  database.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?').run(sourceWarnings.length > 0 ? 'completed_with_warnings' : 'completed', now, project.id);

  const stored = database.prepare('SELECT content_json FROM case_studies WHERE project_id = ?').get(project.id) as unknown as { content_json: string };
  res.status(200).json(successResponse({ projectId: project.id, status: 'completed', content: JSON.parse(stored.content_json) as Record<string, unknown> }, 'Analysis completed'));
}

export function getCaseStudy(req: Request, res: Response): void {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const row = database.prepare(`
    SELECT c.* FROM case_studies c
    JOIN projects p ON p.id = c.project_id
    WHERE c.project_id = ? AND p.user_id = 'anonymous'
  `).get(projectId) as unknown as { content_json: string; status: string; created_at: string; updated_at: string } | undefined;
  if (!row) throw AppError.notFound('Case study');
  res.status(200).json(successResponse({ status: row.status, content: JSON.parse(row.content_json), createdAt: row.created_at, updatedAt: row.updated_at }, 'Case study retrieved'));
}
