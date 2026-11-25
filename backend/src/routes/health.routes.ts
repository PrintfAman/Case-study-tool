import { Router } from 'express';
import { getHealth } from '../controllers/health.controller';

/**
 * ROUTES = THE URL MAP
 * --------------------
 * A router only says "this method + this path runs this controller". No business
 * logic, no database access. When you want to know what URLs exist, you read the
 * routes folder and nothing else.
 *
 * The path here is '/' because the mount path is decided by the parent router
 * (see routes/index.ts) - this keeps the router reusable at any prefix.
 */
export const healthRouter = Router();

healthRouter.get('/', getHealth);
