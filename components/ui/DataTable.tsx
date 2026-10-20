// Generic data table (shared UI per doc §7, used across admin). Real <table> — the
// taste inspector leaves real tables alone.

import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
}

export function DataTable<T>({
  columns,
  rows,
  keyOf,
  empty = "Nothing here yet.",
}: {
  columns: Column<T>[];
  rows: T[];
  keyOf: (row: T) => string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <p className="py-10 text-center font-serif text-muted">{empty}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse font-serif text-body">
        <thead>
          <tr className="border-b-2 border-ink/20 text-left">
            {columns.map((c) => (
              <th
                key={c.key}
                className={`py-3 pr-4 font-display text-small font-bold uppercase tracking-tight ${
                  c.align === "right" ? "text-right" : ""
                }`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={keyOf(row)} className="border-b border-ink/10 align-middle">
              {columns.map((c) => (
                <td
                  key={c.key}
                  className={`py-3 pr-4 ${c.align === "right" ? "text-right tnum" : ""}`}
                >
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
