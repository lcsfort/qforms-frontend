"use client";

import type { ReactNode } from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  empty?: boolean;
  emptyLabel?: string;
}

export function ChartCard({
  title,
  subtitle,
  actions,
  children,
  empty = false,
  emptyLabel,
}: ChartCardProps) {
  return (
    <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4 md:p-5">
      <header className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-base">{title}</h3>
          {subtitle ? <p className="text-xs text-[var(--muted)] mt-1">{subtitle}</p> : null}
        </div>
        {actions}
      </header>
      {empty ? (
        <div className="h-48 rounded-xl border border-dashed border-[var(--border)] flex items-center justify-center text-sm text-[var(--muted)]">
          {emptyLabel}
        </div>
      ) : (
        children
      )}
    </section>
  );
}

