"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  createForm,
  generateFormSchema,
  resetPlanningState,
  setSelectedBuildMode,
  startFormPlan,
  submitFormPlanAnswers,
} from "@/lib/redux/formsSlice";
import type {
  FormBuildMode,
  FormPlanQuestion,
  FormPlanResponse,
  GeneratedFormSchema,
} from "@/lib/types";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function getQuestionOptions(question: FormPlanQuestion): string[] {
  const fromBackend = Array.isArray(question.options)
    ? question.options
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0)
        .slice(0, 6)
    : [];
  if (fromBackend.length > 0) return fromBackend;

  // Fallback for older planner responses that only include examples in question text.
  const exampleMatch = question.question.match(/\((?:Ex|ex)\s*:\s*([^)]+)\)/);
  if (!exampleMatch) return [];
  const parsed = exampleMatch[1]
    .split(",")
    .map((opt) => opt.trim())
    .filter((opt) => opt.length > 1 && opt.toLowerCase() !== "etc.");
  return Array.from(new Set(parsed)).slice(0, 6);
}

export default function NewFormPage() {
  const t = useTranslations("forms.generate");
  const te = useTranslations("forms.editor");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { generating, selectedBuildMode } = useAppSelector((state) => state.forms);
  const { token, hydrated } = useAppSelector((state) => state.auth);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [planSessionId, setPlanSessionId] = useState<string | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<FormPlanQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [otherAnswers, setOtherAnswers] = useState<Record<string, string>>({});
  const [autoSubmitting, setAutoSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
    }
  }, [hydrated, token, router]);

  const mode: FormBuildMode = selectedBuildMode;

  const setMode = (nextMode: FormBuildMode) => {
    dispatch(setSelectedBuildMode(nextMode));
    dispatch(resetPlanningState());
    setError(null);
    setChatMessages([]);
    setPlanSessionId(null);
    setPendingQuestions([]);
    setSelectedAnswers({});
    setOtherAnswers({});
    setAutoSubmitting(false);
  };

  const createFormFromSchema = async (schema: GeneratedFormSchema) => {
    const form = await dispatch(
      createForm({
        title: schema.title,
        description: schema.description,
        schema: schema.fields,
        settings: schema.settings as Record<string, unknown>,
      }),
    ).unwrap();
    router.push(`/dashboard/forms/${form.id}`);
  };

  const addAssistantQuestionsToChat = (response: FormPlanResponse) => {
    if (response.status !== "questions_needed") return;
    const questionList = response.questions
      .map((q, idx) => `${idx + 1}. ${q.question}`)
      .join("\n");
    setChatMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `${response.summary}\n\n${questionList}`,
      },
    ]);
  };

  const continuePlanning = async (resolvedAnswers: Record<string, string>) => {
    if (!planSessionId || autoSubmitting) return;
    setAutoSubmitting(true);

    setChatMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: pendingQuestions
          .map((q) => `${q.question}\n${resolvedAnswers[q.id] ?? ""}`)
          .join("\n\n"),
      },
    ]);

    try {
      const response = await dispatch(
        submitFormPlanAnswers({
          sessionId: planSessionId,
          answers: resolvedAnswers,
        }),
      ).unwrap();

      if (response.status === "ready") {
        setPendingQuestions([]);
        setSelectedAnswers({});
        setOtherAnswers({});
        setChatMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: t("planning.readyMessage"),
          },
        ]);
        await createFormFromSchema(response.schema);
        return;
      }

      setPlanSessionId(response.sessionId);
      setPendingQuestions(response.questions);
      setSelectedAnswers(
        response.questions.reduce<Record<string, string>>((acc, question) => {
          acc[question.id] = "";
          return acc;
        }, {}),
      );
      setOtherAnswers(
        response.questions.reduce<Record<string, string>>((acc, question) => {
          acc[question.id] = "";
          return acc;
        }, {}),
      );
      addAssistantQuestionsToChat(response);
    } catch (err: unknown) {
      const e = err as string | { message?: string };
      setError(typeof e === "string" ? e : e?.message ?? t("error"));
    } finally {
      setAutoSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setError(null);

    try {
      if (mode === "straight") {
        const schema = await dispatch(generateFormSchema(prompt)).unwrap();
        await createFormFromSchema(schema);
        return;
      }

      setChatMessages([
        {
          id: crypto.randomUUID(),
          role: "user",
          content: prompt.trim(),
        },
      ]);
      setPendingQuestions([]);
      setSelectedAnswers({});
      setOtherAnswers({});
      const response = await dispatch(startFormPlan(prompt.trim())).unwrap();
      setPlanSessionId(response.sessionId);

      if (response.status === "ready") {
        setChatMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            content: t("planning.readyMessage"),
          },
        ]);
        await createFormFromSchema(response.schema);
        return;
      }

      setPendingQuestions(response.questions);
      setSelectedAnswers(
        response.questions.reduce<Record<string, string>>((acc, question) => {
          acc[question.id] = "";
          return acc;
        }, {}),
      );
      setOtherAnswers(
        response.questions.reduce<Record<string, string>>((acc, question) => {
          acc[question.id] = "";
          return acc;
        }, {}),
      );
      addAssistantQuestionsToChat(response);
    } catch (err: unknown) {
      const e = err as string | { message?: string };
      setError(typeof e === "string" ? e : e?.message ?? t("error"));
    }
  };

  const getResolvedAnswer = (question: FormPlanQuestion) => {
    const other = (otherAnswers[question.id] ?? "").trim();
    if (other.length > 0) return other;
    return (selectedAnswers[question.id] ?? "").trim();
  };

  const allQuestionsAnswered = useMemo(() => {
    if (pendingQuestions.length === 0) return false;
    return pendingQuestions.every((question) => getResolvedAnswer(question).length > 0);
  }, [pendingQuestions, selectedAnswers, otherAnswers]);

  useEffect(() => {
    if (mode !== "planning") return;
    if (!allQuestionsAnswered || !planSessionId || generating || autoSubmitting) return;
    const resolvedAnswers = pendingQuestions.reduce<Record<string, string>>((acc, question) => {
      acc[question.id] = getResolvedAnswer(question);
      return acc;
    }, {});
    void continuePlanning(resolvedAnswers);
  }, [
    allQuestionsAnswered,
    planSessionId,
    generating,
    autoSubmitting,
    pendingQuestions,
    selectedAnswers,
    otherAnswers,
    mode,
  ]);

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="max-w-2xl mx-auto px-6 pt-16 pb-12">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {te("backToForms")}
        </Link>

        <h1 className="text-3xl font-bold mb-2">{t("title")}</h1>
        <p className="text-[var(--muted)] mb-8">{t("subtitle")}</p>

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
          <div className="inline-flex p-1 rounded-xl bg-[var(--background)] border border-[var(--border)] mb-4">
            <button
              type="button"
              onClick={() => setMode("planning")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === "planning"
                  ? "bg-indigo-600 text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t("planning.mode")}
            </button>
            <button
              type="button"
              onClick={() => setMode("straight")}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                mode === "straight"
                  ? "bg-indigo-600 text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {t("planning.straightMode")}
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t("placeholder")}
            rows={5}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-y"
          />

          {mode === "planning" && chatMessages.length > 0 && (
            <div className="mt-4 rounded-xl border border-[var(--border)] p-4 space-y-3 bg-[var(--background)]">
              {chatMessages.map((message) => (
                <div
                  key={message.id}
                  className={`text-sm px-3 py-2 rounded-lg whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white ml-8"
                      : "bg-[var(--card)] border border-[var(--border)] mr-8"
                  }`}
                >
                  {message.content}
                </div>
              ))}
            </div>
          )}

          {mode === "planning" && pendingQuestions.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-[var(--muted)]">{t("planning.answerPrompt")}</p>
              {pendingQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <label className="text-sm font-medium">{question.question}</label>
                  {getQuestionOptions(question).length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {getQuestionOptions(question).map((option) => {
                        const selected = selectedAnswers[question.id] === option;
                        return (
                          <button
                            key={`${question.id}-${option}`}
                            type="button"
                            onClick={() =>
                              setSelectedAnswers((prev) => ({ ...prev, [question.id]: option }))
                            }
                            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                              selected
                                ? "bg-indigo-600 text-white border-indigo-600"
                                : "bg-[var(--card)] border-[var(--border)] hover:border-indigo-500"
                            }`}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-xs text-[var(--muted)]">{t("planning.otherLabel")}</p>
                    <input
                      type="text"
                      value={otherAnswers[question.id] ?? ""}
                      placeholder={question.placeholder ?? t("planning.answerPlaceholder")}
                      onChange={(e) =>
                        setOtherAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}
              {allQuestionsAnswered && (
                <p className="text-xs text-[var(--muted)]">{t("planning.autoContinue")}</p>
              )}
            </div>
          )}

          {error && (
            <div className="mt-3 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={
              generating ||
              !prompt.trim() ||
              (mode === "planning" && pendingQuestions.length > 0)
            }
            className="mt-4 w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
          >
            {generating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {t("generating")}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                </svg>
                {mode === "planning" && pendingQuestions.length > 0
                  ? t("planning.awaitingAnswers")
                  : mode === "planning"
                    ? t("planning.startButton")
                    : t("submit")}
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
