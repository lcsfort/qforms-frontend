import type { FormSettings } from "@/lib/types";

export type QFormTheme = Partial<{
  radius: string;
  accent: string;
  label: string;
  muted: string;
  text: string;
  background: string;
  surface: string;
  danger: string;
}>;

export function buildThemeFromSettings(
  settings?: FormSettings,
  override?: QFormTheme,
): Record<string, string> {
  return {
    "--qf-radius": override?.radius ?? "12px",
    "--qf-accent": override?.accent ?? "#1F6F66",
    "--qf-label": override?.label ?? "#23201B",
    "--qf-muted": override?.muted ?? "#6B6358",
    "--qf-text": override?.text ?? "#23201B",
    "--qf-bg": override?.background ?? settings?.page_background_color ?? "#F7F4ED",
    "--qf-surface":
      override?.surface ?? settings?.form_background_color ?? "#FFFDF8",
    "--qf-danger": override?.danger ?? "#C0473A",
  };
}

