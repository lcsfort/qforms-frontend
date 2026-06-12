"use client";

import { useTranslations } from "next-intl";
import { Check, MessageSquare, Zap } from "lucide-react";
import { setSelectedBuildMode } from "@/lib/redux/formsSlice";
import { useAppDispatch } from "@/lib/redux/hooks";
import { savePreferences, usePreferences } from "@/lib/preferences";
import { type FormBuildMode } from "@/lib/types";
import { SettingsSection } from "./primitives";

export function CreationSection() {
  const t = useTranslations("profile.creation");
  const dispatch = useAppDispatch();
  const { defaultBuildMode } = usePreferences();

  const choose = (mode: FormBuildMode) => {
    savePreferences({ defaultBuildMode: mode });
    dispatch(setSelectedBuildMode(mode));
  };

  const options: Array<{
    value: FormBuildMode;
    title: string;
    description: string;
    icon: typeof MessageSquare;
  }> = [
    { value: "planning", title: t("planTitle"), description: t("planDesc"), icon: MessageSquare },
    { value: "straight", title: t("directTitle"), description: t("directDesc"), icon: Zap },
  ];

  return (
    <SettingsSection title={t("title")} description={t("desc")}>
      <div role="group" aria-label={t("title")} className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const Icon = option.icon;
          const active = defaultBuildMode === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              onClick={() => choose(option.value)}
              className={`flex flex-col gap-3 rounded-2xl border p-5 text-left transition-colors duration-150 cursor-pointer ${
                active
                  ? "border-[var(--primary)]/40 bg-[var(--primary)]/6"
                  : "border-[var(--border)]/80 bg-[var(--card)]/75 hover:border-[var(--primary)]/30"
              }`}
            >
              <span className="flex items-center justify-between">
                <span
                  className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)]/70 bg-[var(--surface)]/60 ${
                    active ? "text-[var(--primary)]" : "text-[var(--muted)]"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                {active && <Check className="h-4 w-4 shrink-0 text-[var(--primary)]" strokeWidth={2.5} />}
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-[var(--foreground)]">{option.title}</span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-[var(--muted)]">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2.5 text-[11.5px] text-[var(--muted)]">{t("deviceNote")}</p>
    </SettingsSection>
  );
}
