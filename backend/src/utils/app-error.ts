import type { ApiErrorCode, ApiErrorDetail } from './api-response';

/**
 * THE ONE ERROR TYPE THE APP THROWS ON PURPOSE
 * --------------------------------------------
 * Some failures are expected: a project id that does not exist, a URL that is
 * not allowed, an expired token. Those are not bugs - they are normal outcomes
 * the API must report cleanly with the right HTTP status code.
 *
 * By throwing `AppError` we attach three things a plain `Error` cannot:
 *   - statusCode: what HTTP status the client should receive (404, 400, ...)
 *   - code:       the machine-readable ApiErrorCode the frontend switches on
 *   - details:    per-field explanations for form validation
 *
 * Anything that is NOT an AppError (a database driver blowing up, a TypeError)
 * reaches the error middleware as an "unknown" error: it is logged in full and
 * reported to the client as a generic 500, so internals never leak.
 */

export interface AppErrorOptions {
  /** HTTP status to send. Defaults to 400. */
  statusCode?: number;
  /** Machine-readable code. Defaults to 'BAD_REQUEST'. */
  code?: ApiErrorCode;
  /** Per-field context, e.g. [{ field: 'websiteUrl', message: '...' }] */
  details?: ApiErrorDetail[];
  /** The underlying error, kept for logging only. */
  cause?: unknown;
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ApiErrorCode;
  public readonly details: ApiErrorDetail[];

  constructor(message: string, options: AppErrorOptions = {}) {
    super(message, options.cause !== undefined ? { cause: options.cause } : undefined);

    this.name = 'AppError';
    this.statusCode = options.statusCode ?? 400;
    this.code = options.code ?? 'BAD_REQUEST';
    this.details = options.details ?? [];

    // Keeps stack traces clean: the frame that constructs the error is noise.
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, AppError);
    }
  }

  /** Convenience constructor for the most common case: something was not found. */
  static notFound(resource: string, details: ApiErrorDetail[] = []): AppError {
    return new AppError(`${resource} not found`, {
      statusCode: 404,
      code: 'NOT_FOUND',
      details,
    });
  }
}
