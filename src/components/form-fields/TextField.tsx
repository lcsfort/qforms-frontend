"use client";

import type { FieldProps } from "./types";
import { DEFAULT_INPUT_CLASS } from "./types";
import { FieldShell } from "./FieldShell";

export function TextField({
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
  const inputType =
    field.type === "email"
      ? "email"
      : field.type === "number"
        ? "number"
        : "text";

  const control = (
    <input
      id={inputId ?? field.id}
      type={inputType}
      value={(value as string | number) ?? ""}
      onChange={(e) =>
        onChange(
          inputType === "number"
            ? e.target.value === ""
              ? ""
              : Number(e.target.value)
            : e.target.value,
        )
      }
      placeholder={field.placeholder}
      disabled={disabled}
      min={field.validation?.min}
      max={field.validation?.max}
      minLength={field.validation?.min_length}
      maxLength={field.validation?.max_length}
      className={inputClassName ?? DEFAULT_INPUT_CLASS}
      style={inputStyle}
      aria-invalid={!!error}
      aria-describedby={ariaDescribedBy}
    />
  );

  if (hideMeta) {
    return <div className={className}>{control}</div>;
  }

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
