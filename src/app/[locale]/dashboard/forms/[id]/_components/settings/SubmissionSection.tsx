"use client";

import type { FormSettings } from "@/lib/types";
import { SectionCard } from "./SectionCard";
import { Toggle } from "./primitives/Toggle";
import { SoftInput } from "./primitives/SoftInput";

type SubT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

interface SubmissionSectionProps {
  settings: FormSettings;
  setSettings: (s: FormSettings) => void;
  t: SubT;
}

export function SubmissionSection({
  settings,
  setSettings,
  t,
}: SubmissionSectionProps) {
  return (
    <SectionCard
      title={t("submission.title")}
      description={t("submission.description")}
      eyebrow={<span>{t("submission.eyebrow")}</span>}
    >
      <div className="space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
            {t("submission.submitMessageLabel")}
          </span>
          <SoftInput
            type="text"
            value={settings.submit_message ?? ""}
            onChange={(e) =>
              setSettings({ ...settings, submit_message: e.target.value })
            }
            placeholder={t("submission.submitMessagePlaceholder")}
          />
        </label>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--background)]/30 px-4 py-3.5">
          <Toggle
            checked={settings.allow_multiple_submissions ?? false}
            onChange={(v) =>
              setSettings({ ...settings, allow_multiple_submissions: v })
            }
            label={t("submission.allowMultipleLabel")}
            description={t("submission.allowMultipleDesc")}
          />
        </div>
      </div>
    </SectionCard>
  );
}
