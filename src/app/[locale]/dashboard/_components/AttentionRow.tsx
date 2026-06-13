"use client";

import { type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { FileClock, TrendingDown, EyeOff } from "lucide-react";
import { attentionHref, type AttentionItem, type AttentionKind } from "../_lib/insights";

type KindStyle = {
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  /** Tailwind text-color classes shared by the icon and the metric, encoding severity. */
  tone: string;
};

// Ordered by severity: low completion (worst) → no responses → idle draft (mildest).
const KIND_STYLE: Record<AttentionKind, KindStyle> = {
  lowCompletion: { icon: TrendingDown, tone: "text-rose-600 dark:text-rose-400" },
  noResponses: { icon: EyeOff, tone: "text-amber-600 dark:text-amber-400" },
  draftIdle: { icon: FileClock, tone: "text-[var(--muted)]" },
};

/** Reason + metric copy for an attention item, shared across the rail, bell, and modal. */
export function useAttentionCopy() {
  const t = useTranslations("dashboard");

  const reasonLabel = (kind: AttentionKind): string => {
    switch (kind) {
      case "lowCompletion":
        return t("railAttentionLowCompletion");
      case "noResponses":
        return t("railAttentionNoResponses");
      case "draftIdle":
        return t("railAttentionDraftIdle");
    }
  };

  const metricLabel = (item: AttentionItem): string | null => {
    if (item.metric == null) return null;
    switch (item.kind) {
      case "lowCompletion":
        return t("railAttentionMetricCompletion", { rate: item.metric });
      case "noResponses":
        return t("railAttentionMetricViews", { count: item.metric });
      case "draftIdle":
        return t("railAttentionMetricIdle", { count: item.metric });
    }
  };

  return { reasonLabel, metricLabel };
}

export function AttentionRow({
  item,
  className,
  onNavigate,
}: {
  item: AttentionItem;
  className?: string;
  onNavigate?: () => void;
}) {
  const { reasonLabel, metricLabel } = useAttentionCopy();
  const { icon: Icon, tone } = KIND_STYLE[item.kind];
  const metric = metricLabel(item);

  return (
    <Link
      href={attentionHref(item)}
      onClick={onNavigate}
      className={
        className ??
        "group -mx-2 flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--surface)]/60"
      }
    >
      <Icon className={`mt-0.5 h-3.5 w-3.5 shrink-0 ${tone}`} strokeWidth={1.8} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[12.5px] font-medium text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]">
          {item.form.title}
        </span>
        <span className="block text-[11px] text-[var(--muted)]">
          {reasonLabel(item.kind)}
          {metric && <span className={`ml-1 font-medium ${tone}`}>· {metric}</span>}
        </span>
      </span>
    </Link>
  );
}
