"use client";

import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { DayPicker } from "react-day-picker";
import { format, parse, isValid } from "date-fns";
import { usePopoverPosition } from "./usePopoverPosition";

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  disableToday?: boolean;
  label?: string;
  placeholder?: string;
}

export function DatePicker({
  value,
  onChange,
  min,
  disableToday = false,
  label,
  placeholder = "Pick a date",
}: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selected = value ? parse(value, "yyyy-MM-dd", new Date()) : undefined;
  const minDate = min ? parse(min, "yyyy-MM-dd", new Date()) : undefined;
  const disabledMatcher =
    minDate && disableToday
      ? [{ before: minDate }, minDate]
      : minDate
        ? { before: minDate }
        : disableToday
          ? [new Date()]
          : undefined;

  const popoverStyle = usePopoverPosition(open, triggerRef, {
    estimatedHeight: 340,
    matchTriggerWidth: false,
    minOuterWidth: 288,
    horizontalAnchorWidth: 300,
  });

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: globalThis.MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t)) return;
      if (popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const handleSelect = (day: Date | undefined) => {
    if (day && isValid(day)) {
      onChange(format(day, "yyyy-MM-dd"));
      setOpen(false);
    }
  };

  const handleTriggerClick = (e: MouseEvent) => {
    e.preventDefault();
    setOpen((prev) => !prev);
  };

  const displayValue =
    selected && isValid(selected) ? format(selected, "MMM d, yyyy") : "";

  const popover =
    open &&
    popoverStyle &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        ref={popoverRef}
        style={popoverStyle}
        className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg"
      >
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          disabled={disabledMatcher}
          defaultMonth={selected ?? minDate ?? new Date()}
          classNames={{
            root: "rdp-root",
            months: "rdp-months",
            month: "rdp-month",
            month_caption: "rdp-caption",
            caption_label: "rdp-caption-label",
            nav: "rdp-nav",
            button_previous: "rdp-nav-btn",
            button_next: "rdp-nav-btn",
            month_grid: "rdp-table",
            weekdays: "rdp-head-row",
            weekday: "rdp-weekday",
            weeks: "rdp-body",
            week: "rdp-row",
            day: "rdp-cell",
            day_button: "rdp-day",
            selected: "rdp-selected",
            today: "rdp-today",
            outside: "rdp-outside",
            disabled: "rdp-disabled",
            range_start: "rdp-range-start",
            range_end: "rdp-range-end",
            range_middle: "rdp-range-middle",
            chevron: "rdp-chevron",
          }}
        />
      </div>,
      document.body,
    );

  return (
    <div className="relative">
      {label && (
        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
            />
          </svg>
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        className={`flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left text-sm transition-all duration-150 outline-none ${
          open
            ? "border-[var(--primary)]/60 ring-2 ring-[var(--primary)]/20"
            : "hover:border-[var(--muted)]/50"
        } ${displayValue ? "text-[var(--foreground)]" : "text-[var(--muted)]"}`}
      >
        <svg
          className="h-4 w-4 shrink-0 text-[var(--muted)]"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
          />
        </svg>
        <span className="flex-1 truncate">{displayValue || placeholder}</span>
        <svg
          className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>
      {popover}
    </div>
  );
}
