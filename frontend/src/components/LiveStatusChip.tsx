import type { HealthRequestStatus } from '../hooks/useApiHealth';

/**
 * LIVE STATUS CHIP - the connection indicator in the nav
 * ------------------------------------------------------
 * It reports the state of the real health request, never a decorative light.
 * Three states, three truths:
 *   loading - a request is in flight (dot breathes)
 *   success - the API answered (steady dot)
 *   error   - the API did not answer or refused (dot uses --tp-acc-2, shakes once)
 *
 * `aria-live="polite"` means a screen reader announces the change from
 * "checking" to "API online" without stealing focus.
 */

const LABEL: Record<HealthRequestStatus, string> = {
  loading: 'Checking',
  success: 'API online',
  error: 'API offline',
};

const DOT_CLASS: Record<HealthRequestStatus, string> = {
  loading: 'status-dot status-dot--live',
  success: 'status-dot',
  error: 'status-dot status-dot--down',
};

export interface LiveStatusChipProps {
  status: HealthRequestStatus;
}

export function LiveStatusChip({ status }: LiveStatusChipProps) {
  return (
    <span className="status-chip" aria-live="polite">
      <span className={DOT_CLASS[status]} aria-hidden="true" />
      {LABEL[status]}
    </span>
  );
}
