import "@renderkit/ui-default/styles.css";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { SchemaRenderer } from "@renderkit/react";
import {
  collectFieldNodes,
  documentUsesChat,
  documentUsesOneQuestion,
} from "@renderkit/core";
import type { RenderKitDocument } from "@/lib/types";
import { SparkleIcon } from "@/components/icons/SparkleIcon";

type Props = {
  document: RenderKitDocument;
  variant?: "live" | "snapshot";
  actions?: ReactNode;
};

function documentMode(document: RenderKitDocument): "chat" | "one-question" | "classic" {
  if (documentUsesChat(document)) return "chat";
  if (documentUsesOneQuestion(document)) return "one-question";
  return "classic";
}

export function ReadyPlanCard({ document, variant = "live", actions }: Props) {
  const t = useTranslations("forms.generate");
  const isSnapshot = variant === "snapshot";

  const title = document.metadata?.name?.trim() || t("ready.title");
  const description = document.metadata?.description?.trim() || "";
  const fieldCount = collectFieldNodes(document).length;
  const mode = documentMode(document);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 ${
        isSnapshot
          ? "border border-[var(--border)]/70 bg-[var(--card)]/70"
          : "border border-[var(--primary)]/25 bg-gradient-to-br from-[var(--card)] to-[var(--surface)]/40"
      }`}
    >
      {!isSnapshot && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,color-mix(in_srgb,var(--primary)_12%,transparent),transparent_55%)] pointer-events-none" />
      )}
      <div className="relative">
        <div
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] mb-3 ${
            isSnapshot
              ? "bg-[var(--surface)]/80 text-[var(--muted)]"
              : "bg-[var(--primary)]/12 text-[var(--primary)]"
          }`}
        >
          <SparkleIcon className="w-3 h-3" />
          {isSnapshot ? t("ready.snapshotBadge") : t("ready.badge")}
        </div>
        <div className="text-[16px] font-semibold text-[var(--foreground)] leading-snug">
          {title}
        </div>
        {description && (
          <div className="mt-1.5 text-[13.5px] text-[var(--muted)] leading-relaxed">
            {description}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11.5px] text-[var(--muted)]">
          <span className="inline-flex items-center rounded-full border border-[var(--border)]/60 bg-[var(--surface)]/55 px-2.5 py-1">
            {t("ready.fieldsCount", { count: fieldCount })}
          </span>
          <span className="inline-flex items-center rounded-full border border-[var(--border)]/60 bg-[var(--surface)]/55 px-2.5 py-1 uppercase tracking-[0.08em]">
            {mode}
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-[var(--border)]/60 bg-[var(--background)]/40 overflow-hidden">
          <SchemaRenderer schema={document} onSubmit={() => {}} />
        </div>

        {!isSnapshot && (
          <div className="mt-4 text-[12.5px] text-[var(--muted)]">
            {t("ready.description")}
          </div>
        )}
        {actions && (
          <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div>
        )}
      </div>
    </div>
  );
}
