"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchDashboardInsightsFull } from "@/lib/redux/dashboardInsightsSlice";
import { type DashboardInsightsParams } from "@/lib/types";
import { AttentionRow } from "./AttentionRow";

type AttentionAllModalProps = {
  open: boolean;
  onClose: () => void;
  /** Same thresholds the rail uses; the modal re-fetches with `full: true`. */
  params: DashboardInsightsParams;
  totalCount: number;
};

export function AttentionAllModal({ open, onClose, params, totalCount }: AttentionAllModalProps) {
  const t = useTranslations("dashboard");
  const dispatch = useAppDispatch();
  const { attentionFull, fullLoading } = useAppSelector((state) => state.dashboardInsights);

  // Load the complete flagged list when the modal opens (top-N is all the rail had).
  useEffect(() => {
    if (open) dispatch(fetchDashboardInsightsFull(params));
  }, [open, dispatch, params]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="attention-all-title"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className="relative flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-[var(--border)]/60 px-5 py-4">
          <div className="min-w-0">
            <h2 id="attention-all-title" className="text-[15px] font-semibold text-[var(--foreground)]">
              {t("attentionAllTitle")}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-[var(--muted)]">
              {t("railAttentionCount", { count: totalCount })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("clearSearch")}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5">
          {fullLoading && attentionFull.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--primary)]/20 border-t-[var(--primary)]" />
            </div>
          ) : attentionFull.length === 0 ? (
            <p className="px-2.5 py-10 text-center text-[12.5px] text-[var(--muted)]">{t("railAttentionEmpty")}</p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {attentionFull.map((item) => (
                <li key={`${item.form.id}-${item.kind}`}>
                  <AttentionRow
                    item={item}
                    onNavigate={onClose}
                    className="group flex items-start gap-2.5 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-[var(--surface)]/70"
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
