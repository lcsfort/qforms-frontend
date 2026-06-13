"use client";

import { useState } from "react";
import { useNow, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { SparkleIcon } from "@/components/icons/SparkleIcon";
import { LayoutTemplate, MessageSquare, PenLine } from "lucide-react";

type DashboardHeroProps = {
  name: string | null;
  creatingBlank: boolean;
  blankError: string | null;
  onStartBlank: () => void;
};

function greetingKey(hour: number): "greetingMorning" | "greetingAfternoon" | "greetingEvening" {
  if (hour < 12) return "greetingMorning";
  if (hour < 18) return "greetingAfternoon";
  return "greetingEvening";
}

export function DashboardHero({ name, creatingBlank, blankError, onStartBlank }: DashboardHeroProps) {
  const t = useTranslations("dashboard");
  const now = useNow();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");

  const submitPrompt = () => {
    const trimmed = prompt.trim();
    if (trimmed) {
      router.push(`/dashboard/forms/new?prompt=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/dashboard/forms/new");
    }
  };

  const quickStarts = [
    {
      key: "scratch",
      label: t("quickStartScratch"),
      description: t("quickStartScratchDesc"),
      icon: PenLine,
      onClick: onStartBlank,
      busy: creatingBlank,
    },
    {
      key: "template",
      label: t("quickStartTemplate"),
      description: t("quickStartTemplateDesc"),
      icon: LayoutTemplate,
      onClick: () => router.push("/dashboard/templates"),
      busy: false,
    },
    {
      key: "ai",
      label: t("quickStartAi"),
      description: t("quickStartAiDesc"),
      icon: MessageSquare,
      onClick: () => router.push("/dashboard/forms/new"),
      busy: false,
    },
  ] as const;

  return (
    <section className="hero-aurora pt-2">
      <div className="pointer-events-none absolute inset-x-0 top-[-72px] z-0 h-[240px] overflow-hidden">
        <div className="hero-atmosphere-mesh" />
      </div>

      <div className="relative">
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-tight text-[var(--foreground)] sm:text-[32px]">
          {t(greetingKey(now.getHours()), {
            hasName: name?.trim() ? "true" : "false",
            name: name?.trim() ?? "",
          })}
        </h1>
        <p className="mt-1.5 text-[15px] text-[var(--muted)]">{t("heroQuestion")}</p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitPrompt();
          }}
          className="mt-6"
        >
          <div className="ai-prompt-glow soft-card transition-colors">
            <label htmlFor="dashboard-create-prompt" className="sr-only">
              {t("promptLabel")}
            </label>
            <div className="flex items-start gap-3 px-4 pt-3.5 sm:px-5">
              <SparkleIcon className="mt-1 h-5 w-5 shrink-0 text-[var(--primary)]" />
              <textarea
                id="dashboard-create-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                    event.preventDefault();
                    submitPrompt();
                  }
                }}
                rows={2}
                placeholder={t("promptPlaceholder")}
                className="min-h-[56px] w-full resize-none bg-transparent pt-0.5 text-[14.5px] leading-relaxed text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
              />
            </div>
            <div className="flex items-center justify-between gap-3 px-4 pb-3 pt-1 sm:px-5">
              <span className="hidden text-[11.5px] text-[var(--muted)] sm:block">{t("promptHint")}</span>
              <button
                type="submit"
                className="cta-gradient ml-auto inline-flex h-9 items-center justify-center gap-2 rounded-xl px-4 text-[13px] font-semibold text-white"
              >
                <SparkleIcon className="h-4 w-4 shrink-0" />
                {t("generateForm")}
              </button>
            </div>
          </div>
        </form>

        <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {quickStarts.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                onClick={action.onClick}
                disabled={action.busy}
                className="group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-3.5 py-3 text-left shadow-[0_1px_2px_rgba(35,32,27,0.025),0_2px_7px_-6px_rgba(35,32,27,0.07)] transition-all duration-150 hover:-translate-y-px hover:border-[var(--primary)]/25 hover:shadow-[0_2px_6px_-4px_rgba(35,32,27,0.06),0_8px_16px_-12px_rgba(35,32,27,0.11)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)]/70 text-[var(--primary)]/80 transition-colors group-hover:text-[var(--primary)]">
                  {action.busy ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--primary)]/25 border-t-[var(--primary)]" />
                  ) : (
                    <Icon className="h-4 w-4" strokeWidth={1.8} />
                  )}
                </span>
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold leading-snug text-[var(--foreground)]">
                    {action.label}
                  </span>
                  <span className="block text-[11.5px] leading-snug text-[var(--muted)] line-clamp-2">
                    {action.description}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {blankError && (
          <p role="alert" className="mt-2.5 text-xs text-red-600 dark:text-red-400">
            {blankError}
          </p>
        )}
      </div>
    </section>
  );
}
