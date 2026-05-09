"use client";

import type { CSSProperties, ReactNode } from "react";

interface FieldShellProps {
  id: string;
  label: string;
  description?: string;
  helpText?: string;
  required?: boolean;
  error?: string;
  labelStyle?: CSSProperties;
  helpTextStyle?: CSSProperties;
  className?: string;
  children: ReactNode;
}

export function FieldShell({
  id,
  label,
  description,
  helpText,
  required,
  error,
  labelStyle,
  helpTextStyle,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-[var(--qf-label,#1f2937)] mb-1.5"
        style={labelStyle}
      >
        {label}
        {required ? (
          <span className="text-[var(--qf-danger,#dc2626)] ml-0.5">*</span>
        ) : null}
      </label>
      {description ? (
        <p className="text-xs text-[var(--qf-muted,#6b7280)] mb-2">{description}</p>
      ) : null}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[var(--qf-danger,#dc2626)] text-xs mt-1.5"
        >
          {error}
        </p>
      ) : helpText ? (
        <p
          id={`${id}-help`}
          className="text-[var(--qf-muted,#6b7280)] text-xs mt-1.5"
          style={helpTextStyle}
        >
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

