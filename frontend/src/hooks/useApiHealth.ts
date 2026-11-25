import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../services/api-client';
import { fetchHealth } from '../services/health-api';
import type { HealthSnapshot } from '../types/health';

/**
 * useApiHealth - the frontend/backend handshake, in one hook
 * ----------------------------------------------------------
 * WHAT IT DOES
 *   1. On mount, calls GET /api/v1/health.
 *   2. Times the round trip in the browser (the server cannot know this).
 *   3. Exposes status / data / error so the UI renders three distinct states.
 *   4. Exposes `refetch` so a button can re-run the whole thing.
 *
 * WHY A HOOK INSTEAD OF FETCHING INSIDE THE COMPONENT
 *   A component that both fetches and renders is hard to read and impossible to
 *   reuse. Components (in Phase 2+) will call project/analysis hooks the same
 *   way. The hook owns async lifecycle; the component owns pixels.
 *
 * THREE DETAILS THAT MATTER AND THAT BEGINNERS USUALLY MISS
 *
 *   1. AbortController. React 18+ StrictMode runs effects twice in development
 *      to surface bugs. Without aborting, the first, stale request would race
 *      the second and can win, showing old data. We abort the previous request
 *      before starting a new one, and on unmount.
 *
 *   2. The `unmountedRef` guard. Even an aborted request can resolve its
 *      `.then` before the abort lands; setting state on an unmounted component
 *      is a leak warning. The ref makes that impossible.
 *
 *   3. The error caught here is an ApiRequestError (see api-client.ts), which
 *      carries a machine-readable `code`. The UI can therefore distinguish
 *      "backend not running" from "backend returned a 500" and say something
 *      useful instead of "something went wrong".
 */

export type HealthRequestStatus = 'loading' | 'success' | 'error';

export interface ApiHealthState {
  status: HealthRequestStatus;
  /** Present only when status is 'success'. */
  snapshot: HealthSnapshot | null;
  /** Human-readable failure reason, present only on 'error'. */
  errorMessage: string | null;
  /** Machine-readable failure code, e.g. NETWORK_ERROR. */
  errorCode: string | null;
  /** Re-runs the check now. Safe to call while a check is running. */
  refetch: () => void;
}

interface InternalState {
  status: HealthRequestStatus;
  snapshot: HealthSnapshot | null;
  errorMessage: string | null;
  errorCode: string | null;
}

const INITIAL_STATE: InternalState = {
  status: 'loading',
  snapshot: null,
  errorMessage: null,
  errorCode: null,
};

function describeError(error: unknown): { message: string; code: string } {
  if (error instanceof ApiRequestError) {
    return { message: error.message, code: error.code };
  }

  return {
    message: error instanceof Error ? error.message : 'Unexpected error while contacting the API.',
    code: 'UNKNOWN_ERROR',
  };
}

export function useApiHealth(): ApiHealthState {
  const [state, setState] = useState<InternalState>(INITIAL_STATE);

  /**
   * Holds the controller of the in-flight request so the next call can cancel
   * it. A ref (not state) because changing it must not re-render.
   */
  const inFlightRef = useRef<AbortController | null>(null);

  /** True once the component is unmounted, so late responses are ignored. */
  const unmountedRef = useRef(false);

  const runCheck = useCallback(() => {
    inFlightRef.current?.abort();

    const controller = new AbortController();
    inFlightRef.current = controller;

    setState((previous) => ({
      ...previous,
      status: 'loading',
      errorMessage: null,
      errorCode: null,
    }));

    const startedAt = performance.now();

    fetchHealth(controller.signal)
      .then((report) => {
        if (unmountedRef.current || controller.signal.aborted) return;

        const latencyMs = Math.round(performance.now() - startedAt);

        setState({
          status: 'success',
          snapshot: { report, latencyMs, checkedAt: new Date() },
          errorMessage: null,
          errorCode: null,
        });
      })
      .catch((error: unknown) => {
        if (unmountedRef.current || controller.signal.aborted) return;

        const { message, code } = describeError(error);

        setState({
          status: 'error',
          // Keep the last good snapshot? No - a failed check means we no longer
          // know the server state, so the UI must not show stale "ONLINE".
          snapshot: null,
          errorMessage: message,
          errorCode: code,
        });
      });
  }, []);

  useEffect(() => {
    unmountedRef.current = false;
    runCheck();

    return () => {
      unmountedRef.current = true;
      inFlightRef.current?.abort();
    };
  }, [runCheck]);

  return {
    status: state.status,
    snapshot: state.snapshot,
    errorMessage: state.errorMessage,
    errorCode: state.errorCode,
    refetch: runCheck,
  };
}
