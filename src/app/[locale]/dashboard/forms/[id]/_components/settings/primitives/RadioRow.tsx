"use client";

import type { ReactNode } from "react";

interface RadioRowProps {
  name: string;
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  description?: string;
  icon?: ReactNode;
  disabled?: boolean;
}

export function RadioRow({
  name,
  value,
  checked,
  onChange,
  label,
  description,
  icon,
  disabled = false,
}: RadioRowProps) {
  return (
    <label
      className={`group flex items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-150 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
      } ${
        checked
          ? "bg-[var(--primary)]/[0.06] border-[var(--primary)]/40 shadow-[0_0_0_1px_var(--primary)]/10"
          : "border-[var(--border)]"
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={() => onChange(value)}
        className="sr-only peer"
      />
      <span
        aria-hidden
        className={`relative mt-0.5 h-4 w-4 shrink-0 rounded-full border transition-colors ${
          checked
            ? "border-[var(--primary)]"
            : "border-[var(--border)] group-hover:border-[var(--muted)]"
        }`}
      >
        <span
          className={`absolute inset-[3px] rounded-full transition-transform duration-150 ${
            checked
              ? "bg-[var(--primary)] scale-100"
              : "bg-transparent scale-50"
          }`}
        />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] leading-tight">
          {icon ? <span className="text-[var(--muted)]">{icon}</span> : null}
          {label}
        </span>
        {description && (
          <span className="block text-xs text-[var(--muted)] mt-1 leading-relaxed">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}
