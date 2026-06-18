import { useTranslations } from "next-intl";
import { SchemaRenderer } from "@renderkit/react";
import { collectFieldNodes } from "@renderkit/core";
import type { RenderKitDocument } from "@/lib/types";
import { SparkleIcon } from "@/components/icons/SparkleIcon";

type Props = {
  document: RenderKitDocument;
};

export function PreviewReadyCard({ document }: Props) {
  const t = useTranslations("forms.generate");

  const title = document.metadata?.name?.trim() || t("ready.title");
  const description = document.metadata?.description?.trim() || "";
  const fieldCount = collectFieldNodes(document).length;

  return (
    <div className="rounded-2xl border border-[var(--primary)]/25 bg-gradient-to-br from-[var(--card)] to-[var(--surface)]/40 p-4 space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--primary)]">
        <SparkleIcon className="w-3 h-3" />
        {t("preview.readyHeading")}
      </div>
      <div className="text-[14px] font-semibold text-[var(--foreground)] leading-snug">
        {title}
      </div>
      {description && (
        <div className="text-[12.5px] text-[var(--muted)] leading-relaxed line-clamp-3">
          {description}
        </div>
      )}
      <div className="text-[11.5px] text-[var(--muted)]">
        {t("ready.fieldsCount", { count: fieldCount })}
      </div>
      <div className="mt-2 rounded-xl border border-[var(--border)]/60 bg-[var(--background)]/40 overflow-hidden">
        <SchemaRenderer schema={document} onSubmit={() => {}} />
      </div>
      <div className="pt-1 text-[11.5px] text-[var(--muted)]">
        {t("preview.readyDescription")}
      </div>
    </div>
  );
}
