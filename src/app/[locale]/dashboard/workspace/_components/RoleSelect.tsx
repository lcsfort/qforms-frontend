"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import type { WorkspaceRole } from "@/lib/types";

type RoleSelectProps = {
  value: WorkspaceRole;
  options: WorkspaceRole[];
  onChange: (role: WorkspaceRole) => void;
  label: (role: WorkspaceRole) => string;
  /** Optional one-line permission summary shown under each role in the menu. */
  description?: (role: WorkspaceRole) => string;
  ariaLabel?: string;
  disabled?: boolean;
  busy?: boolean;
  align?: "left" | "right";
  triggerClassName?: string;
};

/** A compact, design-system dropdown for picking a workspace role (replaces the native <select>). */
export function RoleSelect({
  value,
  options,
  onChange,
  label,
  description,
  ariaLabel,
  disabled = false,
  busy = false,
  align = "right",
  triggerClassName = "",
}: RoleSelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled || busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] pl-3 pr-2 text-[13px] font-medium text-[var(--foreground)] transition-colors duration-150 hover:bg-[var(--surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${triggerClassName}`}
      >
        <span className="truncate">{label(value)}</span>
        {busy ? (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-[var(--muted)]" strokeWidth={2} />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" strokeWidth={2} />
        )}
      </button>

      {open && !disabled && (
        <div
          role="listbox"
          className={`menu-enter absolute top-full z-50 mt-1.5 rounded-xl border border-[var(--border)]/80 bg-[var(--card)] p-1.5 shadow-xl shadow-black/8 glass-panel dark:shadow-black/20 ${
            description ? "w-[270px] max-w-[calc(100vw-2rem)]" : "min-w-[170px]"
          } ${align === "right" ? "right-0" : "left-0"}`}
        >
          {options.map((role) => {
            const isActive = role === value;
            return (
              <button
                key={role}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  onChange(role);
                  setOpen(false);
                }}
                className={`flex w-full items-start justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors duration-100 cursor-pointer ${
                  isActive
                    ? "bg-[var(--primary)]/10 font-medium text-[var(--primary)]"
                    : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
              >
                <span className="min-w-0">
                  <span className="block leading-tight">{label(role)}</span>
                  {description && (
                    <span className="mt-0.5 block text-[11.5px] font-normal leading-snug text-[var(--muted)]">
                      {description(role)}
                    </span>
                  )}
                </span>
                {isActive && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
