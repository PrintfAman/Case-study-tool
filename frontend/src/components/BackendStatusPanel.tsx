import type { ApiHealthState } from '../hooks/useApiHealth';
import { API_BASE_URL } from '../services/api-client';
import { formatClockTime, formatMegabytes, formatMilliseconds, formatUptime } from '../utils/format';
import { Badge } from './Badge';
import { ErrorNotice } from './ErrorNotice';
import { Panel } from './Panel';
import { SkeletonLines } from './SkeletonLines';
import { SpecList, type SpecItem } from './SpecList';

/**
 * BACKEND STATUS PANEL
 * --------------------
 * Proves the frontend/backend link with real numbers. Everything shown here
 * came from GET /api/v1/health a moment ago - nothing is hardcoded, and nothing
 * is invented when the request fails.
 *
 * The three render branches mirror the hook's three states exactly:
 *   loading -> skeleton (same height, no layout jump)
 *   error   -> ErrorNotice with the real error code and a retry
 *   success -> the report
 */

export interface BackendStatusPanelProps {
  health: ApiHealthState;
  className?: string;
}

export function BackendStatusPanel({ health, className }: BackendStatusPanelProps) {
  const { status, snapshot, errorMessage, errorCode, refetch } = health;

  const statusBadge =
    status === 'loading' ? (
      <Badge tone="muted">checking</Badge>
    ) : status === 'error' ? (
      <Badge tone="accent">offline</Badge>
    ) : snapshot?.report.status === 'degraded' ? (
      <Badge tone="accent">degraded</Badge>
    ) : (
      <Badge tone="solid">online</Badge>
    );

  return (
    <Panel
      label="backend / api"
      title="Runtime report"
      actions={statusBadge}
      className={className}
    >
      {status === 'loading' ? <SkeletonLines rows={6} /> : null}

      {status === 'error' ? (
        <ErrorNotice
          title="Health check failed"
          message={errorMessage ?? 'The API did not answer.'}
          code={errorCode}
          onRetry={refetch}
          retryLabel="Run again"
        />
      ) : null}

      {status === 'success' && snapshot ? (
        <BackendSpecs snapshot={snapshot} />
      ) : null}
    </Panel>
  );
}

/** The success branch, split out so the panel above stays readable. */
function BackendSpecs({ snapshot }: { snapshot: NonNullable<ApiHealthState['snapshot']> }) {
  const { report, latencyMs, checkedAt } = snapshot;

  const items: SpecItem[] = [
    { key: 'service', value: report.service },
    { key: 'version', value: `v${report.version}` },
    { key: 'environment', value: report.environment, emphasis: true },
    { key: 'node', value: report.nodeVersion },
    { key: 'uptime', value: formatUptime(report.uptimeSeconds) },
    { key: 'heap used', value: formatMegabytes(report.memory.heapUsedMb) },
    { key: 'round trip', value: formatMilliseconds(latencyMs), emphasis: true },
    { key: 'checked at', value: formatClockTime(checkedAt) },
    { key: 'endpoint', value: `${API_BASE_URL}/health` },
  ];

  return <SpecList items={items} />;
}
