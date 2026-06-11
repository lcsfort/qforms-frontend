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
        className="block text-sm font-medium text-[var(--qf-label,#23201B)] mb-1.5"
        style={labelStyle}
      >
        {label}
        {required ? (
          <span className="text-[var(--qf-danger,#C0473A)] ml-0.5">*</span>
        ) : null}
      </label>
      {description ? (
        <p className="text-xs text-[var(--qf-muted,#6B6358)] mb-2">{description}</p>
      ) : null}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-[var(--qf-danger,#C0473A)] text-xs mt-1.5"
        >
          {error}
        </p>
      ) : helpText ? (
        <p
          id={`${id}-help`}
          className="text-[var(--qf-muted,#6B6358)] text-xs mt-1.5"
          style={helpTextStyle}
        >
          {helpText}
        </p>
      ) : null}
    </div>
  );
}

