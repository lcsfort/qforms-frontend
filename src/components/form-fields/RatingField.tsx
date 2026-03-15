"use client";

import { useState } from "react";
import type { FieldProps } from "./types";
import {
  DEFAULT_LABEL_CLASS,
  DEFAULT_ERROR_CLASS,
  DEFAULT_HELP_CLASS,
} from "./types";

export function RatingField({
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
  const rawMax = field.validation?.max;
  const maxRating = Math.min(
    10,
    Math.max(1, typeof rawMax === "number" ? rawMax : Number(rawMax) || 5),
  );
  const currentRating =
    typeof value === "number" && Number.isFinite(value) ? value : 0;
  const [hover, setHover] = useState(0);

  return (
    <div className={className}>
      <label className={labelClassName ?? DEFAULT_LABEL_CLASS} style={labelStyle}>
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="flex gap-1 mt-1" role="radiogroup" aria-label={field.label}>
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((star) => (
          <button
            key={star}
            type="button"
            disabled={disabled}
            onClick={() => onChange(star === currentRating ? 0 : star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-0.5 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
            role="radio"
            aria-checked={star === currentRating}
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <svg
              className={`w-7 h-7 ${
                star <= (hover || currentRating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              fill={star <= (hover || currentRating) ? "currentColor" : "none"}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
              />
            </svg>
          </button>
        ))}
      </div>
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
