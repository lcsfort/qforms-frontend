"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardShell } from "@/components/DashboardShell";
import { ChatTopLinks, HeroHeader } from "./_components/HeroHeader";
import { WelcomeMessage } from "./_components/WelcomeMessage";
import { StarterChips } from "./_components/StarterChips";
import { ChatList } from "./_components/ChatList";
import { ErrorBanner } from "./_components/ErrorBanner";
import { PlanQuestionsCard } from "./_components/plan/PlanQuestionsCard";
import { ReadyPlanCard } from "./_components/plan/ReadyPlanCard";
import { ReadyPlanActions } from "./_components/plan/ReadyPlanActions";
import { Composer } from "./_components/composer/Composer";
import {
  PreviewSidebar,
  type PreviewView,
} from "./_components/preview/PreviewSidebar";
import { useAuthGuard } from "./_hooks/useAuthGuard";
import { useUrlPromptBootstrap } from "./_hooks/useUrlPromptBootstrap";
import { useResumeBootstrap } from "./_hooks/useResumeBootstrap";
import { useSessionAutosave } from "./_hooks/useSessionAutosave";
import { usePlanConversation } from "./_hooks/usePlanConversation";

export default function NewFormPage() {
  useAuthGuard();
  const {
    scrollRef,
    composerRef,
    mode,
    prompt,
    setPrompt,
    chatMessages,
    pendingQuestions,
    readyDocument,
    error,
    retryTask,
    capturedDetails,
    firstUserPrompt,
    avatarUrl,
    initials,
    answers,
    allQuestionsAnswered,
    generating,
    submittingAnswers,
    finalizing,
    isBusy,
    composerDisabled,
    primaryButtonDisabled,
    showTyping,
    hasPendingQuestions,
    planSessionId,
    resuming,
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
  } = usePlanConversation();

  useUrlPromptBootstrap(bootstrapFromUrl);
  useResumeBootstrap({ resumeSession, refreshFormContext, bootstrapFromForm });
  useSessionAutosave({
    sessionId: planSessionId,
    chatMessages,
    readySchema: readyDocument,
    title: firstUserPrompt,
    paused: resuming,
  });

  const previewView = useMemo<PreviewView>(() => {
    if (!firstUserPrompt && !isBusy) return { kind: "empty" };
    return {
      kind: "active",
      prompt: firstUserPrompt,
      capturedDetails,
      readyDocument,
      finalizing,
    };
  }, [firstUserPrompt, isBusy, capturedDetails, readyDocument, finalizing]);

  // Pending questions disable the composer, so they must stay visible regardless of the selected mode.
  const showQuestions = hasPendingQuestions && !readyDocument;

  const [chatScrolled, setChatScrolled] = useState(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => setChatScrolled(el.scrollTop > 8);
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [scrollRef]);

  return (
    <DashboardShell
      showSearch={false}
      hideHeader
      contentContainerClassName="flex h-full w-full min-h-0"
      mainClassName="flex-1 overflow-hidden bg-[var(--background)] flex flex-col"
    >
      <section className="flex-1 flex flex-col min-w-0 h-full relative">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[900px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--primary)_8%,transparent),transparent_65%)]" />
        </div>

        <div
          className="absolute top-0 left-0 right-0 z-30 pointer-events-none transition-all duration-200"
          style={{
            background: chatScrolled
              ? "linear-gradient(to bottom, var(--background) 0%, color-mix(in srgb, var(--background) 88%, transparent) 55%, transparent 100%)"
              : "linear-gradient(to bottom, var(--background) 0%, var(--background) 40%, transparent 100%)",
            backdropFilter: chatScrolled ? "blur(14px) saturate(1.15)" : undefined,
            WebkitBackdropFilter: chatScrolled ? "blur(14px) saturate(1.15)" : undefined,
          }}
        >
          <div className="mx-auto w-full max-w-3xl px-6 pt-8 pb-3 sm:pt-9 pointer-events-auto">
            <ChatTopLinks />
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto dashboard-main-scroll relative pt-[76px] sm:pt-[84px]"
        >
          <div className="mx-auto w-full max-w-3xl px-6 pt-1 pb-56 sm:pt-2">
            <HeroHeader />
            <WelcomeMessage />

            {chatMessages.length === 0 && <StarterChips onPick={handleStarter} />}

            {chatMessages.length > 0 && (
              <ChatList
                messages={chatMessages}
                showTyping={showTyping}
                avatarUrl={avatarUrl}
                initials={initials}
              >
                {showQuestions && (
                  <PlanQuestionsCard
                    questions={pendingQuestions}
                    selected={answers.selected}
                    other={answers.other}
                    onToggleOption={answers.toggleOption}
                    onToggleSelectAll={answers.toggleSelectAll}
                    onOtherChange={answers.setOther}
                    onSubmit={handleContinueAnswers}
                    submitting={submittingAnswers}
                    allAnswered={allQuestionsAnswered}
                    generating={generating}
                  />
                )}

                {readyDocument && (
                  <div className="flex items-start gap-4">
                    <div className="h-8 w-8 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <ReadyPlanCard
                        document={readyDocument}
                        actions={
                          <ReadyPlanActions
                            finalizing={finalizing}
                            onFinalize={handleFinalize}
                            onAddMore={handleAddMoreDetails}
                            onStartOver={handleStartOver}
                          />
                        }
                      />
                    </div>
                  </div>
                )}
              </ChatList>
            )}

            {error && (
              <ErrorBanner
                error={error}
                canRetry={Boolean(retryTask)}
                retryDisabled={isBusy}
                onRetry={handleRetry}
                onDismiss={handleDismissError}
              />
            )}
          </div>
        </div>

        <Composer
          ref={composerRef}
          prompt={prompt}
          onPromptChange={setPrompt}
          mode={mode}
          onModeChange={setMode}
          onSubmit={handleGenerate}
          disabled={composerDisabled}
          primaryDisabled={primaryButtonDisabled}
          isBusy={isBusy}
          readySchemaPresent={Boolean(readyDocument)}
          hasPendingQuestions={hasPendingQuestions}
          planSessionActive={Boolean(planSessionId)}
        />
      </section>

      <PreviewSidebar view={previewView} />
    </DashboardShell>
  );
}
