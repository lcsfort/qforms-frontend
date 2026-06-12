"use client";

import { type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { savePreferences, usePreferences } from "@/lib/preferences";
import { NumberField, SettingsCard, SettingsSection, Toggle } from "./primitives";

function RuleCard({
  title,
  description,
  enabled,
  onToggle,
  children,
}: {
  title: string;
  description: string;
  enabled: boolean;
  onToggle: (next: boolean) => void;
  children: ReactNode;
}) {
  return (
    <SettingsCard className="flex flex-col p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13.5px] font-medium text-[var(--foreground)]">{title}</p>
        <Toggle checked={enabled} onChange={onToggle} label={title} />
      </div>
      <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">{description}</p>
      <div className="mt-auto flex flex-col gap-2.5 pt-4">{children}</div>
    </SettingsCard>
  );
}

export function InsightsSection() {
  const t = useTranslations("profile.insights");
  const { attention } = usePreferences();

  return (
    <SettingsSection title={t("title")} description={t("desc")}>
      <div className="grid gap-3 md:grid-cols-2">
        <RuleCard
          title={t("lowTitle")}
          description={t("lowDesc")}
          enabled={attention.lowCompletionEnabled}
          onToggle={(next) => savePreferences({ attention: { lowCompletionEnabled: next } })}
        >
          <NumberField
            label={t("thresholdLabel")}
            value={attention.lowCompletionThreshold}
            onChange={(next) => savePreferences({ attention: { lowCompletionThreshold: next } })}
            min={5}
            max={95}
            suffix="%"
            disabled={!attention.lowCompletionEnabled}
          />
          <NumberField
            label={t("minSessionsLabel")}
            value={attention.minSessions}
            onChange={(next) => savePreferences({ attention: { minSessions: next } })}
            min={1}
            max={100}
            disabled={!attention.lowCompletionEnabled}
          />
        </RuleCard>

        <RuleCard
          title={t("viewsTitle")}
          description={t("viewsDesc")}
          enabled={attention.noResponsesEnabled}
          onToggle={(next) => savePreferences({ attention: { noResponsesEnabled: next } })}
        >
          <NumberField
            label={t("minViewsLabel")}
            value={attention.minViews}
            onChange={(next) => savePreferences({ attention: { minViews: next } })}
            min={1}
            max={100}
            disabled={!attention.noResponsesEnabled}
          />
        </RuleCard>

        <RuleCard
          title={t("draftTitle")}
          description={t("draftDesc")}
          enabled={attention.draftIdleEnabled}
          onToggle={(next) => savePreferences({ attention: { draftIdleEnabled: next } })}
        >
          <NumberField
            label={t("draftDaysLabel")}
            value={attention.draftIdleDays}
            onChange={(next) => savePreferences({ attention: { draftIdleDays: next } })}
            min={1}
            max={90}
            disabled={!attention.draftIdleEnabled}
          />
        </RuleCard>
      </div>
      <p className="mt-2.5 text-[11.5px] text-[var(--muted)]">{t("deviceNote")}</p>
    </SettingsSection>
  );
}
