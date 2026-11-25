import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Request, Response } from 'express';
import { database } from '../storage/database';
import { AppError } from '../utils/app-error';
import { successResponse } from '../utils/api-response';
import { env } from '../config/env';
import { createPdfReport } from '../services/pdf-report.service';

export async function generateReport(req: Request, res: Response): Promise<void> {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const project = database.prepare(`
    SELECT p.id, p.name, c.content_json
    FROM projects p
    LEFT JOIN case_studies c ON c.project_id = p.id
    WHERE p.id = ? AND p.user_id = 'anonymous'
  `).get(projectId) as unknown as { id: string; name: string; content_json: string | null } | undefined;
  if (!project) throw AppError.notFound('Project');
  if (!project.content_json) throw new AppError('Generate the case study before creating a PDF', { statusCode: 409, code: 'CONFLICT' });

  const content = JSON.parse(project.content_json) as Record<string, unknown>;
  const report = await createPdfReport(project.name, content);
  res.status(201).json(successResponse({ fileName: report.fileName, downloadUrl: `/api/v1/reports/projects/${project.id}/report/download/${report.fileName}` }, 'PDF report generated'));
}

export function downloadReport(req: Request, res: Response): void {
  const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const fileName = Array.isArray(req.params.fileName) ? req.params.fileName[0] : req.params.fileName;
  if (!/^[a-z0-9-]+\.pdf$/i.test(fileName)) throw new AppError('Invalid report file name', { statusCode: 400, code: 'BAD_REQUEST' });

  const ownsProject = database.prepare("SELECT id FROM projects WHERE id = ? AND user_id = 'anonymous'").get(projectId);
  if (!ownsProject) throw AppError.notFound('Project');

  const fullPath = resolve(process.cwd(), env.REPORT_STORAGE_DIR, fileName);
  try {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(readFileSync(fullPath));
  } catch {
    throw AppError.notFound('Report');
  }
}
