import { Router } from 'express';
import { downloadReport, generateReport } from '../controllers/reports.controller';

export const reportsRouter = Router();

reportsRouter.post('/projects/:id/report', generateReport);
reportsRouter.get('/projects/:id/report/download/:fileName', downloadReport);
