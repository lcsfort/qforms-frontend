"use client";

import { useId } from "react";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  srOnlyLabel?: string;
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  srOnlyLabel,
}: ToggleProps) {
  const descId = useId();

  const trackClass = checked
    ? "border border-[var(--primary)] bg-[var(--primary)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]"
    : disabled
      ? "border border-neutral-400/70 bg-neutral-200 dark:border-neutral-500 dark:bg-neutral-700"
      : "border border-neutral-400/90 bg-neutral-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)] dark:border-neutral-500 dark:bg-neutral-600 dark:shadow-[inset_0_1px_2px_rgba(0,0,0,0.35)]";

  const thumbClass = checked
    ? "translate-x-5 border border-white/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.22),0_0_0_1px_rgba(0,0,0,0.06)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.45),0_0_0_1px_rgba(255,255,255,0.08)]"
    : "translate-x-0 border border-neutral-300/90 bg-white shadow-[0_1px_4px_rgba(0,0,0,0.18),0_0_0_1px_rgba(0,0,0,0.05)] dark:border-neutral-400 dark:bg-neutral-100 dark:shadow-[0_1px_4px_rgba(0,0,0,0.5)]";

  return (
    <label
      className={`flex items-start justify-between gap-4 ${
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {(label || description) && (
        <span className="flex-1 min-w-0">
          {label && (
            <span className="block text-sm font-medium text-[var(--foreground)] leading-tight">
              {label}
            </span>
          )}
          {description && (
            <span
              id={descId}
              className="block text-xs text-[var(--muted)] mt-1 leading-relaxed"
            >
              {description}
            </span>
          )}
        </span>
      )}
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          disabled={disabled}
          aria-label={srOnlyLabel}
          aria-describedby={description ? descId : undefined}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span
          aria-hidden
          className={`h-6 w-11 rounded-full transition-colors duration-200 ease-out ${trackClass} peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--primary)]/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--card)]`}
        />
        <span
          aria-hidden
          className={`absolute left-0.5 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-transform duration-200 ease-out ${thumbClass}`}
        />
      </span>
    </label>
  );
}
