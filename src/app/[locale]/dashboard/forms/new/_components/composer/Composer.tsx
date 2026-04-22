"use client";

import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type KeyboardEvent,
} from "react";
import { useTranslations } from "next-intl";
import type { FormBuildMode } from "@/lib/types";
import { useAutosizeTextarea } from "../../_hooks/useAutosizeTextarea";
import { ComposerModeToggle } from "./ComposerModeToggle";
import { ComposerHintRow } from "./ComposerHintRow";

export type ComposerHandle = {
  focus: () => void;
};

type Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
  mode: FormBuildMode;
  onModeChange: (mode: FormBuildMode) => void;
  onSubmit: () => void;
  disabled: boolean;
  primaryDisabled: boolean;
  isBusy: boolean;
  readySchemaPresent: boolean;
  hasPendingQuestions: boolean;
  planSessionActive: boolean;
};

export const Composer = forwardRef<ComposerHandle, Props>(function Composer(
  {
    prompt,
    onPromptChange,
    mode,
    onModeChange,
    onSubmit,
    disabled,
    primaryDisabled,
    isBusy,
    readySchemaPresent,
    hasPendingQuestions,
    planSessionActive,
  },
  ref,
) {
  const t = useTranslations("forms.generate");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useAutosizeTextarea(textareaRef, prompt);

  useImperativeHandle(
    ref,
    () => ({
      focus: () => textareaRef.current?.focus(),
    }),
    [],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSubmit();
    }
  };

  const placeholder = readySchemaPresent
    ? t("ready.description")
    : hasPendingQuestions
      ? t("conversation.continueHint")
      : planSessionActive && mode === "planning"
        ? t("composer.refinePlaceholder")
        : t("placeholder");

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 pt-16 pb-6 bg-gradient-to-t from-[var(--background)] via-[var(--background)]/92 to-transparent">
      <div className="pointer-events-auto mx-auto w-full max-w-3xl px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className={`group relative rounded-[26px] border bg-[var(--card)]/95 backdrop-blur-xl shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_18px_44px_-28px_rgba(16,13,28,0.45)] transition-all ${
            disabled
              ? "border-[var(--border)]/40 opacity-70"
              : "border-[var(--border)]/70 focus-within:border-[var(--primary)]/40 focus-within:shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-30px_rgba(139,92,246,0.35)]"
          }`}
        >
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            className="block w-full resize-none bg-transparent px-5 pt-4 pb-2 text-[15px] leading-[1.55] text-[var(--foreground)] placeholder:text-[var(--muted)]/70 outline-none min-h-[56px] max-h-[240px] disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between gap-3 px-3 pb-3">
            <ComposerModeToggle mode={mode} onChange={onModeChange} />
            <button
              type="submit"
              disabled={primaryDisabled}
              aria-label={t("composer.send")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--primary)] text-white transition-all hover:bg-[var(--primary-dark)] disabled:bg-[var(--surface)] disabled:text-[var(--muted)] disabled:cursor-not-allowed shadow-[0_6px_18px_-6px_rgba(139,92,246,0.5)] disabled:shadow-none"
            >
              {isBusy ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0-6 6m6-6 6 6" />
                </svg>
              )}
            </button>
          </div>
        </form>
        <ComposerHintRow
          mode={mode}
          readySchemaPresent={readySchemaPresent}
          hasPendingQuestions={hasPendingQuestions}
          planSessionActive={planSessionActive}
        />
      </div>
    </div>
  );
});
