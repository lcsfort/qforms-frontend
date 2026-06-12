"use client";

import { type ComponentType, type ReactNode, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";

export function SettingsCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/75 p-5 sm:p-6 ${className}`}>
      {children}
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">{title}</h2>
      {description && <p className="mt-0.5 text-[13px] text-[var(--muted)]">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-[22px] w-9 shrink-0 items-center rounded-full border transition-colors duration-150 cursor-pointer ${
        checked
          ? "border-[var(--primary)] bg-[var(--primary)]"
          : "border-[var(--border)] bg-[var(--surface)]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
          checked ? "translate-x-[17px]" : "translate-x-[2px]"
        }`}
      />
    </button>
  );
}

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
};

export function SegmentedChoice<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: Array<SegmentedOption<T>>;
  onChange: (next: T) => void;
  label: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center gap-1 rounded-xl border border-[var(--border)]/80 bg-[var(--surface)]/50 p-1"
    >
      {options.map((option) => {
        const Icon = option.icon;
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[12.5px] font-medium transition-colors duration-100 cursor-pointer ${
              active
                ? "border border-[var(--border)]/80 bg-[var(--card)] text-[var(--foreground)] shadow-sm"
                : "border border-transparent text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  suffix,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min: number;
  max: number;
  suffix?: string;
  disabled?: boolean;
}) {
  const id = useId();
  /* Typing is free-form in a local draft; the clamped value only commits on
     blur/Enter. Clamping per keystroke would rewrite partial entries (typing
     "10" with min 5 becomes 5 then 50) and make the field impossible to clear. */
  const [draft, setDraft] = useState(String(value));
  const [lastValue, setLastValue] = useState(value);
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(String(value));
  }

  const t = useTranslations("profile");

  const commit = () => {
    const parsed = Number(draft);
    if (draft.trim() === "" || !Number.isFinite(parsed)) {
      setDraft(String(value));
      return;
    }
    const clamped = Math.min(max, Math.max(min, Math.round(parsed)));
    setDraft(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  const step = (delta: number) => {
    const parsed = Number(draft);
    const base = draft.trim() !== "" && Number.isFinite(parsed) ? Math.round(parsed) : value;
    const next = Math.min(max, Math.max(min, base + delta));
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const STEP_BTN =
    "flex w-9 shrink-0 cursor-pointer items-center justify-center text-[var(--muted)] transition-colors hover:bg-[var(--surface)]/70 hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent";

  return (
    <label
      htmlFor={id}
      className={`flex w-full items-center justify-between gap-3 ${disabled ? "opacity-50" : ""}`}
    >
      <span className="min-w-0 text-[12.5px] text-[var(--muted)]">{label}</span>
      <span className="flex w-36 shrink-0 items-stretch overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] transition-shadow focus-within:border-transparent focus-within:ring-2 focus-within:ring-[var(--primary)]">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={disabled || value <= min}
          aria-label={`${t("decrease")} — ${label}`}
          className={`${STEP_BTN} border-r border-[var(--border)]/60`}
        >
          <Minus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
        <span className="flex min-w-0 flex-1 items-center justify-center gap-1 px-1.5 py-2.5">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            value={draft}
            min={min}
            max={max}
            disabled={disabled}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
              }
            }}
            className="w-full min-w-0 bg-transparent text-center text-sm tabular-nums text-[var(--foreground)] outline-none disabled:cursor-not-allowed"
          />
          {suffix && <span className="shrink-0 text-[12px] text-[var(--muted)]">{suffix}</span>}
        </span>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={disabled || value >= max}
          aria-label={`${t("increase")} — ${label}`}
          className={`${STEP_BTN} border-l border-[var(--border)]/60`}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
        </button>
      </span>
    </label>
  );
}
