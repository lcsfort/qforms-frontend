import type { FormField } from "@/lib/types";

export interface FieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
  labelClassName?: string;
}

export const DEFAULT_LABEL_CLASS =
  "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

export const DEFAULT_INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500";

export const DEFAULT_ERROR_CLASS = "text-red-500 text-xs mt-1";

export const DEFAULT_HELP_CLASS =
  "text-gray-500 dark:text-gray-400 text-xs mt-1";
