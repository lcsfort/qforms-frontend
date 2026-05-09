"use client";

import type { FieldProps } from "./types";
import { FieldShell } from "./FieldShell";

export function UnsupportedField({
  field,
  error,
  className,
  labelStyle,
  helpTextStyle,
}: FieldProps) {
  return (
    <FieldShell
      id={field.id}
      label={field.label}
      required={field.required}
      helpText={field.help_text}
      error={error}
      className={className}
      labelStyle={labelStyle}
      helpTextStyle={helpTextStyle}
    >
      <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-700 px-3 py-2 text-sm">
        Unsupported field type: <strong>{field.type}</strong>
      </div>
    </FieldShell>
  );
}

