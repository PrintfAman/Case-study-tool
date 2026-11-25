/**
 * SKELETON LINES - the loading state
 * ----------------------------------
 * While a request is in flight the panel keeps its exact height with grey
 * placeholder bars, so the page does not jump when data arrives. This is
 * deliberately not a spinner in the middle of an empty box: layout stability is
 * part of looking finished.
 *
 * The shimmer animation and colours come from `.skeleton` in app.css, which
 * reads `--tp-surf` / `--tp-surf-2` - no colours are chosen here.
 */

export interface SkeletonLinesProps {
  /** How many placeholder rows to draw. */
  rows?: number;
  /** Tailwind height utility per row, e.g. "h-3" or "h-8". */
  rowHeight?: string;
}

export function SkeletonLines({ rows = 5, rowHeight = 'h-3' }: SkeletonLinesProps) {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <div
          // The index is the only stable identity here - the rows are anonymous
          // placeholders, so an index key is correct.
          key={index}
          className={`skeleton w-full ${rowHeight}`}
          // Varying the width stops the placeholder looking like a printed block.
          style={{ width: `${70 + ((index * 7) % 30)}%` }}
        />
      ))}
    </div>
  );
}
