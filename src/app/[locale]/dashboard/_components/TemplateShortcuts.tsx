"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { ArrowRight } from "lucide-react";
import { TemplateCard } from "./TemplateCard";
import { FEATURED_TEMPLATE_IDS } from "../_lib/templates";
import { useTemplateCreator } from "../_lib/useTemplateCreator";

export function TemplateShortcuts() {
  const t = useTranslations("dashboard.templates");
  const { creatingId, error, createFromTemplate } = useTemplateCreator();

  return (
    <section aria-labelledby="templates-title">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="templates-title" className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">
            {t("title")}
          </h2>
          <p className="mt-0.5 text-[13px] text-[var(--muted)]">{t("subtitle")}</p>
        </div>
        <Link
          href="/dashboard/templates"
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary-dark)]"
        >
          {t("viewAll")}
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
        </Link>
      </div>

      {error && (
        <p role="alert" className="mb-3 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
        {FEATURED_TEMPLATE_IDS.map((id) => (
          <TemplateCard
            key={id}
            id={id}
            busy={creatingId === id}
            disabled={creatingId !== null}
            onUse={(templateId, payload) => void createFromTemplate(templateId, payload)}
          />
        ))}
      </div>
    </section>
  );
}
