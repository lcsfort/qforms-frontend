"use client";

import { useMemo, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LayoutGrid, Moon, Rows3, Sun } from "lucide-react";
import { useTheme, type Theme } from "@/lib/theme";
import { getEffectiveTimezone, savePreferences, usePreferences } from "@/lib/preferences";
import { SegmentedChoice, SettingsCard, SettingsSection } from "./primitives";
import { TimezoneSelect } from "./TimezoneSelect";

const LANGUAGE_LABELS: Record<string, string> = { en: "English", pt: "Português" };

function PreferenceCard({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <SettingsCard className="flex flex-col p-4 sm:p-5">
      <p className="text-[13.5px] font-medium text-[var(--foreground)]">{label}</p>
      <p className="mt-0.5 text-[12px] text-[var(--muted)]">{description}</p>
      <div className="mt-auto pt-4">{children}</div>
    </SettingsCard>
  );
}

export function PreferencesSection() {
  const t = useTranslations("profile.preferences");
  const tMenu = useTranslations("appMenu");
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preferences = usePreferences();

  const detectedTimezone = useMemo(
    () => getEffectiveTimezone({ ...preferences, timezone: null }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const timezones = useMemo<string[]>(() => {
    let list: string[] = [];
    try {
      const supported = (
        Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
      ).supportedValuesOf;
      if (supported) list = supported.call(Intl, "timeZone");
    } catch {
      list = [];
    }
    if (preferences.timezone && !list.includes(preferences.timezone)) {
      list = [preferences.timezone, ...list];
    }
    return list;
  }, [preferences.timezone]);

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    const segments = pathname.split("/");
    segments[1] = newLocale;
    // Keep the query string (e.g. ?tab=preferences) so the page state survives the locale change.
    const query = searchParams.toString();
    router.push(segments.join("/") + (query ? `?${query}` : ""));
  };

  return (
    <SettingsSection title={t("title")} description={t("desc")}>
      <div className="grid gap-3 md:grid-cols-2">
        <PreferenceCard label={t("theme")} description={t("themeDesc")}>
          <SegmentedChoice<Theme>
            value={theme}
            onChange={setTheme}
            label={t("theme")}
            options={[
              { value: "light", label: tMenu("themeLight"), icon: Sun },
              { value: "dark", label: tMenu("themeDark"), icon: Moon },
            ]}
          />
        </PreferenceCard>

        <PreferenceCard label={t("language")} description={t("languageDesc")}>
          <SegmentedChoice
            value={locale}
            onChange={switchLocale}
            label={t("language")}
            options={[
              { value: "en", label: LANGUAGE_LABELS.en },
              { value: "pt", label: LANGUAGE_LABELS.pt },
            ]}
          />
        </PreferenceCard>

        <PreferenceCard label={t("formsView")} description={t("formsViewDesc")}>
          <SegmentedChoice<"grid" | "list">
            value={preferences.formsView}
            onChange={(next) => savePreferences({ formsView: next })}
            label={t("formsView")}
            options={[
              { value: "grid", label: t("viewGrid"), icon: LayoutGrid },
              { value: "list", label: t("viewList"), icon: Rows3 },
            ]}
          />
        </PreferenceCard>

        <PreferenceCard label={t("timezone")} description={t("timezoneDesc")}>
          <TimezoneSelect
            value={preferences.timezone}
            options={timezones}
            autoLabel={t("timezoneAuto", { timezone: detectedTimezone })}
            label={t("timezone")}
            onChange={(next) => savePreferences({ timezone: next })}
          />
        </PreferenceCard>
      </div>
      <p className="mt-2.5 text-[11.5px] text-[var(--muted)]">{t("deviceNote")}</p>
    </SettingsSection>
  );
}
