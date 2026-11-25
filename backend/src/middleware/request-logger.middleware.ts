import type { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

/**
 * REQUEST LOGGING
 * ---------------
 * Every request gets exactly one log line, written when the response FINISHES,
 * so the line can include the status code and how long the request took.
 *
 * Why log on 'finish' instead of before calling next()?
 * Because before next() we do not know the outcome yet - we would log
 * "GET /api/v1/projects" with no idea whether it took 4ms or 4 seconds, or
 * whether it succeeded. The 'finish' event fires once the response is flushed.
 *
 * This is also where a request id will be attached in a later phase, so a single
 * report generation can be followed across many log lines.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startedAt = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;

    const context = {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: Math.round(durationMs * 100) / 100,
    };

    // 5xx is a server fault, 4xx is a client mistake: different severity.
    if (res.statusCode >= 500) logger.error('Request failed', context);
    else if (res.statusCode >= 400) logger.warn('Request rejected', context);
    else logger.info('Request completed', context);
  });

  next();
}
