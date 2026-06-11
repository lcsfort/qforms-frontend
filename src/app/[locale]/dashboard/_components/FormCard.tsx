"use client";

import Image from "next/image";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { SparkleIcon } from "@/components/icons/SparkleIcon";
import { defaultFormListStats, type Form, type FormField } from "@/lib/types";

type FormCardProps = {
  form: Form;
  index: number;
  onDelete: (id: string, title: string) => void;
  variant?: "grid" | "row";
};

/* The preview mirrors the real form: its page/paper colors, header image, and
   field layout. Ink tones are fixed (not theme vars) because the paper keeps
   the form's own light colors even when the app is in dark mode. */
const PREVIEW_ACCENT = "#1F6F66";
const PREVIEW_MUTED = "#6B6358";

function PreviewField({ field }: { field: FormField }) {
  const label = <span className="block h-[3px] w-2/5 rounded-full bg-[#23201B]/15" />;

  switch (field.type) {
    case "textarea":
      return (
        <div className="space-y-1">
          {label}
          <span className="block h-6 w-full rounded-[4px] border border-[#23201B]/10 bg-[#23201B]/[0.025]" />
        </div>
      );
    case "select":
    case "date":
      return (
        <div className="space-y-1">
          {label}
          <span className="flex h-3.5 items-center justify-end rounded-[4px] border border-[#23201B]/10 bg-[#23201B]/[0.025] pr-1.5">
            {field.type === "select" ? (
              <span className="mb-0.5 h-1 w-1 rotate-45 border-b border-r border-[#23201B]/40" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-[2px] border border-[#23201B]/30" />
            )}
          </span>
        </div>
      );
    case "radio":
    case "checkbox": {
      const shape = field.type === "radio" ? "rounded-full" : "rounded-[2px]";
      return (
        <div className="space-y-1">
          {label}
          {[0, 1].map((i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 border border-[#23201B]/30 ${shape}`} />
              <span className={`block h-[3px] rounded-full bg-[#23201B]/12 ${i ? "w-1/3" : "w-1/2"}`} />
            </span>
          ))}
        </div>
      );
    }
    case "rating":
      return (
        <div className="space-y-1.5">
          {label}
          <span className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="h-2 w-2 rounded-full bg-[#B5862F]/45" />
            ))}
          </span>
        </div>
      );
    case "scale":
      return (
        <div className="space-y-1.5">
          {label}
          <span className="flex gap-[3px]">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="h-2.5 w-3 rounded-[3px] border border-[#23201B]/15 bg-[#23201B]/[0.03]" />
            ))}
          </span>
        </div>
      );
    case "file":
      return (
        <div className="space-y-1">
          {label}
          <span className="block h-5 w-full rounded-[4px] border border-dashed border-[#23201B]/20" />
        </div>
      );
    default: // text, email, number
      return (
        <div className="space-y-1">
          {label}
          <span className="block h-3.5 w-full rounded-[4px] border border-[#23201B]/10 bg-[#23201B]/[0.025]" />
        </div>
      );
  }
}

function FormCardPreview({ form, className = "h-36" }: { form: Form; className?: string }) {
  const settings = form.settings ?? {};
  const pageBg = settings.page_background_color ?? "#F7F4ED";
  const paperBg = settings.form_background_color ?? "#FFFDF8";
  const twoColumns = (settings.columns ?? 1) > 1;
  const fields = [...(form.schema ?? [])]
    .sort((a, b) => a.order - b.order)
    .slice(0, twoColumns ? 6 : 4);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden rounded-[14px] border border-[var(--border)]/70 ${className}`}
      style={{ backgroundColor: pageBg }}
    >
      <div
        className="mx-auto mt-3.5 min-h-[150px] w-[76%] rounded-t-[7px] border border-b-0 border-[#23201B]/10 px-3 pb-3 pt-2.5 shadow-[0_1px_10px_rgba(35,32,27,0.08)]"
        style={{ backgroundColor: paperBg }}
      >
        {settings.header_image_url && (
          <span className="relative mb-2 block h-7 w-full overflow-hidden rounded-[4px]">
            <Image src={settings.header_image_url} alt="" fill unoptimized className="object-cover" />
          </span>
        )}
        <p className="truncate text-[8.5px] font-semibold leading-tight text-[#23201B]/85">
          {form.title}
        </p>
        {form.description ? <span className="mt-1 block h-[3px] w-3/5 rounded-full bg-[#23201B]/12" /> : null}
        {fields.length > 0 ? (
          <div className={twoColumns ? "mt-2.5 grid grid-cols-2 gap-x-2.5 gap-y-2" : "mt-2.5 space-y-2"}>
            {fields.map((field) => (
              <PreviewField key={field.id} field={field} />
            ))}
          </div>
        ) : (
          <div className="mt-2.5 space-y-2">
            <span className="block h-3.5 w-full rounded-[4px] border border-dashed border-[#23201B]/15" />
            <span className="block h-3.5 w-full rounded-[4px] border border-dashed border-[#23201B]/10" />
          </div>
        )}
        <span className="mt-2.5 block h-3.5 w-12 rounded-[5px]" style={{ backgroundColor: PREVIEW_ACCENT }} />
      </div>
    </div>
  );
}

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
  const t = useTranslations("dashboard");
  const tf = useTranslations("forms");
  const tResume = useTranslations("forms.generate.resume");
  const format = useFormatter();
  const now = useNow();

  const stats = form.listStats ?? defaultFormListStats();
  const responseCount = form._count?.responses ?? 0;
  const completion = stats.completionRate;
  const published = form.status === "published";
  const statusLabel = published ? tf("published") : tf("draft");

  /* Action cluster floats on the preview, which always keeps light form colors,
     so it uses the same fixed light palette in both app themes. */
  const actions = (
    <div className="flex items-center gap-0.5 rounded-lg border border-[#23201B]/10 bg-[#FFFDF8]/95 p-0.5 shadow-sm backdrop-blur-sm">
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
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#1F6F66] transition-colors hover:bg-[#1F6F66]/10"
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
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#6B6358] transition-colors hover:bg-[#23201B]/5 hover:text-[#23201B]"
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
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#6B6358] transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        </button>
      </div>
    </div>
  );

  const revealOnHover =
    "md:opacity-0 md:transition-opacity md:duration-150 md:group-hover:opacity-100 md:group-focus-within:opacity-100";

  if (variant === "row") {
    return (
      <article
        className="premium-card card-enter group flex items-center gap-4 p-2.5"
        style={{ animationDelay: `${index * 40}ms` }}
      >
        <div className="w-32 shrink-0">
          <FormCardPreview form={form} className="h-20" />
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

        {completion != null && (
          <div className="hidden w-28 shrink-0 md:block">
            <div className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="text-[var(--muted)]">{t("metricCompletion")}</span>
              <span className="font-semibold tabular-nums text-[var(--foreground)]">{completion}%</span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--surface)]" aria-hidden="true">
              <div
                className="h-full rounded-full bg-[var(--primary)]"
                style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
              />
            </div>
          </div>
        )}

        <div className={`shrink-0 pr-1 ${revealOnHover}`}>{actions}</div>
      </article>
    );
  }

  return (
    <article
      className="premium-card card-enter group flex flex-col p-2.5"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="relative">
        <FormCardPreview form={form} />
        <span className="absolute left-2 top-2">
          <StatusPill published={published} label={statusLabel} />
        </span>
        <div className={`absolute right-2 top-2 ${revealOnHover}`}>{actions}</div>
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

        {completion != null && (
          <div className="mt-auto pt-3">
            <div className="flex items-baseline justify-between gap-2 text-[11px]">
              <span className="text-[var(--muted)]">{t("metricCompletion")}</span>
              <span className="font-semibold tabular-nums text-[var(--foreground)]">{completion}%</span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-[var(--surface)]" aria-hidden="true">
              <div
                className="h-full rounded-full bg-[var(--primary)] transition-[width] duration-500"
                style={{ width: `${Math.min(100, Math.max(0, completion))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
