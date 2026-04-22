"use client";

import { useEffect, useCallback, useState } from "react";

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant?: "danger" | "primary";
  /** When set, user must type this string (trimmed equality) before confirm is enabled. */
  confirmMatchText?: string;
  /** Shown above the match input when `confirmMatchText` is set. */
  confirmMatchInstruction?: string;
  /** Accessible name for the confirmation input (label + aria-label). */
  confirmMatchInputLabel?: string;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = "primary",
  confirmMatchText,
  confirmMatchInstruction,
  confirmMatchInputLabel,
}: ConfirmDialogProps) {
  const [matchDraft, setMatchDraft] = useState("");

  const requiresMatch = confirmMatchText !== undefined;
  const matchOk =
    !requiresMatch ||
    matchDraft.trim() === (confirmMatchText as string).trim();

  useEffect(() => {
    if (!open) {
      setMatchDraft("");
      return;
    }
    setMatchDraft("");
  }, [open, confirmMatchText]);

  const handleConfirm = useCallback(() => {
    if (requiresMatch && !matchOk) return;
    void Promise.resolve(onConfirm()).then(() => onClose());
  }, [onConfirm, onClose, requiresMatch, matchOk]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const confirmClass =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-indigo-600 hover:bg-indigo-700 text-white";

  const confirmDisabled = requiresMatch && !matchOk;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
      aria-describedby={
        requiresMatch && confirmMatchInstruction
          ? "confirm-dialog-description confirm-dialog-match-instruction"
          : "confirm-dialog-description"
      }
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Enter" && onClose()}
      />
      <div
        className="relative w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          className="text-lg font-semibold text-[var(--foreground)]"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-description"
          className="mt-2 text-sm text-[var(--muted)]"
        >
          {message}
        </p>
        {requiresMatch && confirmMatchInstruction && (
          <p
            id="confirm-dialog-match-instruction"
            className="mt-3 text-sm text-[var(--foreground)]"
          >
            {confirmMatchInstruction}
          </p>
        )}
        {requiresMatch && (
          <div className="mt-3 space-y-2">
            <div
              className="rounded-lg border border-[var(--border)] bg-[var(--background)]/50 px-3 py-2 font-mono text-sm text-[var(--foreground)] break-all"
              aria-hidden
            >
              {confirmMatchText}
            </div>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[var(--muted)]">
                {confirmMatchInputLabel ?? "Confirm"}
              </span>
              <input
                type="text"
                value={matchDraft}
                onChange={(e) => setMatchDraft(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                aria-label={confirmMatchInputLabel ?? "Confirmation"}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--background)]/40 px-3 py-2 text-sm text-[var(--foreground)] outline-none transition-colors focus:border-[var(--primary)]/60 focus:ring-2 focus:ring-[var(--primary)]/20"
              />
            </label>
          </div>
        )}
        <div className="mt-6 flex flex-row justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirmDisabled}
            className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${confirmClass} ${
              confirmDisabled
                ? "cursor-not-allowed opacity-50 hover:bg-red-600"
                : ""
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
