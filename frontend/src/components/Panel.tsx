import type { ReactNode } from 'react';

/**
 * PANEL - the shell every dashboard tile uses
 * -------------------------------------------
 * A panel is a bordered plate with a small mono label, an optional title, an
 * optional actions slot, and content. Using one component for all tiles is what
 * makes the bento grid look deliberate instead of hand-assembled.
 *
 * `variant="hero"` inverts the plate (white background, black text) so the
 * primary tile reads first, which is the theme's bento pattern.
 *
 * `className` carries the grid span (bento__half, bento__wide, ...). Layout is
 * Tailwind's job; appearance is the CSS classes' job.
 */

export type PanelVariant = 'default' | 'hero';

export interface PanelProps {
  /** Small uppercase mono label, e.g. "BACKEND / API". */
  label: string;
  /** Optional larger title under the label. */
  title?: string;
  /** Right-aligned header content, e.g. a badge or button. */
  actions?: ReactNode;
  variant?: PanelVariant;
  /** Grid span class from app.css. */
  className?: string;
  /** Optional DOM ID for navigation targets and accessibility. */
  id?: string;
  children: ReactNode;
}

export function Panel({
  label,
  title,
  actions,
  variant = 'default',
  className,
  children,
  id,
}: PanelProps) {
  const panelClass = ['panel', variant === 'hero' ? 'panel--hero' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <section className={panelClass} id={id}>
      <header className="panel__header">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="micro-label">{label}</span>
          {title ? <h2 className="display text-[17px] leading-tight">{title}</h2> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
