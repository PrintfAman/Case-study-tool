import type { ReactNode } from 'react';

/**
 * ERROR NOTICE - the failure state
 * --------------------------------
 * Every panel that can fail uses this, so a database problem, a dead backend
 * and a rejected request all look like the same kind of event to the user:
 * a plate with a reason, optional per-field details, and a retry action.
 *
 * The `code` is shown on purpose. In a developer tool, "NETWORK_ERROR" tells you
 * more than "something went wrong", and it matches the code in the server logs
 * so the two can be compared directly.
 */

export interface ErrorNoticeProps {
  title: string;
  message: string;
  /** Machine-readable code, e.g. NETWORK_ERROR. */
  code?: string | null;
  /** Per-field reasons from a VALIDATION_ERROR response. */
  details?: { field?: string; message: string }[];
  /** Renders a retry button when provided. */
  onRetry?: () => void;
  /** Text for the retry button. */
  retryLabel?: string;
  children?: ReactNode;
}

export function ErrorNotice({
  title,
  message,
  code,
  details,
  onRetry,
  retryLabel = 'Retry',
  children,
}: ErrorNoticeProps) {
  return (
    <div className="notice notice--error" role="alert">
      <div className="flex flex-wrap items-center gap-2">
        <span className="notice__title">{title}</span>
        {code ? <span className="badge badge--accent">{code}</span> : null}
      </div>

      <p className="text-[14px]">{message}</p>

      {details && details.length > 0 ? (
        <ul className="plain-list">
          {details.map((detail, index) => (
            <li className="plain-list__item" key={`${detail.field ?? 'detail'}-${index}`}>
              <span className="plain-list__marker">›</span>
              <span>
                {detail.field ? <span className="mono">{detail.field}: </span> : null}
                {detail.message}
              </span>
            </li>
          ))}
        </ul>
      ) : null}

      {children}

      {onRetry ? (
        <div>
          <button type="button" className="btn" onClick={onRetry}>
            {retryLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}
