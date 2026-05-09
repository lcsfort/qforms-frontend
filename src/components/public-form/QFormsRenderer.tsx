"use client";

import { useMemo, type CSSProperties } from "react";
import { FormRenderer } from "@/components/FormRenderer";
import type { FormField, FormSettings } from "@/lib/types";
import { buildThemeFromSettings, type QFormTheme } from "./theme";
import { scopeCustomCss, validateCustomCss } from "./css-safety";

interface QFormsRendererProps {
  form: {
    schema: FormField[];
    settings?: FormSettings;
  };
  theme?: QFormTheme;
  customCss?: string;
  mode?: "preview" | "public";
  disabled?: boolean;
  showSubmit?: boolean;
  submitLabel: string;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  onAnalyticsEvent?: Parameters<typeof FormRenderer>[0]["onAnalyticsEvent"];
}

export function QFormsRenderer({
  form,
  theme,
  customCss,
  mode = "public",
  disabled = false,
  showSubmit = true,
  submitLabel,
  onSubmit,
  onAnalyticsEvent,
}: QFormsRendererProps) {
  const scopeId = "qf-renderer-root";
  const themeVars = useMemo(
    () => buildThemeFromSettings(form.settings, theme),
    [form.settings, theme],
  );
  const cssValidation = useMemo(() => validateCustomCss(customCss), [customCss]);
  const scopedCustomCss = useMemo(() => {
    if (!customCss || !cssValidation.isValid) return "";
    return scopeCustomCss(`#${scopeId}`, customCss);
  }, [customCss, cssValidation, scopeId]);

  return (
    <div
      id={scopeId}
      className="qf-root text-[var(--qf-text,#111827)]"
      style={themeVars as CSSProperties}
      data-mode={mode}
    >
      {mode === "preview" && !cssValidation.isValid ? (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs px-3 py-2">
          {cssValidation.reason}
        </div>
      ) : null}
      {scopedCustomCss ? <style>{scopedCustomCss}</style> : null}
      <FormRenderer
        fields={form.schema}
        settings={form.settings}
        submitLabel={submitLabel}
        mode={mode}
        disabled={disabled}
        showSubmit={showSubmit}
        onSubmit={onSubmit}
        onAnalyticsEvent={onAnalyticsEvent}
      />
    </div>
  );
}

