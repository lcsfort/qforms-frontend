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
  "block text-sm font-medium text-[var(--qf-label,#23201B)] mb-1.5";

export const DEFAULT_INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-[var(--qf-radius,12px)] border border-[color:color-mix(in_srgb,var(--qf-text,#23201B)_20%,white)] bg-[var(--qf-surface,#FFFDF8)] text-[var(--qf-text,#23201B)] focus:ring-2 focus:ring-[var(--qf-accent,#1F6F66)] focus:border-transparent outline-none transition-shadow text-sm placeholder:text-[var(--qf-muted,#6B6358)]";

export const DEFAULT_ERROR_CLASS = "text-[var(--qf-danger,#C0473A)] text-xs mt-1";

export const DEFAULT_HELP_CLASS =
  "text-[var(--qf-muted,#6B6358)] text-xs mt-1";
