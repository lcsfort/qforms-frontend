"use client";

import { useRef } from "react";
import type { FieldProps } from "./types";
import { FieldShell } from "./FieldShell";

export function FileField({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
  labelClassName,
  labelStyle,
  helpTextStyle,
  hideMeta,
  inputId,
}: FieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const fileName = value instanceof File ? value.name : (value as string) ?? "";

  const control = (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            inputRef.current?.click();
          }
        }}
        className="mt-1 flex flex-col items-center justify-center w-full px-4 py-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:border-indigo-400 transition-colors cursor-pointer"
      >
        <svg
          className="w-8 h-8 text-gray-400 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
          />
        </svg>
        <span className="text-sm text-gray-500">
          {fileName || (field.placeholder ?? "Click to upload a file")}
        </span>
      </div>
      <input
        ref={inputRef}
        id={inputId ?? field.id}
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange(file);
        }}
        disabled={disabled}
        className="hidden"
        aria-invalid={!!error}
      />
    </>
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
