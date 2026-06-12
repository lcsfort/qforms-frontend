"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Search } from "lucide-react";

type TimezoneSelectProps = {
  value: string | null;
  options: string[];
  autoLabel: string;
  label: string;
  onChange: (next: string | null) => void;
};

const ROW_CLASS =
  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] text-[var(--foreground)] transition-colors duration-100 cursor-pointer";

export function TimezoneSelect({ value, options, autoLabel, label, onChange }: TimezoneSelectProps) {
  const t = useTranslations("profile.preferences");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

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

  // Opening drops focus into the search box and brings the current choice into view.
  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    listRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: "center" });
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, "_");
    if (!q) return options;
    return options.filter((tz) => tz.toLowerCase().includes(q));
  }, [options, query]);

  const choose = (next: string | null) => {
    onChange(next);
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-left text-sm text-[var(--foreground)] outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
      >
        <span className="min-w-0 truncate">{value ?? autoLabel}</span>
        <svg className="h-5 w-5 shrink-0 text-[var(--muted)]" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <div className="menu-enter absolute left-0 right-0 z-50 mt-1.5 rounded-xl border border-[var(--border)]/80 bg-[var(--card)] p-1.5 shadow-xl shadow-black/8 glass-panel dark:shadow-black/20">
          <div className="relative mb-1.5">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]"
              strokeWidth={2}
            />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("timezoneSearch")}
              className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--background)]/70 pl-8 pr-2.5 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--primary)]/40 focus:ring-1 focus:ring-[var(--primary)]/30"
            />
          </div>

          <ul
            ref={listRef}
            role="listbox"
            aria-label={label}
            className="design-panel-scroll max-h-56 overflow-y-auto"
          >
            {!query.trim() && (
              <li>
                <button
                  type="button"
                  role="option"
                  aria-selected={value === null}
                  onClick={() => choose(null)}
                  className={`${ROW_CLASS} ${value === null ? "bg-[var(--primary)]/8" : "hover:bg-[var(--surface)]/70"}`}
                >
                  <span className="min-w-0 flex-1 truncate">{autoLabel}</span>
                  {value === null && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} />
                  )}
                </button>
              </li>
            )}
            {filtered.map((tz) => {
              const active = tz === value;
              return (
                <li key={tz}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => choose(tz)}
                    className={`${ROW_CLASS} ${active ? "bg-[var(--primary)]/8" : "hover:bg-[var(--surface)]/70"}`}
                  >
                    <span className="min-w-0 flex-1 truncate">{tz}</span>
                    {active && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} />
                    )}
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="px-2.5 py-2 text-[12.5px] text-[var(--muted)]">{t("timezoneNoResults")}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
