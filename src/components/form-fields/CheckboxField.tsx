"use client";

import type { FieldProps } from "./types";
import {
  DEFAULT_LABEL_CLASS,
  DEFAULT_ERROR_CLASS,
  DEFAULT_HELP_CLASS,
} from "./types";

export function CheckboxField({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
  labelClassName,
}: FieldProps) {
  const selected = Array.isArray(value) ? (value as string[]) : [];

  const toggle = (optValue: string) => {
    if (selected.includes(optValue)) {
      onChange(selected.filter((v) => v !== optValue));
    } else {
      onChange([...selected, optValue]);
    }
  };

  return (
    <div className={className}>
      <fieldset>
        <legend className={labelClassName ?? DEFAULT_LABEL_CLASS}>
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        <div className="space-y-2 mt-1">
          {field.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="checkbox"
                value={opt.value}
                checked={selected.includes(opt.value)}
                onChange={() => toggle(opt.value)}
                disabled={disabled}
                className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 rounded focus:ring-indigo-500"
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>
      {field.help_text && !error && (
        <p className={DEFAULT_HELP_CLASS}>{field.help_text}</p>
      )}
      {error && (
        <p role="alert" className={DEFAULT_ERROR_CLASS}>
          {error}
        </p>
      )}
    </div>
  );
}
