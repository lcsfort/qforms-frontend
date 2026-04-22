"use client";

import type { Dispatch, SetStateAction } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { isValid, parse } from "date-fns";
import type { FormPublishingSettings, FormSettings } from "@/lib/types";
import { SectionCard, CollapseReveal } from "./SectionCard";
import { RadioRow } from "./primitives/RadioRow";
import { DatePicker } from "./primitives/DatePicker";
import { TimePicker, roundToNextFiveMinutes } from "./primitives/TimePicker";

type PublishT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

interface PublishingSectionProps {
  settings: FormSettings;
  setSettings: Dispatch<SetStateAction<FormSettings>>;
  status: "draft" | "published";
  onPublishNow: () => Promise<void> | void;
  onSaveSchedule: () => Promise<void> | void;
  onUnpublish: () => Promise<void> | void;
  t: PublishT;
}

function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone ?? "UTC";
  } catch {
    return "UTC";
  }
}

function toLocalDateAndTime(iso: string | null | undefined): {
  date: string;
  time: string;
} {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { date, time };
}

function localDateYMD(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function combineToISO(date: string, time: string): string | null {
  if (!date || !time) return null;
  const combined = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  if (!isValid(combined)) return null;
  return combined.toISOString();
}

function toLocalDate(date: string, time: string): Date | null {
  const combined = parse(`${date} ${time}`, "yyyy-MM-dd HH:mm", new Date());
  if (!isValid(combined)) return null;
  return combined;
}

function isTodayDateString(value: string): boolean {
  if (!value) return false;
  return value === localDateYMD(new Date());
}

function formatCountdown(
  iso: string,
  t: PublishT,
): { label: string; passed: boolean } {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = target - now;
  if (Number.isNaN(target)) return { label: "", passed: false };
  if (diffMs <= 0) return { label: t("publishing.countdown.passed"), passed: true };

  const minutes = Math.round(diffMs / 60_000);
  if (minutes < 1) return { label: t("publishing.countdown.lessThanMinute"), passed: false };

  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes - days * 24 * 60) / 60);
  const mins = minutes - days * 24 * 60 - hours * 60;

  if (days > 0) {
    return {
      label: t("publishing.countdown.days", { days, hours }),
      passed: false,
    };
  }
  if (hours > 0) {
    return {
      label: t("publishing.countdown.hours", { hours, minutes: mins }),
      passed: false,
    };
  }
  return {
    label: t("publishing.countdown.minutes", { minutes: mins }),
    passed: false,
  };
}

export function PublishingSection({
  settings,
  setSettings,
  status,
  onPublishNow,
  onSaveSchedule,
  onUnpublish,
  t,
}: PublishingSectionProps) {
  const publishing: FormPublishingSettings = settings.publishing ?? {};
  const isPublished = status === "published";
  const hasSchedule =
    publishing.mode === "scheduled" && !!publishing.scheduledPublishAt;

  const scheduledGoLiveMs = publishing.scheduledPublishAt
    ? new Date(publishing.scheduledPublishAt).getTime()
    : NaN;
  const waitingForFutureSchedule =
    publishing.mode === "scheduled" &&
    !!publishing.scheduledPublishAt &&
    !Number.isNaN(scheduledGoLiveMs) &&
    scheduledGoLiveMs > Date.now();
  /** True only when the form is actually public (not embargoed by a future schedule). */
  const appearsLive = isPublished && !waitingForFutureSchedule;

  const [busy, setBusy] = useState(false);

  const [now, setNow] = useState(() => Date.now());
  void now;

  const timezone = useMemo(detectTimezone, []);
  const mode = publishing.mode ?? "now";

  /** Date/time for scheduled mode — only written to `settings` when "Schedule publish" is clicked. */
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const lastSyncedCommitIso = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    if (mode !== "scheduled") {
      lastSyncedCommitIso.current = undefined;
      setDraftDate("");
      setDraftTime("");
      return;
    }
    const at = publishing.scheduledPublishAt ?? null;
    if (lastSyncedCommitIso.current === at) return;
    lastSyncedCommitIso.current = at;
    const { date: d, time: tm } = toLocalDateAndTime(at);
    setDraftDate(d);
    setDraftTime(tm);
  }, [mode, publishing.scheduledPublishAt]);

  const setPublishing = (next: FormPublishingSettings) => {
    setSettings((prev) => ({ ...prev, publishing: next }));
  };

  const handleModeChange = (newMode: "now" | "scheduled") => {
    if (newMode === "now") {
      setPublishing({ mode: "now", timezone });
    } else {
      setSettings((prev) => ({
        ...prev,
        publishing: {
          mode: "scheduled",
          scheduledPublishAt: prev.publishing?.scheduledPublishAt ?? null,
          timezone,
        },
      }));
    }
  };

  const handleDraftDateChange = (newDate: string) => {
    setDraftDate(newDate);
  };

  const handleDraftTimeChange = (newTime: string) => {
    setDraftTime(newTime);
  };

  const draftScheduleIso = useMemo(() => {
    if (mode !== "scheduled") return null;
    return combineToISO(draftDate, draftTime || "09:00");
  }, [mode, draftDate, draftTime]);

  const draftScheduleLocal = useMemo(() => {
    if (mode !== "scheduled") return null;
    return toLocalDate(draftDate, draftTime || "09:00");
  }, [mode, draftDate, draftTime]);

  const isDraftInFuture = useMemo(() => {
    if (!draftScheduleLocal) return false;
    return draftScheduleLocal.getTime() > Date.now();
  }, [draftScheduleLocal]);

  useEffect(() => {
    const active =
      mode === "scheduled" && !!(draftScheduleIso ?? publishing.scheduledPublishAt);
    if (!active) return;
    const tick = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(tick);
  }, [mode, draftScheduleIso, publishing.scheduledPublishAt]);

  const handlePublishAction = async () => {
    setBusy(true);
    try {
      if (mode === "now") {
        await onPublishNow();
      } else if (mode === "scheduled") {
        const iso = draftScheduleIso;
        if (!iso || !isDraftInFuture) return;
        flushSync(() => {
          setSettings((prev) => ({
            ...prev,
            publishing: {
              mode: "scheduled",
              scheduledPublishAt: iso,
              timezone,
            },
          }));
        });
        await onSaveSchedule();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleUnpublishAction = async () => {
    setBusy(true);
    try {
      await onUnpublish();
      setPublishing({});
    } finally {
      setBusy(false);
    }
  };

  const countdownSource: "draft" | "committed" | null =
    mode === "scheduled"
      ? draftScheduleIso
        ? "draft"
        : publishing.scheduledPublishAt
          ? "committed"
          : null
      : null;
  const countdownIso =
    mode === "scheduled"
      ? draftScheduleIso ?? publishing.scheduledPublishAt ?? null
      : null;
  const rawCountdown =
    countdownIso && mode === "scheduled" ? formatCountdown(countdownIso, t) : null;
  // While editing draft date/time, avoid "Publishing now..." before user confirms scheduling.
  const countdown =
    countdownSource === "draft" && rawCountdown?.passed ? null : rawCountdown;

  const isScheduledMode = mode === "scheduled";
  const hasCommittedSchedule = !!publishing.scheduledPublishAt;
  const isScheduleInFuture =
    hasCommittedSchedule &&
    !Number.isNaN(scheduledGoLiveMs) &&
    scheduledGoLiveMs > Date.now();
  const isScheduleLiveNow =
    hasCommittedSchedule &&
    !Number.isNaN(scheduledGoLiveMs) &&
    scheduledGoLiveMs <= Date.now();
  const draftScheduleValid = isScheduledMode && !!draftScheduleIso && isDraftInFuture;
  const hasDraftScheduleUpdate =
    isScheduledMode &&
    !!draftScheduleIso &&
    draftScheduleIso !== (publishing.scheduledPublishAt ?? null);
  const canPublishNow = mode === "now" && !appearsLive;

  const showUpdateScheduleAction =
    isScheduledMode && hasCommittedSchedule && hasDraftScheduleUpdate;
  const showUnpublishAction =
    (mode === "now" && appearsLive) ||
    (isScheduledMode && hasCommittedSchedule && !hasDraftScheduleUpdate);
  // First-time scheduling should keep the button visible while editing draft date/time.
  const showSchedulePublishAction = isScheduledMode && !hasCommittedSchedule;

  const todayStr = useMemo(() => localDateYMD(new Date()), []);
  const disableTodayInDatePicker = useMemo(() => {
    if (!isScheduledMode || !draftTime || draftDate) return false;
    const probe = toLocalDate(todayStr, draftTime);
    return !!probe && probe.getTime() <= Date.now();
  }, [isScheduledMode, draftTime, draftDate, todayStr]);
  const minTimeForSelectedDate =
    isScheduledMode && isTodayDateString(draftDate)
      ? roundToNextFiveMinutes()
      : undefined;

  return (
    <SectionCard
      title={t("publishing.title")}
      description={t("publishing.description")}
      eyebrow={<span>{t("publishing.eyebrow")}</span>}
      trailing={
        appearsLive || hasSchedule ? (
          <div className="flex items-center gap-3">
            {appearsLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-semibold text-green-600 dark:text-green-400">
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                {t("publishing.liveIndicator")}
              </span>
            )}
            {hasSchedule && !appearsLive && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {t("publishing.scheduledIndicator")}
              </span>
            )}
          </div>
        ) : undefined
      }
    >
      <div className="space-y-4">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <RadioRow
              name="publish-mode"
              value="now"
              checked={mode !== "scheduled"}
              onChange={() => handleModeChange("now")}
              label={t("publishing.modeNowLabel")}
              description={
                appearsLive
                  ? t("publishing.modeNowDescLive")
                  : t("publishing.modeNowDesc")
              }
            />
            <RadioRow
              name="publish-mode"
              value="scheduled"
              checked={mode === "scheduled"}
              onChange={() => handleModeChange("scheduled")}
              label={t("publishing.modeScheduledLabel")}
              description={t("publishing.modeScheduledDesc")}
            />
          </div>

          <CollapseReveal open={mode === "scheduled"}>
            <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--background)]/30 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <DatePicker
                  value={draftDate}
                  min={todayStr}
                  disableToday={disableTodayInDatePicker}
                  onChange={handleDraftDateChange}
                  label={t("publishing.dateLabel")}
                  placeholder={t("publishing.datePlaceholder")}
                />
                <TimePicker
                  value={draftTime}
                  onChange={handleDraftTimeChange}
                  disableBeforeTime={minTimeForSelectedDate}
                  label={t("publishing.timeLabel")}
                  placeholder={t("publishing.timePlaceholder")}
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t("publishing.timezone", { timezone })}
                </span>
                {countdown && (
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium ${
                      countdown.passed
                        ? "bg-green-500/10 text-green-600 dark:text-green-400"
                        : "bg-[var(--primary)]/10 text-[var(--primary)]"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-current" />
                    {countdown.label}
                  </span>
                )}
              </div>
              {!draftScheduleValid && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t("publishing.pickDateHint")}
                </p>
              )}
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                {t("publishing.helper")}
              </p>
            </div>
          </CollapseReveal>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <p
              className={`text-xs font-medium ${
                (mode === "now" && appearsLive) || (isScheduledMode && isScheduleLiveNow)
                  ? "text-green-600 dark:text-green-400"
                  : "text-[var(--muted)]"
              }`}
            >
              {mode === "now" && appearsLive
                ? t("publishing.currentlyLive")
                : isScheduledMode && isScheduleLiveNow
                  ? t("publishing.currentlyLive")
                  : isScheduledMode && (isScheduleInFuture || draftScheduleValid)
                    ? t("publishing.willSchedule")
                    : t("publishing.readyToPublish")}
            </p>

            {showUpdateScheduleAction ? (
              <button
                type="button"
                disabled={busy}
                onClick={handlePublishAction}
                className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {busy ? t("publishing.publishing") : t("publishing.updateScheduleBtn")}
              </button>
            ) : showUnpublishAction ? (
              <button
                type="button"
                disabled={busy}
                onClick={handleUnpublishAction}
                className="rounded-lg border border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-500/20 disabled:opacity-50"
              >
                {t("publishing.unpublish")}
              </button>
            ) : showSchedulePublishAction || canPublishNow ? (
              <button
                type="button"
                disabled={busy || !(isScheduledMode ? draftScheduleValid : canPublishNow)}
                onClick={handlePublishAction}
                className="rounded-lg bg-[var(--primary)] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {busy
                  ? t("publishing.publishing")
                  : isScheduledMode
                    ? t("publishing.scheduleBtn")
                    : t("publishing.publishBtn")}
              </button>
            ) : null}
          </div>
        </div>
    </SectionCard>
  );
}
