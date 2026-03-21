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
  labelStyle,
  helpTextStyle,
}: FieldProps) {
  return (
    <div className={className}>
      <fieldset>
        <legend className={labelClassName ?? DEFAULT_LABEL_CLASS} style={labelStyle}>
          {field.label}
          {field.required && <span className="text-red-500 ml-0.5">*</span>}
        </legend>
        <div className="space-y-2.5 mt-2" role="radiogroup">
          {field.options?.map((opt) => {
            const isSelected = value === opt.value;
            return (
              <label
                key={opt.value}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border cursor-pointer transition-all text-sm ${
                  isSelected
                    ? "border-indigo-500 bg-indigo-50 text-gray-900"
                    : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <span
                  className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-600"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-white" />
                  )}
                </span>
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={isSelected}
                  onChange={() => onChange(opt.value)}
                  disabled={disabled}
                  className="sr-only"
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      </fieldset>
      {field.help_text && !error && (
        <p className={DEFAULT_HELP_CLASS} style={helpTextStyle}>{field.help_text}</p>
      )}
      {error && (
        <p role="alert" className={DEFAULT_ERROR_CLASS}>
          {error}
        </p>
      )}
    </div>
  );
}
