"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { usePopoverPosition } from "./usePopoverPosition";

export type TimePickerProps = {
  /** Local wall time `HH:mm` (24h). When empty/invalid, seeds once to the next 5-minute boundary. */
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  label?: string;
  placeholder?: string;
  /** For "today" scheduling: disable times earlier than this wall time (`HH:mm`). */
  disableBeforeTime?: string;
};

function pad(value: number): string {
  return String(Math.max(0, Math.min(99, value))).padStart(2, "0");
}

/** Next wall-clock time on a 5-minute grid (local). */
export function roundToNextFiveMinutes(date = new Date()): string {
  const rounded = new Date(date);
  const minutes = rounded.getMinutes();
  const next = Math.ceil(minutes / 5) * 5;

  rounded.setMinutes(next);
  rounded.setSeconds(0, 0);
  rounded.setMilliseconds(0);

  if (next >= 60) {
    rounded.setHours(rounded.getHours() + 1);
    rounded.setMinutes(0);
  }

  return `${pad(rounded.getHours())}:${pad(rounded.getMinutes())}`;
}

function snapMinuteToFive(m: number): number {
  const s = Math.round(m / 5) * 5;
  return Math.min(55, Math.max(0, s));
}

function parseParts(value?: string): [string, string] {
  const v = value?.trim() ?? "";
  if (/^\d{2}:\d{2}$/.test(v)) {
    const [h, m] = v.split(":");
    const hi = parseInt(h, 10);
    const mi = parseInt(m, 10);
    if (Number.isNaN(hi) || Number.isNaN(mi) || hi < 0 || hi > 23 || mi < 0 || mi > 59) {
      return roundToNextFiveMinutes().split(":") as [string, string];
    }
    const mm = mi % 5 === 0 ? m : pad(snapMinuteToFive(mi));
    return [pad(hi), mm];
  }
  return roundToNextFiveMinutes().split(":") as [string, string];
}

const VIEW = 240;
const CX = VIEW / 2;
const CY = VIEW / 2;
const R_OUT = 92;
const R_IN = 62;
const R_MIN = 88;

function polarDeg(r: number, angleDeg: number): { x: number; y: number } {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

type Step = "hour" | "minute";

const outerHourValues = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
const innerHourValues = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0] as const;

function hourHandAngle(h: number): { angle: number; length: number } {
  if (h >= 1 && h <= 11) {
    const i = outerHourValues.indexOf(h as (typeof outerHourValues)[number]);
    return { angle: -90 + i * 30, length: R_OUT };
  }
  if (h === 12) return { angle: -90, length: R_OUT };
  const j = innerHourValues.indexOf(h as (typeof innerHourValues)[number]);
  if (j >= 0) return { angle: -90 + 15 + j * 30, length: R_IN };
  return { angle: -90, length: R_OUT };
}

function minuteHandAngle(minute: number): number {
  return -90 + (minute / 60) * 360;
}

function toMinutes(time?: string): number | null {
  const v = time?.trim() ?? "";
  if (!/^\d{2}:\d{2}$/.test(v)) return null;
  const [h, m] = v.split(":");
  const hh = parseInt(h, 10);
  const mm = parseInt(m, 10);
  if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
  if (hh < 0 || hh > 23 || mm < 0 || mm > 59) return null;
  return hh * 60 + mm;
}

export function TimePicker({
  value,
  onChange,
  disabled = false,
  label,
  placeholder = "Pick a time",
  disableBeforeTime,
}: TimePickerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("hour");

  /** Snap server/off-grid minutes to 5-minute steps without inventing a time when empty. */
  useLayoutEffect(() => {
    const v = value?.trim() ?? "";
    if (!/^\d{2}:\d{2}$/.test(v)) return;
    const [h, m] = v.split(":");
    const mi = parseInt(m, 10);
    if (mi % 5 !== 0) {
      onChange(`${h}:${pad(snapMinuteToFive(mi))}`);
    }
  }, [value, onChange]);

  const hasWallTime = Boolean(value?.trim() && /^\d{2}:\d{2}$/.test(value.trim() ?? ""));
  const [hourStr, minuteStr] = useMemo(() => parseParts(value), [value]);
  const hourNum = parseInt(hourStr, 10);
  const minuteNum = parseInt(minuteStr, 10);

  const popoverStyle = usePopoverPosition(open, triggerRef, {
    estimatedHeight: 340,
    matchTriggerWidth: false,
    minOuterWidth: 280,
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

  const displayValue = hasWallTime ? `${hourStr}:${minuteStr}` : "";
  const minMinutes = toMinutes(disableBeforeTime);

  const hourHand = useMemo(() => hourHandAngle(hourNum), [hourNum]);
  const minuteHandDeg = useMemo(() => minuteHandAngle(minuteNum), [minuteNum]);

  const handleHourPick = (h: number) => {
    if (minMinutes != null && h * 60 + parseInt(minuteStr, 10) < minMinutes) return;
    onChange(`${pad(h)}:${minuteStr}`);
    setStep("minute");
  };

  const handleMinutePick = (m: number) => {
    if (minMinutes != null && parseInt(hourStr, 10) * 60 + m < minMinutes) return;
    onChange(`${hourStr}:${pad(m)}`);
    setOpen(false);
  };

  const handleTriggerClick = (e: MouseEvent) => {
    e.preventDefault();
    if (disabled) return;
    const nextOpen = !open;
    if (nextOpen) setStep("hour");
    setOpen(nextOpen);
  };

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
        <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
          {step === "minute" ? (
            <button
              type="button"
              onClick={() => setStep("hour")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--foreground)]/5 hover:text-[var(--foreground)]"
              aria-label="Back to hour"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          ) : (
            <span className="w-9" aria-hidden />
          )}
          <div className="flex flex-1 items-baseline justify-center gap-0.5 font-mono text-3xl font-medium tabular-nums tracking-tight">
            <span
              className={
                step === "hour"
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted)]"
              }
            >
              {hourStr}
            </span>
            <span className="text-[var(--muted)]">:</span>
            <span
              className={
                step === "minute"
                  ? "text-[var(--primary)]"
                  : "text-[var(--muted)]"
              }
            >
              {minuteStr}
            </span>
          </div>
          <span className="w-9" aria-hidden />
        </div>

        <div className="relative mx-auto mt-3 flex justify-center" style={{ width: VIEW, height: VIEW }}>
          <svg
            width={VIEW}
            height={VIEW}
            viewBox={`0 0 ${VIEW} ${VIEW}`}
            className="pointer-events-none select-none"
            aria-hidden
          >
            <circle
              cx={CX}
              cy={CY}
              r={R_OUT + 8}
              className="fill-[color-mix(in_srgb,var(--foreground)_4%,transparent)]"
            />
            {step === "hour" ? (
              <>
                {outerHourValues.map((h, i) => {
                  const { x, y } = polarDeg(R_OUT, -90 + i * 30);
                  const sel = hourNum === h;
                  const itemDisabled =
                    minMinutes != null && h * 60 + parseInt(minuteStr, 10) < minMinutes;
                  return (
                    <g key={`o-${h}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={18}
                        fill={sel ? "var(--primary)" : "var(--card)"}
                        stroke="var(--border)"
                        strokeWidth={1}
                        opacity={itemDisabled ? 0.45 : 1}
                      />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={sel ? "#fff" : "var(--foreground)"}
                        opacity={itemDisabled ? 0.65 : 1}
                        className="pointer-events-none text-[13px] font-medium"
                      >
                        {h}
                      </text>
                    </g>
                  );
                })}
                {innerHourValues.map((h, j) => {
                  const { x, y } = polarDeg(R_IN, -90 + 15 + j * 30);
                  const sel = hourNum === h;
                  const label = h === 0 ? "00" : String(h);
                  const itemDisabled =
                    minMinutes != null && h * 60 + parseInt(minuteStr, 10) < minMinutes;
                  return (
                    <g key={`i-${h}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={16}
                        fill={sel ? "var(--primary)" : "var(--card)"}
                        stroke="var(--border)"
                        strokeWidth={1}
                        opacity={itemDisabled ? 0.45 : 1}
                      />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={sel ? "#fff" : "var(--foreground)"}
                        opacity={itemDisabled ? 0.65 : 1}
                        className="pointer-events-none text-[12px] font-medium"
                      >
                        {label}
                      </text>
                    </g>
                  );
                })}
                <line
                  x1={CX}
                  y1={CY}
                  x2={CX + (hourHand.length - 10) * Math.cos((hourHand.angle * Math.PI) / 180)}
                  y2={CY + (hourHand.length - 10) * Math.sin((hourHand.angle * Math.PI) / 180)}
                  stroke="var(--primary)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </>
            ) : (
              <>
                {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => {
                  const ang = minuteHandAngle(m);
                  const { x, y } = polarDeg(R_MIN, ang);
                  const sel = minuteNum === m;
                  const itemDisabled =
                    minMinutes != null &&
                    parseInt(hourStr, 10) * 60 + m < minMinutes;
                  return (
                    <g key={`m-${m}`}>
                      <circle
                        cx={x}
                        cy={y}
                        r={17}
                        fill={sel ? "var(--primary)" : "var(--card)"}
                        stroke="var(--border)"
                        strokeWidth={1}
                        opacity={itemDisabled ? 0.45 : 1}
                      />
                      <text
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill={sel ? "#fff" : "var(--foreground)"}
                        opacity={itemDisabled ? 0.65 : 1}
                        className="pointer-events-none text-[12px] font-medium tabular-nums"
                      >
                        {pad(m)}
                      </text>
                    </g>
                  );
                })}
                <line
                  x1={CX}
                  y1={CY}
                  x2={CX + (R_MIN - 12) * Math.cos((minuteHandDeg * Math.PI) / 180)}
                  y2={CY + (R_MIN - 12) * Math.sin((minuteHandDeg * Math.PI) / 180)}
                  stroke="var(--primary)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              </>
            )}
            <circle cx={CX} cy={CY} r={5} fill="var(--primary)" />
          </svg>

          {step === "hour" ? (
            <div className="pointer-events-auto absolute inset-0">
              {outerHourValues.map((h, i) => {
                const { x, y } = polarDeg(R_OUT, -90 + i * 30);
                const itemDisabled =
                  minMinutes != null && h * 60 + parseInt(minuteStr, 10) < minMinutes;
                return (
                  <button
                    key={`ob-${h}`}
                    type="button"
                    className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                    style={{ left: x, top: y }}
                    disabled={itemDisabled}
                    onClick={() => handleHourPick(h)}
                    aria-label={`Hour ${h}`}
                  />
                );
              })}
              {innerHourValues.map((h, j) => {
                const { x, y } = polarDeg(R_IN, -90 + 15 + j * 30);
                const itemDisabled =
                  minMinutes != null && h * 60 + parseInt(minuteStr, 10) < minMinutes;
                return (
                  <button
                    key={`ib-${h}`}
                    type="button"
                    className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                    style={{ left: x, top: y }}
                    disabled={itemDisabled}
                    onClick={() => handleHourPick(h)}
                    aria-label={h === 0 ? "Hour 0" : `Hour ${h}`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="pointer-events-auto absolute inset-0">
              {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => {
                const ang = minuteHandAngle(m);
                const { x, y } = polarDeg(R_MIN, ang);
                const itemDisabled =
                  minMinutes != null &&
                  parseInt(hourStr, 10) * 60 + m < minMinutes;
                return (
                  <button
                    key={`mb-${m}`}
                    type="button"
                    className="absolute h-10 w-10 -translate-x-1/2 -translate-y-1/2 rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                    style={{ left: x, top: y }}
                    disabled={itemDisabled}
                    onClick={() => handleMinutePick(m)}
                    aria-label={`Minute ${pad(m)}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>,
      document.body,
    );

  return (
    <div className="relative w-full">
      {label ? (
        <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.75}
            stroke="currentColor"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {label}
        </span>
      ) : null}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={handleTriggerClick}
        className={`flex w-full items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5 text-left text-sm transition-all duration-150 outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
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
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span className="flex-1 truncate font-mono tabular-nums">
          {displayValue || placeholder}
        </span>
        <svg
          className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {popover}
    </div>
  );
}
