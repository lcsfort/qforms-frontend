"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BarChart3, CheckCircle2, ChevronRight, FileText, Inbox, Target } from "lucide-react";
import { type AttentionItem, type LatestResponseItem } from "../_lib/insights";
import { AttentionRow } from "./AttentionRow";

type WorkspaceActivityPanelProps = {
  totalCount: number;
  responsesThisMonth: number | null;
  bestCompletionRate: number | null;
  attention: AttentionItem[];
  attentionTotalCount: number;
  latest: LatestResponseItem[];
  loading: boolean;
  onViewAll: () => void;
};

function RailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/75 p-4">
      <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--muted)]">{title}</h3>
      {children}
    </section>
  );
}

/** Pulsing placeholder rows shown until the backend insights arrive. */
function RailSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <ul className="flex flex-col gap-2" aria-hidden="true">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="flex items-start gap-2.5 px-0 py-1">
          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-pulse rounded-full bg-[var(--surface)]" />
          <span className="min-w-0 flex-1">
            <span className="mb-1.5 block h-3 w-3/4 animate-pulse rounded bg-[var(--surface)]" />
            <span className="block h-2.5 w-1/2 animate-pulse rounded bg-[var(--surface)]" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function WorkspaceActivityPanel({
  totalCount,
  responsesThisMonth,
  bestCompletionRate,
  attention,
  attentionTotalCount,
  latest,
  loading,
  onViewAll,
}: WorkspaceActivityPanelProps) {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const now = useNow();

  const pulseRows = [
    {
      key: "forms",
      icon: FileText,
      label: t("railFormsTotal"),
      value: String(totalCount),
    },
    {
      key: "responses",
      icon: Inbox,
      label: t("metricResponsesThisMonth"),
      value: responsesThisMonth != null ? String(responsesThisMonth) : t("noData"),
    },
    {
      key: "completion",
      icon: Target,
      label: t("metricBestCompletion"),
      value: bestCompletionRate != null ? `${bestCompletionRate}%` : t("noData"),
    },
  ];

  const hasMoreAttention = attentionTotalCount > attention.length;

  return (
    <div className="flex flex-col gap-4">
      <RailCard title={t("railPulseTitle")}>
        <ul className="flex flex-col gap-2.5">
          {pulseRows.map((row) => {
            const Icon = row.icon;
            return (
              <li key={row.key} className="flex items-center gap-2.5">
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border)]/70 bg-[var(--surface)]/60 text-[var(--primary)]/75">
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--muted)]">{row.label}</span>
                <span className="shrink-0 text-[14px] font-semibold tabular-nums text-[var(--foreground)]">
                  {row.value}
                </span>
              </li>
            );
          })}
        </ul>
      </RailCard>

      <RailCard title={t("railAttentionTitle")}>
        {loading ? (
          <RailSkeleton rows={2} />
        ) : attentionTotalCount === 0 ? (
          <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[var(--muted)]">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]/70" strokeWidth={1.8} />
            {t("railAttentionEmpty")}
          </p>
        ) : (
          <>
            <p className="mb-2 text-[12px] text-[var(--muted)]">
              {t("railAttentionCount", { count: attentionTotalCount })}
            </p>
            <ul className="flex flex-col gap-1">
              {attention.map((item) => (
                <li key={`${item.form.id}-${item.kind}`}>
                  <AttentionRow item={item} />
                </li>
              ))}
            </ul>
            {hasMoreAttention && (
              <button
                type="button"
                onClick={onViewAll}
                className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary)]/80"
              >
                {t("railAttentionViewAll")}
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
              </button>
            )}
          </>
        )}
      </RailCard>

      <RailCard title={t("railLatestTitle")}>
        {loading ? (
          <RailSkeleton rows={2} />
        ) : latest.length === 0 ? (
          <p className="text-[12.5px] leading-relaxed text-[var(--muted)]">{t("railLatestEmpty")}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {latest.map((item) => (
              <li key={item.form.id}>
                <Link
                  href={`/dashboard/forms/${item.form.id}/responses`}
                  className="group flex items-start gap-2.5 rounded-lg px-2 py-2 transition-colors hover:bg-[var(--surface)]/60 -mx-2"
                >
                  <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]/70" strokeWidth={1.8} />
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-[var(--foreground)] group-hover:text-[var(--primary)] transition-colors">
                      {item.form.title}
                    </span>
                    <span className="block text-[11px] text-[var(--muted)]">
                      {t("lastResponseLabel")} {format.relativeTime(new Date(item.lastResponseAt), now)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </RailCard>
    </div>
  );
}
