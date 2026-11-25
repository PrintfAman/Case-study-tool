import { env } from '../config/env';

/**
 * A tiny logger instead of a library.
 *
 * Why not `console.log` everywhere? Because in production you want machine-
 * parseable JSON (so a log platform can search it), while in development you
 * want short, readable lines. One place decides that, and every module calls
 * `logger.info(...)` - so if we later swap in Pino or Winston, we change one file.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Numeric weight per level, so we can filter debug logs out of production. */
const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

/** Minimum level that actually gets printed. */
const MIN_LEVEL: LogLevel = env.isProduction ? 'info' : 'debug';

/** Extra fields to attach to a log line (request id, project id, duration...). */
type LogContext = Record<string, unknown>;

function isEnabled(level: LogLevel): boolean {
  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[MIN_LEVEL];
}

function write(level: LogLevel, message: string, context?: LogContext): void {
  if (!isEnabled(level)) return;

  const timestamp = new Date().toISOString();

  if (env.isProduction) {
    // Production: one JSON object per line.
    const line = JSON.stringify({ timestamp, level, message, ...context });
    if (level === 'error') console.error(line);
    else if (level === 'warn') console.warn(line);
    else console.log(line);
    return;
  }

  // Development: readable single line, with context appended when present.
  const suffix = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';
  const text = `${timestamp} [${level.toUpperCase().padEnd(5)}] ${message}${suffix}`;
  if (level === 'error') console.error(text);
  else if (level === 'warn') console.warn(text);
  else console.log(text);
}

export const logger = {
  debug: (message: string, context?: LogContext) => write('debug', message, context),
  info: (message: string, context?: LogContext) => write('info', message, context),
  warn: (message: string, context?: LogContext) => write('warn', message, context),
  error: (message: string, context?: LogContext) => write('error', message, context),
};
