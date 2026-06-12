"use client";

import { useFormatter, useNow, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SparkleIcon } from "@/components/icons/SparkleIcon";
import { type Form } from "@/lib/types";
import { FormPreview } from "./FormPreview";

const PREVIEW_ACCENT = "#1F6F66";
const PREVIEW_MUTED = "#6B6358";

type FormCardProps = {
  form: Form;
  index: number;
  onDelete: (id: string, title: string) => void;
  variant?: "grid" | "row";
};

function StatusPill({ published, label }: { published: boolean; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full border border-[#23201B]/10 bg-[#FFFDF8]/95 px-2 py-[3px] text-[9.5px] font-semibold uppercase tracking-[0.06em] backdrop-blur-sm"
      style={{ color: published ? PREVIEW_ACCENT : PREVIEW_MUTED }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: published ? PREVIEW_ACCENT : PREVIEW_MUTED }}
      />
      {label}
    </span>
  );
}

export function FormCard({ form, index, onDelete, variant = "grid" }: FormCardProps) {
  const tf = useTranslations("forms");
  const tResume = useTranslations("forms.generate.resume");
  const format = useFormatter();
  const now = useNow();

  const responseCount = form._count?.responses ?? 0;
  const published = form.status === "published";
  const statusLabel = published ? tf("published") : tf("draft");

  /* In the grid the cluster floats on the preview (always light form colors), so it
     uses a fixed light palette; in the row it sits on the card and follows the theme. */
  const renderActions = (overlay: boolean) => {
    const style = overlay
      ? {
          container:
            "flex items-center gap-0.5 rounded-lg border border-[#23201B]/10 bg-[#FFFDF8]/95 p-0.5 shadow-sm backdrop-blur-sm",
          primary: "text-[#1F6F66] hover:bg-[#1F6F66]/10",
          neutral: "text-[#6B6358] hover:bg-[#23201B]/5 hover:text-[#23201B]",
          danger: "text-[#6B6358] hover:bg-red-50 hover:text-red-500",
        }
      : {
          container: "flex items-center gap-0.5",
          primary: "text-[var(--primary)] hover:bg-[var(--primary)]/10",
          neutral: "text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--foreground)]",
          danger: "text-[var(--muted)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10",
        };

    return (
    <div className={style.container}>
      <div className="relative group/action">
        <span aria-hidden="true" className="pointer-events-none absolute right-0 bottom-full mb-1.5 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] opacity-0 shadow-sm transition-opacity group-hover/action:opacity-100 group-focus-within/action:opacity-100 z-10">
          {form.planSession?.id ? tResume("continueChat") : tResume("startChat")}
        </span>
        <Link
          href={
            form.planSession?.id
              ? `/dashboard/forms/new?sessionId=${form.planSession.id}&formId=${form.id}`
              : `/dashboard/forms/new?formId=${form.id}`
          }
          aria-label={form.planSession?.id ? tResume("continueChat") : tResume("startChat")}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${style.primary}`}
        >
          <SparkleIcon className="h-4 w-4" />
        </Link>
      </div>

      <div className="relative group/action">
        <span aria-hidden="true" className="pointer-events-none absolute right-0 bottom-full mb-1.5 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] opacity-0 shadow-sm transition-opacity group-hover/action:opacity-100 group-focus-within/action:opacity-100 z-10">
          {tf("responsesPage.title")}
        </span>
        <Link
          href={`/dashboard/forms/${form.id}/responses`}
          aria-label={tf("responsesPage.title")}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${style.neutral}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5V6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v6.75m-19.5 0v4.5A2.25 2.25 0 0 0 4.5 20.25h15a2.25 2.25 0 0 0 2.25-2.25v-4.5" />
          </svg>
        </Link>
      </div>

      <div className="relative group/action">
        <span aria-hidden="true" className="pointer-events-none absolute right-0 bottom-full mb-1.5 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] opacity-0 shadow-sm transition-opacity group-hover/action:opacity-100 group-focus-within/action:opacity-100 z-10">
          {tf("editor.deleteForm")}
        </span>
        <button
          type="button"
          onClick={() => onDelete(form.id, form.title)}
          aria-label={tf("editor.deleteForm")}
          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors ${style.danger}`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
    );
  };

  const revealOnHover =
    "md:opacity-0 md:transition-opacity md:duration-150 md:group-hover:opacity-100 md:group-focus-within:opacity-100";

  if (variant === "row") {
    return (
      <article
        className="premium-card card-enter group flex items-center gap-4 p-2.5"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <div className="w-32 shrink-0">
          <FormPreview title={form.title} description={form.description} schema={form.schema} settings={form.settings} className="h-20" />
        </div>

        <div className="min-w-0 flex-1">
          <Link href={`/dashboard/forms/${form.id}`} className="block min-w-0">
            <h3
              title={form.title}
              className="truncate font-display text-[15.5px] font-semibold leading-snug tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]"
            >
              {form.title}
            </h3>
          </Link>
          <p className="mt-1 truncate text-[12px] text-[var(--muted)]">
            <span
              className={`text-[11px] font-semibold uppercase tracking-[0.06em] ${
                published ? "text-[var(--primary)]" : ""
              }`}
            >
              {statusLabel}
            </span>
            <span aria-hidden="true"> · </span>
            <span className="font-medium tabular-nums text-[var(--foreground)]">
              {tf("responses", { count: responseCount })}
            </span>
            <span aria-hidden="true"> · </span>
            {tf("edited")} {format.relativeTime(new Date(form.updatedAt), now)}
          </p>
        </div>

        <div className={`shrink-0 pr-1 ${revealOnHover}`}>{renderActions(false)}</div>
      </article>
    );
  }

  return (
    <article
      className="premium-card card-enter group flex flex-col p-2.5"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="relative">
        <FormPreview title={form.title} description={form.description} schema={form.schema} settings={form.settings} />
        <span className="absolute left-2 top-2">
          <StatusPill published={published} label={statusLabel} />
        </span>
        <div className={`absolute right-2 top-2 ${revealOnHover}`}>{renderActions(true)}</div>
      </div>

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-3">
        <Link href={`/dashboard/forms/${form.id}`} className="block min-w-0">
          <h3
            title={form.title}
            className="truncate font-display text-[16px] font-semibold leading-snug tracking-tight text-[var(--foreground)] transition-colors group-hover:text-[var(--primary)]"
          >
            {form.title}
          </h3>
        </Link>

        <p className="mt-1 text-[12px] text-[var(--muted)]">
          <span className="font-medium tabular-nums text-[var(--foreground)]">
            {tf("responses", { count: responseCount })}
          </span>
          <span aria-hidden="true"> · </span>
          {tf("edited")} {format.relativeTime(new Date(form.updatedAt), now)}
        </p>
      </div>
    </article>
  );
}
