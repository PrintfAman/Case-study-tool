import type { ReactNode } from 'react';

/**
 * BADGE - compact status word in mono caps
 * ----------------------------------------
 * Four tones, all mapped to theme tokens:
 *   outline - default, white stroke on the plate
 *   solid   - inverted (used for "ACTIVE"/"ONLINE")
 *   muted   - dashed-ish quiet state for "NOT CONFIGURED" / "PENDING"
 *   accent  - reads --tp-acc-2, the theme's hue-shifted secondary
 */

export type BadgeTone = 'outline' | 'solid' | 'muted' | 'accent';

const TONE_CLASS: Record<BadgeTone, string> = {
  outline: 'badge',
  solid: 'badge badge--solid',
  muted: 'badge badge--muted',
  accent: 'badge badge--accent',
};

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

export function Badge({ tone = 'outline', children }: BadgeProps) {
  return <span className={TONE_CLASS[tone]}>{children}</span>;
}
