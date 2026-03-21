"use client";

import type { FieldProps } from "./types";
import {
  DEFAULT_LABEL_CLASS,
  DEFAULT_INPUT_CLASS,
  DEFAULT_ERROR_CLASS,
  DEFAULT_HELP_CLASS,
} from "./types";

export function DateField({
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
        <input
          id={field.id}
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={inputClassName ?? `${DEFAULT_INPUT_CLASS} appearance-none pr-10`}
          style={inputStyle}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${field.id}-error` : field.help_text ? `${field.id}-help` : undefined
          }
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
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
