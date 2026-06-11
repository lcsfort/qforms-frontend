import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { GeneratedFormSchema } from "@/lib/types";
import { SparkleIcon } from "@/components/icons/SparkleIcon";
import { ReadyPlanFieldList } from "./ReadyPlanCard.fields";

type Props = {
  schema: GeneratedFormSchema;
  variant?: "live" | "snapshot";
  actions?: ReactNode;
};

export function ReadyPlanCard({ schema, variant = "live", actions }: Props) {
  const t = useTranslations("forms.generate");
  const isSnapshot = variant === "snapshot";

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
          {schema.title || t("ready.title")}
        </div>
        {schema.description && (
          <div className="mt-1.5 text-[13.5px] text-[var(--muted)] leading-relaxed">
            {schema.description}
          </div>
        )}

        <ReadyPlanFieldList schema={schema} />

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
