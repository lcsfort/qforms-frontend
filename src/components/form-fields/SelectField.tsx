"use client";

import type { FieldProps } from "./types";
import {
  DEFAULT_LABEL_CLASS,
  DEFAULT_INPUT_CLASS,
  DEFAULT_ERROR_CLASS,
  DEFAULT_HELP_CLASS,
} from "./types";

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
}: FieldProps) {
  return (
    <div className={className}>
      <label htmlFor={field.id} className={labelClassName ?? DEFAULT_LABEL_CLASS} style={labelStyle}>
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          id={field.id}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClassName ?? `${DEFAULT_INPUT_CLASS} appearance-none cursor-pointer pr-10`}
          style={inputStyle}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${field.id}-error` : field.help_text ? `${field.id}-help` : undefined
          }
        >
          <option value="">{field.placeholder ?? "Select..."}</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 dark:text-gray-500">
          <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      {field.help_text && !error && (
        <p id={`${field.id}-help`} className={DEFAULT_HELP_CLASS} style={helpTextStyle}>
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
