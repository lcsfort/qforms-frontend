"use client";

import { useState, useCallback, type FormEvent, type ComponentType } from "react";
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
}

function validateField(
  field: FormField,
  value: unknown,
): string | undefined {
  if (field.required) {
    if (value === undefined || value === null || value === "") return "required";
    if (Array.isArray(value) && value.length === 0) return "required";
  }

  if (value === undefined || value === null || value === "") return undefined;

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

export function FormRenderer({
  fields,
  onSubmit,
  submitLabel = "Submit",
  fieldClassNames,
  disabled = false,
  className,
}: FormRendererProps) {
  const sorted = Array.isArray(fields)
    ? fields
        .map((f, i) => normalizeField(f as FormField, i))
        .sort((a, b) => a.order - b.order)
    : [];

  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const init: Record<string, unknown> = {};
    for (const f of sorted) {
      if (f.type === "checkbox") init[f.id] = [];
      else if (f.type === "rating") init[f.id] = 0;
      else init[f.id] = "";
    }
    return init;
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = useCallback((fieldId: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [fieldId]: value }));
    setErrors((prev) => ({ ...prev, [fieldId]: undefined }));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className ?? "space-y-5"} noValidate>
      {sorted.map((field) => {
        const Component = fieldRegistry[field.type];
        if (!Component) return null;
        return (
          <Component
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(v) => handleChange(field.id, v)}
            error={errors[field.id]}
            disabled={disabled || submitting}
            className={fieldClassNames?.wrapper}
            inputClassName={fieldClassNames?.input}
            labelClassName={fieldClassNames?.label}
          />
        );
      })}
      <button
        type="submit"
        disabled={disabled || submitting}
        className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
    </form>
  );
}
