"use client";

import type { FieldProps } from "./types";
import { FieldShell } from "./FieldShell";

function clampScaleBounds(field: FieldProps["field"]): { min: number; max: number } {
  const rawMax = field.validation?.max;
  const rawMin = field.validation?.min;
  const maxRating = Math.min(
    10,
    Math.max(1, typeof rawMax === "number" ? rawMax : Number(rawMax) || 5),
  );
  let minRating = Math.max(
    1,
    Math.min(10, typeof rawMin === "number" ? rawMin : Number(rawMin) || 1),
  );
  if (minRating > maxRating) minRating = maxRating;
  return { min: minRating, max: maxRating };
}

export function ScaleField({
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
  const { min: minScale, max: maxScale } = clampScaleBounds(field);
  const current =
    typeof value === "number" && Number.isFinite(value) ? value : 0;
  const levels = Array.from(
    { length: maxScale - minScale + 1 },
    (_, i) => minScale + i,
  );

  const control = (
    <div
      className="flex flex-wrap gap-2 mt-2"
      role="radiogroup"
      aria-label={field.label}
    >
      {levels.map((level) => {
        const isSelected = level === current;
        return (
          <button
            key={level}
            id={`${inputId ?? field.id}-${level}`}
            type="button"
            disabled={disabled}
            onClick={() => onChange(level === current ? 0 : level)}
            role="radio"
            aria-checked={isSelected}
            aria-label={`${level}`}
            className={`min-w-[2.5rem] h-10 px-3 rounded-lg border text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
              isSelected
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-gray-500"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {level}
          </button>
        );
      })}
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
