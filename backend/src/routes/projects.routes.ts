import { Router } from 'express';
import { createProject, deleteProject, getProject, listProjects } from '../controllers/projects.controller';

export const projectsRouter = Router();

projectsRouter.post('/', createProject);
projectsRouter.get('/', listProjects);
projectsRouter.get('/:id', getProject);
projectsRouter.delete('/:id', deleteProject);
