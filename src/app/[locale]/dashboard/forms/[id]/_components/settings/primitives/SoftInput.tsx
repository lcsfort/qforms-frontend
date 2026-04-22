"use client";

import { forwardRef, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

export const SoftInput = forwardRef<HTMLInputElement, InputProps>(
  function SoftInput({ className = "", invalid = false, ...props }, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className={`w-full rounded-xl border bg-[var(--background)]/40 px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70 outline-none transition-all duration-150 ${
          invalid
            ? "border-red-400/60 focus:border-red-500 focus:ring-2 focus:ring-red-400/30"
            : "border-[var(--border)] focus:border-[var(--primary)]/60 focus:ring-2 focus:ring-[var(--primary)]/25"
        } ${className}`}
      />
    );
  },
);

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const SoftTextarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function SoftTextarea({ className = "", invalid = false, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        {...props}
        className={`w-full rounded-xl border bg-[var(--background)]/40 px-3.5 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70 outline-none transition-all duration-150 resize-none ${
          invalid
            ? "border-red-400/60 focus:border-red-500 focus:ring-2 focus:ring-red-400/30"
            : "border-[var(--border)] focus:border-[var(--primary)]/60 focus:ring-2 focus:ring-[var(--primary)]/25"
        } ${className}`}
      />
    );
  },
);
