"use client";

import { useMemo } from "react";
import type { FormAccessSettings, FormField, FormSettings } from "@/lib/types";
import { SectionCard, CollapseReveal } from "./SectionCard";
import { RadioRow } from "./primitives/RadioRow";
import { DomainChipInput } from "./primitives/DomainChipInput";

type AccessT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

interface AccessControlSectionProps {
  settings: FormSettings;
  setSettings: (s: FormSettings) => void;
  fields: FormField[];
  userEmail?: string | null;
  t: AccessT;
}

function deriveDomainSuggestion(email?: string | null): string | null {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at < 0) return null;
  const domain = email.slice(at + 1).trim().toLowerCase();
  return domain || null;
}

export function AccessControlSection({
  settings,
  setSettings,
  fields,
  userEmail,
  t,
}: AccessControlSectionProps) {
  const access: FormAccessSettings = settings.access ?? {};
  const mode = access.mode ?? "public";
  const allowedDomains = access.allowedDomains ?? [];

  const hasEmailField = useMemo(
    () => fields.some((f) => f.type === "email"),
    [fields],
  );
  const suggestion = deriveDomainSuggestion(userEmail);

  const setAccess = (next: FormAccessSettings) => {
    setSettings({ ...settings, access: next });
  };

  return (
    <SectionCard
      title={t("access.title")}
      description={t("access.description")}
      eyebrow={<span>{t("access.eyebrow")}</span>}
    >
      <div className="space-y-3">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <RadioRow
            name="access-mode"
            value="public"
            checked={mode === "public"}
            onChange={() =>
              setAccess({ mode: "public", allowedDomains: [] })
            }
            label={t("access.publicLabel")}
            description={t("access.publicDesc")}
          />
          <RadioRow
            name="access-mode"
            value="domains"
            checked={mode === "domains"}
            onChange={() =>
              setAccess({
                mode: "domains",
                allowedDomains: allowedDomains.length > 0 ? allowedDomains : [],
              })
            }
            label={t("access.domainsLabel")}
            description={t("access.domainsDesc")}
          />
        </div>

        <CollapseReveal open={mode === "domains"}>
          <div className="mt-3 space-y-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)]/30 p-4">
            <DomainChipInput
              domains={allowedDomains}
              onChange={(next) =>
                setAccess({ mode: "domains", allowedDomains: next })
              }
              placeholder={t("access.chipPlaceholder")}
              invalidHint={t("access.invalidDomain")}
              suggestion={suggestion}
              suggestionLabel={
                suggestion
                  ? t("access.suggestion", { domain: suggestion })
                  : undefined
              }
            />
            <p className="text-xs text-[var(--muted)] leading-relaxed">
              {t("access.hint")}
            </p>
            {!hasEmailField && (
              <p className="flex items-start gap-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 px-3 py-2 text-xs leading-relaxed">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <span>{t("access.noEmailFieldWarning")}</span>
              </p>
            )}
          </div>
        </CollapseReveal>
      </div>
    </SectionCard>
  );
}
