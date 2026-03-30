"use client";

import { useState, useCallback, useMemo, useRef, type FormEvent, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { FormField, FormSettings } from "@/lib/types";
import type { FieldProps } from "./form-fields/types";
import {
  TextField,
  TextareaField,
  SelectField,
  RadioField,
  CheckboxField,
  DateField,
  FileField,
  RatingField,
  ScaleField,
} from "./form-fields";

const fieldRegistry: Record<string, ComponentType<FieldProps>> = {
  text: TextField,
  email: TextField,
  number: TextField,
  textarea: TextareaField,
  select: SelectField,
  radio: RadioField,
  checkbox: CheckboxField,
  date: DateField,
  file: FileField,
  rating: RatingField,
  scale: ScaleField,
};

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

function validateField(
  field: FormField,
  value: unknown,
): string | undefined {
  if (field.required) {
    if (value === undefined || value === null || value === "") return "required";
    if (Array.isArray(value) && value.length === 0) return "required";
    if (
      (field.type === "rating" || field.type === "scale") &&
      value === 0
    ) {
      return "required";
    }
  }

  if (value === undefined || value === null || value === "") return undefined;

  if (
    (field.type === "rating" || field.type === "scale") &&
    typeof value === "number" &&
    value !== 0
  ) {
    const { min: lo, max: hi } = scaleBounds(field);
    if (value < lo || value > hi) return "max";
  }

  const v = field.validation;
  if (!v) return undefined;

  if (typeof value === "string") {
    if (v.min_length && value.length < v.min_length) return "min_length";
    if (v.max_length && value.length > v.max_length) return "max_length";
    if (v.pattern) {
      try {
        if (!new RegExp(v.pattern).test(value)) return "pattern";
      } catch {
        /* invalid regex, skip */
      }
    }
  }

  if (typeof value === "number") {
    if (v.min !== undefined && v.min !== null && value < v.min) return "min";
    if (v.max !== undefined && v.max !== null && value > v.max) return "max";
  }

  return undefined;
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

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of sorted) {
      if (f.type === "checkbox") init[f.id] = [];
      else if (f.type === "rating" || f.type === "scale") init[f.id] = 0;
      else init[f.id] = "";
    }
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);
  const startedRef = useRef(false);
  const focusedAtRef = useRef<Record<string, number>>({});

  const markStarted = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    onAnalyticsEvent?.({ type: "form_start" });
  }, [onAnalyticsEvent]);

  const handleChange = useCallback((fieldId: string, value: unknown) => {
    markStarted();
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: undefined }));
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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    onAnalyticsEvent?.({ type: "submit_attempt" });

    const newErrors: Record<string, string | undefined> = {};
    let hasErrors = false;
    for (const f of sorted) {
      const err = validateField(f, values[f.id]);
      if (err) {
        newErrors[f.id] = err;
        hasErrors = true;
      }
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(values);
      onAnalyticsEvent?.({ type: "submit_success" });
    } catch (err) {
      onAnalyticsEvent?.({
        type: "submit_error",
        payload: { message: err instanceof Error ? err.message : String(err) },
      });
    } finally {
      setSubmitting(false);
    }
  };

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

  return (
    <form
      onSubmit={handleSubmit}
      className={className ?? ""}
      style={minHeight ? { minHeight: `${minHeight}px` } : undefined}
      noValidate
    >
      <div className={gridClass}>
        {sorted.map((field) => {
          const Component = fieldRegistry[field.type];
          if (!Component) return null;
          const spanFull =
            columns > 1 && FULL_WIDTH_TYPES.has(field.type);
          return (
            <div
              key={field.id}
              className={spanFull ? "col-span-full" : undefined}
              onFocusCapture={() => handleFieldFocus(field.id)}
              onBlurCapture={() => handleFieldBlur(field.id)}
            >
              <Component
                field={field}
                value={values[field.id]}
                onChange={(v) => handleChange(field.id, v)}
                error={errors[field.id]}
                disabled={disabled || submitting}
                className={fieldClassNames?.wrapper}
                inputClassName={fieldClassNames?.input}
                labelClassName={fieldClassNames?.label}
                labelStyle={labelStyle}
                helpTextStyle={helpTextStyle}
                inputStyle={inputStyle}
              />
            </div>
          );
        })}
      </div>
      <button
        type="submit"
        disabled={disabled || submitting}
        className="w-full mt-6 py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Submitting...
          </span>
        ) : (
          submitLabel
        )}
      </button>
      <p className="mt-6 pt-4 text-center text-xs text-gray-400">
        {t("poweredByPrefix")}
        <Link
          href="/"
          className="text-gray-500 hover:text-indigo-600 hover:underline transition-colors"
        >
          Qforms
        </Link>
      </p>
    </form>
  );
}
