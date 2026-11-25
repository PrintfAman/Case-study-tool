import { Router } from 'express';
import { getCaseStudy, runAnalysis } from '../controllers/analysis.controller';

export const analysisRouter = Router();

analysisRouter.post('/projects/:id/analyze', runAnalysis);
analysisRouter.get('/projects/:id/case-study', getCaseStudy);
