import { useTranslations } from "next-intl";
import type { FormPlanQuestion } from "@/lib/types";
import { getQuestionOptions } from "../../_lib/plan";
import { QuestionChip } from "./QuestionChip";
import { SelectAllChip } from "./SelectAllChip";

type Props = {
  question: FormPlanQuestion;
  selected: string[];
  other: string;
  onToggleOption: (option: string) => void;
  onToggleSelectAll: (options: string[]) => void;
  onOtherChange: (value: string) => void;
};

export function PlanQuestionItem({
  question,
  selected,
  other,
  onToggleOption,
  onToggleSelectAll,
  onOtherChange,
}: Props) {
  const t = useTranslations("forms.generate");

  const options = getQuestionOptions(question);
  const isMulti = question.multi_select === true;
  const hasOptions = options.length > 0;
  const allSelected = hasOptions && options.every((option) => selected.includes(option));

  return (
    <div className="rounded-2xl bg-[var(--card)]/80 border border-[var(--border)]/60 p-4 space-y-3 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[14px] font-medium text-[var(--foreground)] leading-snug">
          {question.question}
        </div>
        {isMulti && hasOptions && (
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full border border-[var(--border)]/60 bg-[var(--surface)]/50 px-2 py-0.5 text-[10.5px] font-medium text-[var(--muted)]">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.4} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {t("planning.multiSelect")}
          </span>
        )}
      </div>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => (
            <QuestionChip
              key={`${question.id}-${option}`}
              label={option}
              selected={selected.includes(option)}
              onClick={() => onToggleOption(option)}
            />
          ))}
          {isMulti && options.length > 1 && (
            <SelectAllChip
              allSelected={allSelected}
              onToggle={() => onToggleSelectAll(options)}
            />
          )}
        </div>
      )}
      <div>
        <input
          type="text"
          value={other}
          placeholder={question.placeholder ?? t("planning.answerPlaceholder")}
          onChange={(e) => onOtherChange(e.target.value)}
          className="w-full bg-transparent text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted)]/70 border-0 border-b border-[var(--border)]/60 focus:border-[var(--primary)]/60 pb-1.5 pt-1 outline-none transition-colors"
        />
        <div className="mt-1 text-[11px] text-[var(--muted)]/80">
          {isMulti ? t("planning.otherLabelMulti") : t("planning.otherLabel")}
        </div>
      </div>
    </div>
  );
}
