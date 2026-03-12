"use client";

import type { FieldProps } from "./types";
import {
  DEFAULT_LABEL_CLASS,
  DEFAULT_INPUT_CLASS,
  DEFAULT_ERROR_CLASS,
  DEFAULT_HELP_CLASS,
} from "./types";

export function TextField({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
  inputClassName,
  labelClassName,
}: FieldProps) {
  const inputType =
    field.type === "email"
      ? "email"
      : field.type === "number"
        ? "number"
        : "text";

  return (
    <div className={className}>
      <label htmlFor={field.id} className={labelClassName ?? DEFAULT_LABEL_CLASS}>
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        id={field.id}
        type={inputType}
        value={(value as string | number) ?? ""}
        onChange={(e) =>
          onChange(
            inputType === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value,
          )
        }
        placeholder={field.placeholder}
        disabled={disabled}
        min={field.validation?.min}
        max={field.validation?.max}
        minLength={field.validation?.min_length}
        maxLength={field.validation?.max_length}
        className={inputClassName ?? DEFAULT_INPUT_CLASS}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${field.id}-error` : field.help_text ? `${field.id}-help` : undefined
        }
      />
      {field.help_text && !error && (
        <p id={`${field.id}-help`} className={DEFAULT_HELP_CLASS}>
          {field.help_text}
        </p>
      )}
      {error && (
        <p id={`${field.id}-error`} role="alert" className={DEFAULT_ERROR_CLASS}>
          {error}
        </p>
      )}
    </div>
  );
}
