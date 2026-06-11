"use client";

import { useEffect, useRef, useState } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { AlertCircle, BarChart3, Bell } from "lucide-react";
import {
  attentionHref,
  type AttentionItem,
  type LatestResponseItem,
} from "../_lib/insights";

type ActivityMenuProps = {
  attention: AttentionItem[];
  latest: LatestResponseItem[];
};

export function ActivityMenu({ attention, latest }: ActivityMenuProps) {
  const t = useTranslations("dashboard");
  const format = useFormatter();
  const now = useNow();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const attentionLabel: Record<AttentionItem["kind"], string> = {
    lowCompletion: t("railAttentionLowCompletion"),
    noResponses: t("railAttentionNoResponses"),
    draftIdle: t("railAttentionDraftIdle"),
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("activityLabel")}
        aria-expanded={open}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)]/80 bg-[var(--card)] text-[var(--muted)] transition-colors duration-100 hover:bg-[var(--surface)]/70 hover:text-[var(--foreground)] cursor-pointer"
      >
        <Bell className="h-4 w-4" strokeWidth={1.8} />
        {attention.length > 0 && (
          <span
            aria-hidden="true"
            className="absolute right-[7px] top-[7px] h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400"
          />
        )}
      </button>

      {open && (
        <div className="menu-enter absolute right-0 top-full z-50 mt-1.5 w-[min(20rem,calc(100vw-5rem))] rounded-xl border border-[var(--border)]/80 bg-[var(--card)] py-2 shadow-xl shadow-black/8 glass-panel dark:shadow-black/20">
          <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {t("railAttentionTitle")}
          </p>
          {attention.length === 0 ? (
            <p className="px-4 pb-2 text-[12.5px] text-[var(--muted)]">{t("railAttentionEmpty")}</p>
          ) : (
            <div className="flex flex-col px-1.5 pb-1">
              {attention.map((item) => (
                <Link
                  key={`${item.form.id}-${item.kind}`}
                  href={attentionHref(item)}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-[var(--surface)]/70"
                >
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" strokeWidth={1.8} />
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-[var(--foreground)]">
                      {item.form.title}
                    </span>
                    <span className="block text-[11px] text-[var(--muted)]">{attentionLabel[item.kind]}</span>
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="mx-3 my-1.5 border-t border-[var(--border)]/50" />

          <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {t("railLatestTitle")}
          </p>
          {latest.length === 0 ? (
            <p className="px-4 pb-1.5 text-[12.5px] text-[var(--muted)]">{t("railLatestEmpty")}</p>
          ) : (
            <div className="flex flex-col px-1.5">
              {latest.map((item) => (
                <Link
                  key={item.form.id}
                  href={`/dashboard/forms/${item.form.id}/responses`}
                  onClick={() => setOpen(false)}
                  className="flex items-start gap-2.5 rounded-lg px-2.5 py-2 transition-colors hover:bg-[var(--surface)]/70"
                >
                  <BarChart3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--primary)]/70" strokeWidth={1.8} />
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-[var(--foreground)]">
                      {item.form.title}
                    </span>
                    <span className="block text-[11px] text-[var(--muted)]">
                      {t("lastResponseLabel")} {format.relativeTime(new Date(item.lastResponseAt), now)}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
