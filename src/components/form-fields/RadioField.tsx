"use client";

import type { FieldProps } from "./types";
import {
  DEFAULT_LABEL_CLASS,
  DEFAULT_ERROR_CLASS,
  DEFAULT_HELP_CLASS,
} from "./types";

export function RadioField({
  field,
  value,
  onChange,
  error,
  disabled,
  className,
  labelClassName,
}: FieldProps) {
  return (
    <div className={className}>
      <fieldset>
        <legend className={labelClassName ?? DEFAULT_LABEL_CLASS}>
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        <div className="space-y-2 mt-1" role="radiogroup">
          {field.options?.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2.5 cursor-pointer text-sm text-gray-700 dark:text-gray-300"
            >
              <input
                type="radio"
                name={field.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={() => onChange(opt.value)}
                disabled={disabled}
                className="w-4 h-4 text-indigo-600 border-gray-300 dark:border-gray-600 focus:ring-indigo-500"
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
