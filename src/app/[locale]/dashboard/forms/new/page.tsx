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
  const hasPendingQuestions = pendingQuestions.length > 0;
  const primaryButtonDisabled =
    generating || !prompt.trim() || (mode === "planning" && hasPendingQuestions);

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
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.18),transparent_56%),var(--background)] relative overflow-x-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 -right-24 h-72 w-72 rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute top-56 -left-24 h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
      </div>

      <main className="relative max-w-4xl mx-auto px-6 pt-14 pb-14">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-8"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {te("backToForms")}
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-200/70 dark:border-indigo-900/70 bg-white/80 dark:bg-black/20 text-xs text-indigo-700 dark:text-indigo-300 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            {t("premiumBadge")}
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-2">{t("title")}</h1>
          <p className="text-[var(--muted)] max-w-2xl">{t("subtitle")}</p>
        </div>

        <section className="rounded-3xl border border-[var(--border)]/80 bg-[var(--card)]/95 backdrop-blur-xl shadow-[0_24px_60px_-36px_rgba(79,70,229,0.55)] p-5 md:p-7 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="inline-flex p-1 rounded-2xl bg-[var(--background)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setMode("planning")}
                className={`px-4 py-2 text-sm rounded-xl transition-colors ${
                  mode === "planning"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t("planning.mode")}
              </button>
              <button
                type="button"
                onClick={() => setMode("straight")}
                className={`px-4 py-2 text-sm rounded-xl transition-colors ${
                  mode === "straight"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t("planning.straightMode")}
              </button>
            </div>
            <p className="text-xs md:text-sm text-[var(--muted)]">
              {mode === "planning" ? t("planning.modeHint") : t("straightModeHint")}
            </p>
          </div>

          <div className="rounded-2xl border border-indigo-100/80 dark:border-indigo-900/50 bg-white/70 dark:bg-gray-900/60 p-4">
            <label className="text-sm font-medium block mb-2">{t("promptLabel")}</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t("placeholder")}
              rows={5}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 resize-y"
            />
            <p className="mt-2 text-xs text-[var(--muted)]">{t("promptHint")}</p>
          </div>

          {mode === "planning" && chatMessages.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)]/70 p-4">
              <p className="text-xs uppercase tracking-wide text-[var(--muted)] mb-3">{t("planning.conversationTitle")}</p>
              <div className="space-y-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`text-sm px-3.5 py-2.5 rounded-xl whitespace-pre-wrap ${
                      message.role === "user"
                        ? "bg-indigo-600 text-white ml-8"
                        : "bg-[var(--card)] border border-[var(--border)] mr-8"
                    }`}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
            </div>
          )}

          {mode === "planning" && hasPendingQuestions && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)]/70 p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{t("planning.answerPrompt")}</p>
                {allQuestionsAnswered && (
                  <span className="px-2.5 py-1 rounded-full text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {t("planning.autoContinueLabel")}
                  </span>
                )}
              </div>
              {pendingQuestions.map((question) => (
                <div key={question.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-3.5 space-y-2.5">
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
                  <div className="space-y-1.5">
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
            <div className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={primaryButtonDisabled}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
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
                {mode === "planning" && hasPendingQuestions
                  ? t("planning.awaitingAnswers")
                  : mode === "planning"
                    ? t("planning.startButton")
                    : t("submit")}
              </>
            )}
          </button>
        </section>
      </main>
    </div>
  );
}
