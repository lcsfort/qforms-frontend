import { useCallback, useMemo, useState } from "react";
import type { FormPlanQuestion } from "@/lib/types";
import { resolveAnswer } from "../_lib/plan";

export type QuestionAnswers = {
  selected: Record<string, string[]>;
  other: Record<string, string>;
  reset: (questions: FormPlanQuestion[]) => void;
  clear: () => void;
  toggleOption: (questionId: string, option: string, isMulti: boolean) => void;
  toggleSelectAll: (questionId: string, options: string[]) => void;
  setOther: (questionId: string, value: string) => void;
  getResolved: (question: FormPlanQuestion) => string;
  getResolvedAll: (questions: FormPlanQuestion[]) => Record<string, string>;
  areAllAnswered: (questions: FormPlanQuestion[]) => boolean;
};

export function useQuestionAnswers(): QuestionAnswers {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [other, setOther] = useState<Record<string, string>>({});

  const reset = useCallback((questions: FormPlanQuestion[]) => {
    setSelected(
      questions.reduce<Record<string, string[]>>((acc, question) => {
        acc[question.id] = [];
        return acc;
      }, {}),
    );
    setOther(
      questions.reduce<Record<string, string>>((acc, question) => {
        acc[question.id] = "";
        return acc;
      }, {}),
    );
  }, []);

  const clear = useCallback(() => {
    setSelected({});
    setOther({});
  }, []);

  const toggleOption = useCallback(
    (questionId: string, option: string, isMulti: boolean) => {
      setSelected((prev) => {
        const current = prev[questionId] ?? [];
        if (!isMulti) {
          return {
            ...prev,
            [questionId]: current[0] === option ? [] : [option],
          };
        }
        const next = current.includes(option)
          ? current.filter((value) => value !== option)
          : [...current, option];
        return { ...prev, [questionId]: next };
      });
    },
    [],
  );

  const toggleSelectAll = useCallback(
    (questionId: string, options: string[]) => {
      setSelected((prev) => {
        const current = prev[questionId] ?? [];
        const allSelected = options.every((option) => current.includes(option));
        return { ...prev, [questionId]: allSelected ? [] : [...options] };
      });
    },
    [],
  );

  const setOtherValue = useCallback((questionId: string, value: string) => {
    setOther((prev) => ({ ...prev, [questionId]: value }));
  }, []);

  const getResolved = useCallback(
    (question: FormPlanQuestion) =>
      resolveAnswer(question, selected[question.id] ?? [], other[question.id] ?? ""),
    [selected, other],
  );

  const getResolvedAll = useCallback(
    (questions: FormPlanQuestion[]) =>
      questions.reduce<Record<string, string>>((acc, question) => {
        acc[question.id] = getResolved(question);
        return acc;
      }, {}),
    [getResolved],
  );

  const areAllAnswered = useCallback(
    (questions: FormPlanQuestion[]) => {
      if (questions.length === 0) return false;
      return questions.every((question) => getResolved(question).length > 0);
    },
    [getResolved],
  );

  return useMemo(
    () => ({
      selected,
      other,
      reset,
      clear,
      toggleOption,
      toggleSelectAll,
      setOther: setOtherValue,
      getResolved,
      getResolvedAll,
      areAllAnswered,
    }),
    [selected, other, reset, clear, toggleOption, toggleSelectAll, setOtherValue, getResolved, getResolvedAll, areAllAnswered],
  );
}
