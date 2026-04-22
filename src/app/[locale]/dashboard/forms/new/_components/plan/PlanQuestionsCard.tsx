import { useTranslations } from "next-intl";
import type { FormPlanQuestion } from "@/lib/types";
import { PlanQuestionItem } from "./PlanQuestionItem";

type Props = {
  questions: FormPlanQuestion[];
  selected: Record<string, string[]>;
  other: Record<string, string>;
  onToggleOption: (questionId: string, option: string, isMulti: boolean) => void;
  onToggleSelectAll: (questionId: string, options: string[]) => void;
  onOtherChange: (questionId: string, value: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  allAnswered: boolean;
  generating: boolean;
};

export function PlanQuestionsCard({
  questions,
  selected,
  other,
  onToggleOption,
  onToggleSelectAll,
  onOtherChange,
  onSubmit,
  submitting,
  allAnswered,
  generating,
}: Props) {
  const t = useTranslations("forms.generate");

  const submitDisabled = !allAnswered || submitting || generating;

  return (
    <div className="flex items-start gap-4">
      <div className="h-8 w-8 shrink-0" />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          {t("planning.answerPrompt")}
        </div>
        {questions.map((question) => {
          const isMulti = question.multi_select === true;
          return (
            <PlanQuestionItem
              key={question.id}
              question={question}
              selected={selected[question.id] ?? []}
              other={other[question.id] ?? ""}
              onToggleOption={(option) => onToggleOption(question.id, option, isMulti)}
              onToggleSelectAll={(options) => onToggleSelectAll(question.id, options)}
              onOtherChange={(value) => onOtherChange(question.id, value)}
            />
          );
        })}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="text-[12px] text-[var(--muted)]">
            {submitting
              ? t("conversation.sending")
              : allAnswered
                ? t("conversation.continueReady")
                : t("conversation.continueIncomplete")}
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitDisabled}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] text-white px-4 py-2 text-[13px] font-medium transition-all hover:bg-[var(--primary-dark)] disabled:bg-[var(--surface)] disabled:text-[var(--muted)] disabled:cursor-not-allowed shadow-[0_8px_22px_-10px_rgba(139,92,246,0.55)] disabled:shadow-none"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t("conversation.sending")}
              </>
            ) : (
              <>
                {t("conversation.continue")}
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
