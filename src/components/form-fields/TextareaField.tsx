"use client";

import type { FieldProps } from "./types";
import { DEFAULT_INPUT_CLASS } from "./types";
import { FieldShell } from "./FieldShell";

export function TextareaField({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
  inputClassName,
  labelClassName,
  labelStyle,
  helpTextStyle,
  inputStyle,
  hideMeta,
  ariaDescribedBy,
  inputId,
}: FieldProps) {
  const control = (
    <textarea
      id={inputId ?? field.id}
      value={(value as string) ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      rows={4}
      minLength={field.validation?.min_length}
      maxLength={field.validation?.max_length}
      className={inputClassName ?? `${DEFAULT_INPUT_CLASS} resize-y`}
      style={inputStyle}
      aria-invalid={!!error}
      aria-describedby={ariaDescribedBy}
    />
  );

  if (hideMeta) return <div className={className}>{control}</div>;

  return (
    <FieldShell
      id={inputId ?? field.id}
      label={field.label}
      required={field.required}
      helpText={field.help_text}
      error={error}
      className={className}
      labelStyle={labelStyle}
      helpTextStyle={helpTextStyle}
    >
      {control}
    </FieldShell>
  );
}
