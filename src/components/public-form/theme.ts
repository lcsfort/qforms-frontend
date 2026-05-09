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
    "--qf-accent": override?.accent ?? "#7c3aed",
    "--qf-label": override?.label ?? "#1f2937",
    "--qf-muted": override?.muted ?? "#6b7280",
    "--qf-text": override?.text ?? "#111827",
    "--qf-bg": override?.background ?? settings?.page_background_color ?? "#f8fafc",
    "--qf-surface":
      override?.surface ?? settings?.form_background_color ?? "#ffffff",
    "--qf-danger": override?.danger ?? "#dc2626",
  };
}

