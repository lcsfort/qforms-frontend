import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  createForm,
  generateFormSchema,
  getPlanSession,
  refineFormPlan,
  resetPlanningState,
  setSelectedBuildMode,
  startFormPlan,
  submitFormPlanAnswers,
  updateForm,
} from "@/lib/redux/formsSlice";
import { getUserAvatarUrl, getUserInitials } from "@/lib/userAvatar";
import { formToGeneratedSchema } from "@/lib/forms";
import type {
  Form,
  FormBuildMode,
  FormPlanQuestion,
  FormPlanResponse,
  GeneratedFormSchema,
  StoredPlanQaEntry,
  StoredPlanSession,
} from "@/lib/types";
import {
  hydrateChatMessages,
  snapshotMessage,
  textMessage,
  type ChatMessage,
} from "../_lib/chat";
import { toErrorMessage } from "../_lib/errors";
import { buildRefinementBootstrapPrompt } from "../_lib/plan";
import type { CapturedDetail, RetryTask } from "../_lib/types";
import { useScrollToBottom } from "./useScrollToBottom";
import { useQuestionAnswers } from "./useQuestionAnswers";
import type { ComposerHandle } from "../_components/composer/Composer";

export function usePlanConversation() {
  const t = useTranslations("forms.generate");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { generating, selectedBuildMode } = useAppSelector((state) => state.forms);
  const { user } = useAppSelector((state) => state.auth);

  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [planSessionId, setPlanSessionId] = useState<string | null>(null);
  const [pendingQuestions, setPendingQuestions] = useState<FormPlanQuestion[]>([]);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);
  const [capturedDetails, setCapturedDetails] = useState<CapturedDetail[]>([]);
  const [readySchema, setReadySchema] = useState<GeneratedFormSchema | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [retryTask, setRetryTask] = useState<RetryTask | null>(null);
  const [pendingRefinementBase, setPendingRefinementBase] = useState<{
    schema: GeneratedFormSchema;
    originalPrompt: string;
  } | null>(null);
  const [sessionFormId, setSessionFormId] = useState<string | null>(null);
  const [resuming, setResuming] = useState(false);

  const answers = useQuestionAnswers();
  const { reset: resetAnswers, clear: clearAnswers } = answers;

  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<ComposerHandle>(null);

  const mode: FormBuildMode = selectedBuildMode;

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => {
      composerRef.current?.focus();
    });
  }, []);

  const setMode = useCallback(
    (nextMode: FormBuildMode) => {
      if (nextMode === mode) return;
      dispatch(setSelectedBuildMode(nextMode));
    },
    [dispatch, mode],
  );

  const resetConversation = useCallback(() => {
    dispatch(resetPlanningState());
    setError(null);
    setRetryTask(null);
    setChatMessages([]);
    setPlanSessionId(null);
    setPendingQuestions([]);
    clearAnswers();
    setSubmittingAnswers(false);
    setCapturedDetails([]);
    setReadySchema(null);
    setFinalizing(false);
    setPendingRefinementBase(null);
    setSessionFormId(null);
    setResuming(false);
  }, [dispatch, clearAnswers]);

  const createFormFromSchema = useCallback(
    async (schema: GeneratedFormSchema) => {
      // Make sure we have a session so the chat remains resumable. Every
      // mode seeds a session on the first AI call, but this guards the rare
      // case where the user reaches finalize without one (e.g. imported flow).
      let sessionId = planSessionId;
      if (!sessionId) {
        const seed = await dispatch(
          startFormPlan(schema.title || "form"),
        ).unwrap();
        sessionId = seed.sessionId;
        setPlanSessionId(sessionId);
      }

      if (sessionFormId) {
        const updated = await dispatch(
          updateForm({
            id: sessionFormId,
            title: schema.title,
            description: schema.description,
            schema: schema.fields,
            settings: schema.settings as Record<string, unknown>,
            planSessionId: sessionId ?? undefined,
          }),
        ).unwrap();
        router.push(`/dashboard/forms/${updated.id}`);
        return;
      }

      const form = await dispatch(
        createForm({
          title: schema.title,
          description: schema.description,
          schema: schema.fields,
          settings: schema.settings as Record<string, unknown>,
          planSessionId: sessionId ?? undefined,
        }),
      ).unwrap();
      setSessionFormId(form.id);
      router.push(`/dashboard/forms/${form.id}`);
    },
    [dispatch, router, planSessionId, sessionFormId],
  );

  const addAssistantSummary = useCallback((response: FormPlanResponse) => {
    if (response.status !== "questions_needed") return;
    setChatMessages((prev) => [...prev, textMessage("assistant", response.summary)]);
  }, []);

  const enterReadyState = useCallback(
    (schema: GeneratedFormSchema) => {
      setReadySchema(schema);
      setPendingQuestions([]);
      clearAnswers();
      setChatMessages((prev) => [
        ...prev,
        textMessage(
          "assistant",
          `${t("planning.readyMessage")}\n\n${t("ready.assistantPrompt")}`,
        ),
      ]);
    },
    [t, clearAnswers],
  );

  const runGenerateFromUserText = useCallback(
    async (
      text: string,
      effectiveMode: FormBuildMode,
      options?: { isRetry?: boolean },
    ) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const isRetry = options?.isRetry === true;
      setError(null);
      setRetryTask(null);

      try {
        if (effectiveMode === "straight") {
          if (!isRetry) {
            setChatMessages([textMessage("user", trimmed)]);
          }
          const response = await dispatch(generateFormSchema(trimmed)).unwrap();
          setPlanSessionId(response.sessionId);
          enterReadyState(response.schema);
          return;
        }

        if (!isRetry) {
          setChatMessages([textMessage("user", trimmed)]);
          setPendingQuestions([]);
          clearAnswers();
        }
        const response = await dispatch(startFormPlan(trimmed)).unwrap();
        setPlanSessionId(response.sessionId);

        if (response.status === "ready") {
          enterReadyState(response.schema);
          return;
        }

        setPendingQuestions(response.questions);
        resetAnswers(response.questions);
        addAssistantSummary(response);
      } catch (err: unknown) {
        setError(toErrorMessage(err, t("error")));
        setRetryTask({ kind: "generate", text: trimmed, mode: effectiveMode });
      }
    },
    [dispatch, t, enterReadyState, addAssistantSummary, clearAnswers, resetAnswers],
  );

  const runRefineFromUserText = useCallback(
    async (text: string, options?: { isRetry?: boolean }) => {
      if (!planSessionId) return;
      const trimmed = text.trim();
      if (!trimmed) return;
      const isRetry = options?.isRetry === true;
      setError(null);
      setRetryTask(null);
      setReadySchema(null);

      if (!isRetry) {
        setChatMessages((prev) => [...prev, textMessage("user", trimmed)]);
      }

      try {
        const response = await dispatch(
          refineFormPlan({ sessionId: planSessionId, refinement: trimmed }),
        ).unwrap();
        setPlanSessionId(response.sessionId);

        if (response.status === "ready") {
          enterReadyState(response.schema);
          return;
        }

        setPendingQuestions(response.questions);
        resetAnswers(response.questions);
        addAssistantSummary(response);
      } catch (err: unknown) {
        setError(toErrorMessage(err, t("error")));
        setRetryTask({ kind: "refine", text: trimmed });
      }
    },
    [planSessionId, dispatch, t, enterReadyState, addAssistantSummary, resetAnswers],
  );

  const runBootstrapRefinement = useCallback(
    async (
      text: string,
      baseSchema: GeneratedFormSchema,
      originalPrompt: string,
      options?: { isRetry?: boolean },
    ) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const isRetry = options?.isRetry === true;
      setError(null);
      setRetryTask(null);

      if (!isRetry) {
        setChatMessages((prev) => [...prev, textMessage("user", trimmed)]);
      }

      const bootstrapPrompt = buildRefinementBootstrapPrompt(
        originalPrompt,
        baseSchema,
        trimmed,
      );

      try {
        const response = await dispatch(startFormPlan(bootstrapPrompt)).unwrap();
        setPlanSessionId(response.sessionId);
        setPendingRefinementBase(null);

        if (response.status === "ready") {
          enterReadyState(response.schema);
          return;
        }

        setPendingQuestions(response.questions);
        resetAnswers(response.questions);
        addAssistantSummary(response);
      } catch (err: unknown) {
        setError(toErrorMessage(err, t("error")));
        setRetryTask({
          kind: "bootstrapRefine",
          text: trimmed,
          baseSchema,
          originalPrompt,
        });
      }
    },
    [dispatch, t, enterReadyState, addAssistantSummary, resetAnswers],
  );

  const continuePlanning = useCallback(
    async (
      resolvedAnswers: Record<string, string>,
      options?: { isRetry?: boolean },
    ) => {
      if (!planSessionId || submittingAnswers) return;
      const isRetry = options?.isRetry === true;
      setError(null);
      setRetryTask(null);
      setSubmittingAnswers(true);

      if (!isRetry) {
        const answeredPairs: CapturedDetail[] = pendingQuestions.map((q) => ({
          question: q.question,
          answer: resolvedAnswers[q.id] ?? "",
        }));

        setCapturedDetails((prev) => [...prev, ...answeredPairs]);

        const userContent = [
          t("conversation.answersLead"),
          "",
          ...answeredPairs.map((p) => `• ${p.question}\n  ${p.answer}`),
        ].join("\n");

        setChatMessages((prev) => [...prev, textMessage("user", userContent)]);
      }

      try {
        const response = await dispatch(
          submitFormPlanAnswers({
            sessionId: planSessionId,
            answers: resolvedAnswers,
          }),
        ).unwrap();

        if (response.status === "ready") {
          enterReadyState(response.schema);
          return;
        }

        setPlanSessionId(response.sessionId);
        setPendingQuestions(response.questions);
        resetAnswers(response.questions);
        addAssistantSummary(response);
      } catch (err: unknown) {
        setError(toErrorMessage(err, t("error")));
        setRetryTask({ kind: "continue", answers: resolvedAnswers });
      } finally {
        setSubmittingAnswers(false);
      }
    },
    [
      planSessionId,
      submittingAnswers,
      pendingQuestions,
      t,
      dispatch,
      enterReadyState,
      addAssistantSummary,
      resetAnswers,
    ],
  );

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    const current = prompt.trim();
    setPrompt("");
    if (planSessionId && mode === "planning") {
      void runRefineFromUserText(current);
      return;
    }
    if (pendingRefinementBase) {
      void runBootstrapRefinement(
        current,
        pendingRefinementBase.schema,
        pendingRefinementBase.originalPrompt,
      );
      return;
    }
    void runGenerateFromUserText(current, mode);
  }, [
    prompt,
    planSessionId,
    mode,
    pendingRefinementBase,
    runRefineFromUserText,
    runBootstrapRefinement,
    runGenerateFromUserText,
  ]);

  const handleContinueAnswers = useCallback(() => {
    if (submittingAnswers || generating) return;
    const resolved = answers.getResolvedAll(pendingQuestions);
    void continuePlanning(resolved);
  }, [submittingAnswers, generating, answers, pendingQuestions, continuePlanning]);

  const handleFinalize = useCallback(async () => {
    if (!readySchema || finalizing) return;
    setError(null);
    setRetryTask(null);
    setFinalizing(true);
    try {
      await createFormFromSchema(readySchema);
    } catch (err: unknown) {
      setError(toErrorMessage(err, t("error")));
      setRetryTask({ kind: "finalize", schema: readySchema });
      setFinalizing(false);
    }
  }, [readySchema, finalizing, createFormFromSchema, t]);

  const handleRetry = useCallback(() => {
    if (!retryTask) return;
    const task = retryTask;
    setError(null);
    setRetryTask(null);
    switch (task.kind) {
      case "generate":
        void runGenerateFromUserText(task.text, task.mode, { isRetry: true });
        break;
      case "refine":
        void runRefineFromUserText(task.text, { isRetry: true });
        break;
      case "bootstrapRefine":
        void runBootstrapRefinement(
          task.text,
          task.baseSchema,
          task.originalPrompt,
          { isRetry: true },
        );
        break;
      case "continue":
        void continuePlanning(task.answers, { isRetry: true });
        break;
      case "finalize":
        if (finalizing) return;
        setFinalizing(true);
        void createFormFromSchema(task.schema).catch((err: unknown) => {
          setError(toErrorMessage(err, t("error")));
          setRetryTask({ kind: "finalize", schema: task.schema });
          setFinalizing(false);
        });
        break;
    }
  }, [
    retryTask,
    runGenerateFromUserText,
    runRefineFromUserText,
    runBootstrapRefinement,
    continuePlanning,
    finalizing,
    createFormFromSchema,
    t,
  ]);

  const handleDismissError = useCallback(() => {
    setError(null);
    setRetryTask(null);
  }, []);

  const firstUserPrompt = useMemo(() => {
    for (const m of chatMessages) {
      if (m.kind === "text" && m.role === "user") return m.content;
    }
    return "";
  }, [chatMessages]);

  const handleAddMoreDetails = useCallback(() => {
    if (!readySchema) return;
    const archivedSchema = readySchema;
    setChatMessages((prev) => [
      ...prev,
      snapshotMessage(archivedSchema),
      textMessage("assistant", t("ready.addMorePrompt")),
    ]);
    setReadySchema(null);
    // In direct / "straight" mode, every AI call is one-shot, so we must seed
    // a refinement base with the current draft to keep the next message as an
    // edit rather than a fresh form. Planning mode already carries context
    // server-side via refineFormPlan.
    if (mode !== "planning") {
      setPendingRefinementBase({
        schema: archivedSchema,
        originalPrompt: firstUserPrompt,
      });
    }
    focusComposer();
  }, [readySchema, mode, firstUserPrompt, t, focusComposer]);

  const handleStartOver = useCallback(() => {
    resetConversation();
    setPrompt("");
    focusComposer();
  }, [resetConversation, focusComposer]);

  const handleStarter = useCallback(
    (text: string) => {
      setPrompt(text);
      focusComposer();
    },
    [focusComposer],
  );

  const bootstrapFromUrl = useCallback(
    (initialPrompt: string) => {
      dispatch(setSelectedBuildMode("planning"));
      resetConversation();
      setPrompt("");
      void runGenerateFromUserText(initialPrompt, "planning");
    },
    [dispatch, resetConversation, runGenerateFromUserText],
  );

  // Seed the chat for an existing form that has no prior chat session yet.
  // The current form JSON becomes the refinement base so the next message
  // iterates on it instead of generating from scratch, and finalize will
  // update this form rather than creating a new one.
  const bootstrapFromForm = useCallback(
    (form: Form) => {
      if (!form) return;
      resetConversation();
      const liveSchema = formToGeneratedSchema(form);
      setSessionFormId(form.id);
      setChatMessages([
        snapshotMessage(liveSchema),
        textMessage("assistant", t("resume.newChatFromFormPrompt")),
      ]);
      setPendingRefinementBase({
        schema: liveSchema,
        originalPrompt: form.title || "",
      });
      focusComposer();
    },
    [resetConversation, t, focusComposer],
  );

  const resumeSession = useCallback(
    async (sessionId: string): Promise<StoredPlanSession | null> => {
      setResuming(true);
      setError(null);
      setRetryTask(null);
      try {
        const session = await dispatch(getPlanSession(sessionId)).unwrap();
        setPlanSessionId(session.id);
        setSessionFormId(session.formId ?? null);
        setChatMessages(hydrateChatMessages(session.chatMessages));

        // Derive pending questions and captured details from qaHistory.
        const qa: StoredPlanQaEntry[] = Array.isArray(session.qaHistory)
          ? session.qaHistory
          : [];
        const answered: CapturedDetail[] = [];
        const unanswered: FormPlanQuestion[] = [];
        for (const entry of qa) {
          if (!entry || typeof entry !== "object") continue;
          if (entry.answer !== null && entry.answer !== undefined) {
            answered.push({ question: entry.question, answer: entry.answer });
          } else {
            unanswered.push({
              id: entry.questionId,
              question: entry.question,
            });
          }
        }
        setCapturedDetails(answered);
        setPendingQuestions(unanswered);
        if (unanswered.length > 0) {
          // Pending questions only come from planning flows; the stored default mode must not hide them.
          dispatch(setSelectedBuildMode("planning"));
          resetAnswers(unanswered);
        } else {
          clearAnswers();
        }

        if (session.readySchema) {
          setReadySchema(session.readySchema);
        } else {
          setReadySchema(null);
        }

        setPendingRefinementBase(null);
        return session;
      } catch (err: unknown) {
        setError(toErrorMessage(err, t("error")));
        return null;
      } finally {
        setResuming(false);
      }
    },
    [dispatch, t, resetAnswers, clearAnswers],
  );

  const refreshFormContext = useCallback(
    (
      form: Form,
      opts: { lastSyncedFormUpdatedAt: string | null },
    ): void => {
      if (!form) return;
      const lastSyncedIso = opts.lastSyncedFormUpdatedAt;
      const formUpdatedIso = form.updatedAt;
      const hasNewerEdit =
        !lastSyncedIso ||
        new Date(formUpdatedIso).getTime() >
          new Date(lastSyncedIso).getTime();

      const liveSchema = formToGeneratedSchema(form);

      if (hasNewerEdit) {
        // Form was edited outside the chat since we last synced — inject a
        // snapshot so the user sees the current live schema and drop any
        // stale ready card from the resumed state.
        setChatMessages((prev) => [
          ...prev,
          snapshotMessage(liveSchema),
          textMessage("assistant", t("resume.externalEditPrompt")),
        ]);
        setReadySchema(null);
      }

      // Always seed the refinement base so direct-mode follow-ups iterate on
      // the current form rather than generating a brand-new one. In planning
      // mode this is a no-op (refineFormPlan takes precedence via the
      // existing planSessionId).
      setPendingRefinementBase({
        schema: liveSchema,
        originalPrompt: form.title || "",
      });
    },
    [t],
  );

  const hasPendingQuestions = pendingQuestions.length > 0;
  const isBusy = generating || submittingAnswers || finalizing;
  const composerDisabled = Boolean(readySchema) || hasPendingQuestions || isBusy;
  const primaryButtonDisabled = composerDisabled || !prompt.trim();
  const showTyping = (generating || submittingAnswers) && chatMessages.length > 0;

  useScrollToBottom(scrollRef as RefObject<HTMLElement | null>, [
    chatMessages.length,
    hasPendingQuestions,
    isBusy,
    readySchema,
  ]);

  const avatarUrl = user ? getUserAvatarUrl(user) : null;
  const initials = user ? getUserInitials(user) : "";

  const allQuestionsAnswered = useMemo(
    () => answers.areAllAnswered(pendingQuestions),
    [answers, pendingQuestions],
  );

  return {
    // refs
    scrollRef,
    composerRef,
    // view data
    mode,
    prompt,
    setPrompt,
    chatMessages,
    pendingQuestions,
    readySchema,
    error,
    retryTask,
    capturedDetails,
    firstUserPrompt,
    avatarUrl,
    initials,
    // answers
    answers,
    allQuestionsAnswered,
    // flags
    generating,
    submittingAnswers,
    finalizing,
    isBusy,
    composerDisabled,
    primaryButtonDisabled,
    showTyping,
    hasPendingQuestions,
    planSessionId,
    sessionFormId,
    resuming,
    // actions
    setMode,
    handleGenerate,
    handleContinueAnswers,
    handleFinalize,
    handleAddMoreDetails,
    handleStartOver,
    handleRetry,
    handleDismissError,
    handleStarter,
    bootstrapFromUrl,
    bootstrapFromForm,
    resumeSession,
    refreshFormContext,
  } as const;
}
