"use client";

import type { FieldProps } from "./types";
import { FieldShell } from "./FieldShell";

export function CheckboxField({
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
  const selected = Array.isArray(value) ? (value as string[]) : [];

  const toggle = (optValue: string) => {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue));
    } else {
      onChange([...selected, optValue]);
    }
  };

  const control = (
    <fieldset>
      <div className="space-y-2.5 mt-2">
        {field.options?.map((opt) => {
          const isChecked = selected.includes(opt.value);
          return (
            <label
              key={opt.value}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                isChecked
                  ? "border-indigo-500 bg-indigo-50 text-gray-900"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <span
                className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isChecked ? "border-indigo-600 bg-indigo-600" : "border-gray-300"
                }`}
              >
                {isChecked && (
                  <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                    <path
                      d="M2.5 6L5 8.5L9.5 3.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              <input
                id={`${inputId ?? field.id}-${opt.value}`}
                type="checkbox"
                value={opt.value}
                checked={isChecked}
                onChange={() => toggle(opt.value)}
                disabled={disabled}
                className="sr-only"
              />
              {opt.label}
            </label>
          );
        })}
      </div>
    </fieldset>
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
