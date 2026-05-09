"use client";

import type { FieldProps } from "./types";
import { DEFAULT_INPUT_CLASS } from "./types";
import { FieldShell } from "./FieldShell";

export function SelectField({
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
    <div className="relative">
      <select
        id={inputId ?? field.id}
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={
          inputClassName ??
          `${DEFAULT_INPUT_CLASS} appearance-none cursor-pointer pr-10`
        }
        style={inputStyle}
        aria-invalid={!!error}
        aria-describedby={ariaDescribedBy}
      >
        <option value="">{field.placeholder ?? "Select..."}</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </div>
    </div>
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
