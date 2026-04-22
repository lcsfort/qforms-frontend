"use client";

import type { FormNotificationSettings, FormSettings } from "@/lib/types";
import { SectionCard } from "./SectionCard";
import { Toggle } from "./primitives/Toggle";

type NotifT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

interface NotificationsSectionProps {
  settings: FormSettings;
  setSettings: (s: FormSettings) => void;
  t: NotifT;
}

export function NotificationsSection({
  settings,
  setSettings,
  t,
}: NotificationsSectionProps) {
  const notifications: FormNotificationSettings = settings.notifications ?? {};

  const setNotifications = (next: FormNotificationSettings) => {
    setSettings({ ...settings, notifications: next });
  };

  return (
    <SectionCard
      title={t("notifications.title")}
      description={t("notifications.description")}
      eyebrow={<span>{t("notifications.eyebrow")}</span>}
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/30 px-4 py-3.5">
          <Toggle
            checked={notifications.emailOnResponse ?? false}
            onChange={(v) =>
              setNotifications({ ...notifications, emailOnResponse: v })
            }
            label={t("notifications.onResponseLabel")}
            description={t("notifications.onResponseDesc")}
          />
        </div>
        <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)]/20 px-4 py-3.5 opacity-70">
          <div className="flex items-start justify-between gap-4">
            <span className="flex-1 min-w-0">
              <span className="flex items-center gap-2 text-sm font-medium text-[var(--foreground)] leading-tight">
                {t("notifications.dailySummaryLabel")}
                <span className="rounded-full bg-[var(--muted)]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">
                  {t("notifications.soon")}
                </span>
              </span>
              <span className="mt-1 block text-xs text-[var(--muted)] leading-relaxed">
                {t("notifications.dailySummaryDesc")}
              </span>
            </span>
            <Toggle checked={false} disabled onChange={() => {}} />
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
