"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

export type FilterOption = { value: string; label: string };

type FilterMenuProps = {
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  icon?: ReactNode;
};

/** A compact, design-system filter dropdown (single-select). */
export function FilterMenu({ value, options, onChange, ariaLabel, icon }: FilterMenuProps) {
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

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--card)] pl-2.5 pr-2 text-[13px] font-medium text-[var(--foreground)] transition-colors duration-150 hover:bg-[var(--surface)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 cursor-pointer"
      >
        {icon && <span className="shrink-0 text-[var(--muted)]">{icon}</span>}
        <span className="max-w-[150px] truncate">{selected?.label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" strokeWidth={2} />
      </button>

      {open && (
        <div
          role="listbox"
          className="palette-scroll menu-enter absolute left-0 top-full z-50 mt-1.5 max-h-[280px] min-w-[200px] rounded-xl border border-[var(--border)]/80 bg-[var(--card)] p-1.5 shadow-xl shadow-black/8 glass-panel dark:shadow-black/20"
        >
          {options.map((option) => {
            const active = option.value === value;
            return (
              <button
                key={option.value || "__all"}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between gap-3 rounded-lg px-2.5 py-2 text-left text-[13px] transition-colors duration-100 cursor-pointer ${
                  active
                    ? "bg-[var(--primary)]/10 font-medium text-[var(--primary)]"
                    : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                }`}
              >
                <span className="truncate">{option.label}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
