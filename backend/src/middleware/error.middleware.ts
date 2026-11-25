import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { errorResponse, type ApiErrorDetail } from '../utils/api-response';
import { AppError } from '../utils/app-error';
import { logger } from '../utils/logger';

/**
 * TWO MIDDLEWARE FUNCTIONS THAT CLOSE THE PIPELINE
 * ----------------------------------------------
 * 1. notFoundHandler - nothing matched a route. Runs AFTER every route.
 * 2. errorHandler    - something threw, anywhere. Runs when `next(err)` is
 *                      called or a handler throws. Express identifies it by its
 *                      four parameters (err, req, res, next) - keep all four.
 *
 * The point of centralising this: individual controllers never build error
 * responses. They just `throw new AppError(...)` and trust that this file turns
 * it into the standard envelope. One place to change, one place to get right.
 */

/**
 * Turns a Zod validation error into flat field/message pairs the frontend can
 * map onto form inputs.
 */
function zodIssuesToDetails(error: ZodError): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    field: issue.path.map(String).join('.') || undefined,
    message: issue.message,
  }));
}

/** Express 5 + body-parser mark malformed JSON with this shape. */
function isJsonParseError(error: unknown): boolean {
  return error instanceof SyntaxError && 'body' in error;
}

/** body-parser rejects oversized bodies before they reach our code. */
function isPayloadTooLargeError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'type' in error &&
    (error as { type?: unknown }).type === 'entity.too.large'
  );
}

/**
 * 404 for unknown routes. Sits after the routers, so it only runs when nothing
 * matched. Registered in app.ts, not in each router.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res
    .status(404)
    .json(
      errorResponse(
        'NOT_FOUND',
        `Route ${req.method} ${req.originalUrl} does not exist`,
        [{ message: 'Check the endpoint path and HTTP method' }],
      ),
    );
}

/**
 * The single exit point for every failure.
 *
 * Expected failures (AppError, ZodError, malformed JSON) are reported as-is.
 * Unexpected ones are logged with a full stack, then answered with a generic
 * 500 - never with internal details, which could leak queries or file paths.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  // If headers are already sent, Express must handle cleanup itself.
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof AppError) {
    logger.warn('Handled application error', {
      code: err.code,
      status: err.statusCode,
      message: err.message,
    });
    res.status(err.statusCode).json(errorResponse(err.code, err.message, err.details));
    return;
  }

  if (err instanceof ZodError) {
    const details = zodIssuesToDetails(err);
    logger.warn('Validation failed', { issueCount: details.length });
    res
      .status(400)
      .json(errorResponse('VALIDATION_ERROR', 'Request validation failed', details));
    return;
  }

  if (isJsonParseError(err)) {
    res
      .status(400)
      .json(
        errorResponse('VALIDATION_ERROR', 'Request body is not valid JSON', [
          { message: 'Send a well-formed JSON payload with Content-Type: application/json' },
        ]),
      );
    return;
  }

  if (isPayloadTooLargeError(err)) {
    res
      .status(413)
      .json(
        errorResponse('BAD_REQUEST', 'Request body is too large', [
          { message: 'Reduce the payload size and try again' },
        ]),
      );
    return;
  }

  // Unknown: a bug, not a client mistake. Log everything, reveal nothing.
  logger.error('Unhandled error', {
    message: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  const message = env.isProduction
    ? 'An unexpected error occurred'
    : err instanceof Error
      ? err.message
      : 'An unexpected error occurred';

  res.status(500).json(errorResponse('INTERNAL_ERROR', message));
}
