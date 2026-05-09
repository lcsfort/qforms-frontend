import type { CSSProperties } from "react";
import type { FormField } from "@/lib/types";

export interface FieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  hideMeta?: boolean;
  ariaDescribedBy?: string;
  inputId?: string;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
  labelStyle?: CSSProperties;
  helpTextStyle?: CSSProperties;
  inputStyle?: CSSProperties;
}

export const DEFAULT_LABEL_CLASS =
  "block text-sm font-medium text-[var(--qf-label,#1f2937)] mb-1.5";

export const DEFAULT_INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-[var(--qf-radius,12px)] border border-[color:color-mix(in_srgb,var(--qf-text,#111827)_20%,white)] bg-[var(--qf-surface,#ffffff)] text-[var(--qf-text,#111827)] focus:ring-2 focus:ring-[var(--qf-accent,#7c3aed)] focus:border-transparent outline-none transition-shadow text-sm placeholder:text-[var(--qf-muted,#6b7280)]";

export const DEFAULT_ERROR_CLASS = "text-[var(--qf-danger,#dc2626)] text-xs mt-1";

export const DEFAULT_HELP_CLASS =
  "text-[var(--qf-muted,#6b7280)] text-xs mt-1";
