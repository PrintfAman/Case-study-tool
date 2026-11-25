import type { ReactNode } from 'react';

/**
 * SPEC LIST - key/value spec rows
 * -------------------------------
 * The dashboard reports facts about the running system, and facts read best as
 * a table of label/value pairs. Rendered as a description list (<dl>) because
 * that is the semantically correct element for "term + description".
 *
 * The trailing value is deliberately `ReactNode`, not `string`, so callers can
 * drop a Badge in ("NOT CONFIGURED") without string juggling.
 */

export interface SpecItem {
  key: string;
  value: ReactNode;
  /** Renders the value in a more prominent weight. */
  emphasis?: boolean;
}

export interface SpecListProps {
  items: SpecItem[];
}

export function SpecList({ items }: SpecListProps) {
  return (
    <dl className="kv">
      {items.map((item) => (
        <div className="kv__row" key={item.key}>
          <dt className="kv__k">{item.key}</dt>
          <dd className={item.emphasis ? 'kv__v font-semibold' : 'kv__v'}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
