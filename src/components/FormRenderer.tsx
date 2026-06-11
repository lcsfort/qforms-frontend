"use client";

import { useCallback, useMemo, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { FormField, FormSettings } from "@/lib/types";
import { getFieldComponent } from "./form-fields";

interface FieldClassNames {
  wrapper?: string;
  input?: string;
  label?: string;
}

interface FormRendererProps {
  fields: FormField[];
  settings?: FormSettings;
  onSubmit: (data: Record<string, unknown>) => void | Promise<void>;
  submitLabel?: string;
  fieldClassNames?: FieldClassNames;
  disabled?: boolean;
  mode?: "preview" | "public";
  showSubmit?: boolean;
  className?: string;
  onAnalyticsEvent?: (event: {
    type:
      | "form_start"
      | "field_focus"
      | "field_blur"
      | "field_change"
      | "submit_attempt"
      | "submit_success"
      | "submit_error";
    fieldId?: string;
    durationMs?: number;
    payload?: Record<string, unknown>;
  }) => void;
}

type FormValues = Record<string, unknown>;

function scaleBounds(field: FormField): { min: number; max: number } {
  const rawMax = field.validation?.max;
  const rawMin = field.validation?.min;
  const maxVal = Math.min(
    10,
    Math.max(1, typeof rawMax === "number" ? rawMax : Number(rawMax) || 5),
  );
  let minVal = Math.max(
    1,
    Math.min(10, typeof rawMin === "number" ? rawMin : Number(rawMin) || 1),
  );
  if (minVal > maxVal) minVal = maxVal;
  return { min: minVal, max: maxVal };
}

function buildFieldSchema(field: FormField): z.ZodTypeAny {
  const v = field.validation ?? {};

  if (field.type === "checkbox") {
    const base = z.array(z.string());
    return field.required
      ? base.min(1, { message: "required" })
      : base.optional().transform((val) => val ?? []);
  }

  if (field.type === "file") {
    return field.required
      ? z.any().refine((val) => Boolean(val), { message: "required" })
      : z.any().optional();
  }

  if (field.type === "rating" || field.type === "scale") {
    const { min, max } = scaleBounds(field);
    const numberSchema = z
      .number()
      .min(min, { message: "min" })
      .max(max, { message: "max" });
    const normalized = z.preprocess(
      (val) => (val === 0 || val === "" ? undefined : val),
      numberSchema.optional(),
    );
    if (field.required) {
      return normalized.refine((val) => typeof val === "number", {
        message: "required",
      });
    }
    return normalized.transform((val) => val ?? 0);
  }

  if (field.type === "number") {
    let numberSchema = z.number();
    if (typeof v.min === "number") numberSchema = numberSchema.min(v.min, { message: "min" });
    if (typeof v.max === "number") numberSchema = numberSchema.max(v.max, { message: "max" });

    return z.preprocess((val) => {
      if (val === "" || val === null || val === undefined) return undefined;
      if (typeof val === "number") return val;
      if (typeof val === "string") {
        const parsed = Number(val);
        return Number.isNaN(parsed) ? val : parsed;
      }
      return val;
    }, field.required ? numberSchema : numberSchema.optional());
  }

  let textSchema: z.ZodTypeAny = field.required
    ? z.string().min(1, { message: "required" })
    : z.string().optional().transform((val) => val ?? "");
  if (field.type === "email") {
    textSchema = textSchema.refine(
      (val) =>
        typeof val !== "string" ||
        !val ||
        /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val),
      { message: "pattern" },
    );
  }
  if (typeof v.min_length === "number") {
    textSchema = textSchema.refine(
      (val) =>
        typeof val !== "string" || !val || val.length >= v.min_length!,
      { message: "min_length" },
    );
  }
  if (typeof v.max_length === "number") {
    textSchema = textSchema.refine(
      (val) =>
        typeof val !== "string" || !val || val.length <= v.max_length!,
      { message: "max_length" },
    );
  }
  if (typeof v.pattern === "string" && v.pattern.trim()) {
    textSchema = textSchema.refine(
      (val) => {
        if (typeof val !== "string" || !val) return true;
        try {
          return new RegExp(v.pattern as string).test(val);
        } catch {
          return true;
        }
      },
      { message: "pattern" },
    );
  }
  return textSchema;
}

function normalizeField(f: FormField, index: number): FormField {
  const order = typeof f.order === "number" ? f.order : Number(f.order) || index;
  return {
    id: String(f.id ?? `field_${index}`),
    type: f.type ?? "text",
    label: String(f.label ?? ""),
    placeholder: f.placeholder != null ? String(f.placeholder) : undefined,
    help_text: f.help_text != null ? String(f.help_text) : undefined,
    required: Boolean(f.required),
    order,
    validation: f.validation && typeof f.validation === "object" ? { ...f.validation } : undefined,
    options: Array.isArray(f.options) ? f.options.map((o) => ({ label: String(o?.label ?? ""), value: String(o?.value ?? "") })) : undefined,
  };
}

const FULL_WIDTH_TYPES = new Set(["textarea", "file"]);

export function FormRenderer({
  fields,
  settings,
  onSubmit,
  submitLabel = "Submit",
  fieldClassNames,
  disabled = false,
  mode = "public",
  showSubmit = true,
  className,
  onAnalyticsEvent,
}: FormRendererProps) {
  const sorted = Array.isArray(fields)
    ? fields
        .map((f, i) => normalizeField(f as FormField, i))
        .sort((a, b) => a.order - b.order)
    : [];

  const columns = settings?.columns ?? 1;
  const minHeight = settings?.min_height ?? 0;

  const defaultValues = useMemo<FormValues>(() => {
    const init: Record<string, unknown> = {};
    for (const f of sorted) {
      if (f.type === "checkbox") init[f.id] = [];
      else if (f.type === "rating" || f.type === "scale") init[f.id] = 0;
      else init[f.id] = "";
    }
    return init;
  }, [sorted]);

  const schema = useMemo(() => {
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const f of sorted) shape[f.id] = buildFieldSchema(f);
    return z.object(shape);
  }, [sorted]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onSubmit",
  });

  const startedRef = useRef(false);
  const focusedAtRef = useRef<Record<string, number>>({});

  const markStarted = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    onAnalyticsEvent?.({ type: "form_start" });
  }, [onAnalyticsEvent]);

  const handleChange = useCallback((fieldId: string, value: unknown) => {
    markStarted();
    onAnalyticsEvent?.({
      type: "field_change",
      fieldId,
      payload: { valueType: Array.isArray(value) ? "array" : typeof value },
    });
  }, [markStarted, onAnalyticsEvent]);

  const handleFieldFocus = useCallback(
    (fieldId: string) => {
      markStarted();
      focusedAtRef.current[fieldId] = Date.now();
      onAnalyticsEvent?.({ type: "field_focus", fieldId });
    },
    [markStarted, onAnalyticsEvent],
  );

  const handleFieldBlur = useCallback(
    (fieldId: string) => {
      const startedAt = focusedAtRef.current[fieldId];
      const durationMs = startedAt ? Math.max(0, Date.now() - startedAt) : 0;
      delete focusedAtRef.current[fieldId];
      onAnalyticsEvent?.({ type: "field_blur", fieldId, durationMs });
    },
    [onAnalyticsEvent],
  );

  const submitHandler = handleSubmit(async (values) => {
    if (mode === "preview") return;
    onAnalyticsEvent?.({ type: "submit_attempt" });
    try {
      await onSubmit(values);
      onAnalyticsEvent?.({ type: "submit_success" });
    } catch (err) {
      onAnalyticsEvent?.({
        type: "submit_error",
        payload: { message: err instanceof Error ? err.message : String(err) },
      });
    }
  });

  const gridClass =
    columns === 3
      ? "grid grid-cols-1 sm:grid-cols-3 gap-4"
      : columns === 2
        ? "grid grid-cols-1 sm:grid-cols-2 gap-4"
        : "space-y-5";

  const labelStyle = useMemo(() => {
    const s: React.CSSProperties = {};
    if (settings?.question_font_family) s.fontFamily = settings.question_font_family;
    if (settings?.question_font_size != null) s.fontSize = `${settings.question_font_size}px`;
    return Object.keys(s).length ? s : undefined;
  }, [settings?.question_font_family, settings?.question_font_size]);

  const helpTextStyle = useMemo(() => {
    const s: React.CSSProperties = {};
    if (settings?.text_font_family) s.fontFamily = settings.text_font_family;
    if (settings?.text_font_size != null) s.fontSize = `${settings.text_font_size}px`;
    return Object.keys(s).length ? s : undefined;
  }, [settings?.text_font_family, settings?.text_font_size]);

  const inputStyle = useMemo(() => {
    const s: React.CSSProperties = {};
    if (settings?.text_font_family) s.fontFamily = settings.text_font_family;
    if (settings?.text_font_size != null) s.fontSize = `${settings.text_font_size}px`;
    return Object.keys(s).length ? s : undefined;
  }, [settings?.text_font_family, settings?.text_font_size]);

  const t = useTranslations("forms");
  const validationT = useTranslations("validation");

  const mapErrorMessage = (raw?: unknown): string | undefined => {
    if (!raw || typeof raw !== "string") return undefined;
    if (
      raw === "required" ||
      raw === "min_length" ||
      raw === "max_length" ||
      raw === "min" ||
      raw === "max" ||
      raw === "pattern"
    ) {
      try {
        return validationT(raw);
      } catch {
        return raw;
      }
    }
    return raw;
  };

  return (
    <form
      onSubmit={submitHandler}
      className={className ?? ""}
      style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
      noValidate
    >
      <div className={gridClass}>
        {sorted.map((field) => {
          const Component = getFieldComponent(field.type);
          const errorRaw = errors[field.id]?.message;
          const error = mapErrorMessage(
            typeof errorRaw === "string" ? errorRaw : undefined,
          );
          const describedBy = error
            ? `${field.id}-error`
            : field.help_text
              ? `${field.id}-help`
              : undefined;
          const spanFull =
            columns > 1 && FULL_WIDTH_TYPES.has(field.type);
          return (
            <div
              key={field.id}
              className={spanFull ? "col-span-full" : undefined}
              onFocusCapture={() => handleFieldFocus(field.id)}
              onBlurCapture={() => handleFieldBlur(field.id)}
            >
              <Controller
                name={field.id}
                control={control}
                render={({ field: rhf }) => (
                  <Component
                    field={field}
                    value={rhf.value}
                    onChange={(v) => {
                      rhf.onChange(v);
                      handleChange(field.id, v);
                    }}
                    error={error}
                    disabled={disabled || isSubmitting || mode === "preview"}
                    className={fieldClassNames?.wrapper}
                    inputClassName={fieldClassNames?.input}
                    labelClassName={fieldClassNames?.label}
                    labelStyle={labelStyle}
                    helpTextStyle={helpTextStyle}
                    inputStyle={inputStyle}
                    ariaDescribedBy={describedBy}
                    inputId={field.id}
                  />
                )}
              />
            </div>
          );
        })}
      </div>
      {showSubmit ? (
        <button
          type="submit"
          disabled={disabled || isSubmitting || mode === "preview"}
          className="w-full mt-6 py-2.5 px-4 rounded-[var(--qf-radius,12px)] bg-[var(--qf-accent,#1F6F66)] hover:opacity-95 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {t("publicForm.submitting")}
            </span>
          ) : (
            mode === "preview" ? t("publicForm.previewMode") : submitLabel
          )}
        </button>
      ) : null}
      <p className="mt-6 pt-4 text-center text-xs text-[var(--qf-muted,#6B6358)]">
        {t("poweredByPrefix")}
        <Link
          href="/"
          className="text-[var(--qf-label,#23201B)] hover:text-[var(--qf-accent,#1F6F66)] hover:underline transition-colors"
        >
          Qforms
        </Link>
      </p>
    </form>
  );
}
