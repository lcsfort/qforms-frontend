"use client";

import { type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  ArrowRight,
  Briefcase,
  CalendarDays,
  ClipboardList,
  Clock,
  Mail,
  MessageSquare,
  UserPlus,
  Users,
} from "lucide-react";

type TemplateId =
  | "contact"
  | "feedback"
  | "event"
  | "booking"
  | "job"
  | "lead"
  | "survey"
  | "onboarding";

const TEMPLATES: Array<{ id: TemplateId; icon: ComponentType<{ className?: string; strokeWidth?: number }> }> = [
  { id: "lead", icon: UserPlus },
  { id: "feedback", icon: MessageSquare },
  { id: "event", icon: CalendarDays },
  { id: "booking", icon: Clock },
  { id: "job", icon: Briefcase },
  { id: "contact", icon: Mail },
  { id: "survey", icon: ClipboardList },
  { id: "onboarding", icon: Users },
];

export function TemplateShortcuts() {
  const t = useTranslations("dashboard.templates");
  const router = useRouter();

  const openTemplate = (id: TemplateId) => {
    const prompt = t(`${id}.prompt`);
    router.push(`/dashboard/forms/new?prompt=${encodeURIComponent(prompt)}`);
  };

  return (
    <section id="templates" aria-labelledby="templates-title" className="scroll-mt-24">
      <div className="mb-4">
        <h2 id="templates-title" className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">
          {t("title")}
        </h2>
        <p className="mt-0.5 text-[13px] text-[var(--muted)]">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {TEMPLATES.map((template) => {
          const Icon = template.icon;
          const name = t(`${template.id}.name`);
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => openTemplate(template.id)}
              aria-label={t("use", { name })}
              className="group relative flex flex-col gap-2.5 rounded-2xl border border-[var(--border)]/85 bg-[var(--card)]/75 p-4 text-left transition-all duration-150 hover:-translate-y-px hover:border-[var(--primary)]/30 hover:bg-[var(--card)] hover:shadow-[0_8px_22px_-14px_rgba(35,32,27,0.25)] cursor-pointer"
            >
              <span className="flex items-center justify-between">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)]/70 bg-[var(--surface)]/60 text-[var(--primary)]/80 transition-colors group-hover:text-[var(--primary)]">
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <ArrowRight
                  className="h-3.5 w-3.5 -translate-x-1 text-[var(--muted)] opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100"
                  strokeWidth={2}
                />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[13.5px] font-semibold text-[var(--foreground)]">{name}</span>
                <span className="mt-0.5 block text-[11.5px] leading-snug text-[var(--muted)]">
                  {t(`${template.id}.desc`)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
