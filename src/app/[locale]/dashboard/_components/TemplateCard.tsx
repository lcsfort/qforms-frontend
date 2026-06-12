"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { FormPreview } from "./FormPreview";
import { buildTemplateSchema, TEMPLATE_SETTINGS, type TemplateId } from "../_lib/templates";
import { type TemplatePayload } from "../_lib/useTemplateCreator";

type TemplateCardProps = {
  id: TemplateId;
  busy: boolean;
  disabled: boolean;
  onUse: (id: TemplateId, payload: TemplatePayload) => void;
};

export function TemplateCard({ id, busy, disabled, onUse }: TemplateCardProps) {
  const t = useTranslations("dashboard.templates");

  const name = t(`${id}.name`);
  const description = t(`${id}.desc`);
  const schema = useMemo(() => buildTemplateSchema(id, t.raw(`${id}.fields`)), [id, t]);
  const settings = TEMPLATE_SETTINGS[id];

  return (
    <article className="premium-card group flex flex-col p-2.5">
      <FormPreview title={name} description={description} schema={schema} settings={settings} />

      <div className="flex flex-1 flex-col px-2.5 pb-2.5 pt-3">
        <h3 className="truncate font-display text-[16px] font-semibold leading-snug tracking-tight text-[var(--foreground)]">
          {name}
        </h3>
        <p className="mt-1 text-[12px] leading-snug text-[var(--muted)] line-clamp-2">{description}</p>
        <p className="mb-3 mt-1.5 text-[11px] text-[var(--muted)]">{t("fieldCount", { count: schema.length })}</p>

        <button
          type="button"
          onClick={() => onUse(id, { title: name, description, schema, settings })}
          disabled={disabled}
          aria-label={t("use", { name })}
          className="mt-auto inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)]/70 text-[12.5px] font-medium text-[var(--foreground)] transition-colors duration-150 hover:border-[var(--primary)]/40 hover:bg-[var(--primary)]/8 hover:text-[var(--primary)] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
        >
          {busy ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--primary)]/25 border-t-[var(--primary)]" />
          ) : null}
          {t("useTemplate")}
        </button>
      </div>
    </article>
  );
}
