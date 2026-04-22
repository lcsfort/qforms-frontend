"use client";

import type { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  eyebrow?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
}

export function SectionCard({
  title,
  description,
  eyebrow,
  trailing,
  children,
}: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[0_1px_0_0_rgba(0,0,0,0.02)] dark:shadow-none">
      <header className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
              {eyebrow}
            </div>
          )}
          <h3 className="text-[15px] font-semibold text-[var(--foreground)] leading-tight">
            {title}
          </h3>
          {description && (
            <p className="mt-1 text-xs text-[var(--muted)] leading-relaxed max-w-prose">
              {description}
            </p>
          )}
        </div>
        {trailing && <div className="shrink-0">{trailing}</div>}
      </header>
      <div className="h-px bg-[var(--border)]/70" aria-hidden />
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

/**
 * Smoothly reveals children vertically using CSS grid height interpolation —
 * no layout jank, no animation library.
 */
export function CollapseReveal({
  open,
  children,
}: {
  open: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
        open
          ? "grid-rows-[1fr] opacity-100"
          : "grid-rows-[0fr] opacity-0"
      }`}
      aria-hidden={!open}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
    </div>
  );
}
