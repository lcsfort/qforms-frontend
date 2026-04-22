import { useTranslations } from "next-intl";
import type { GeneratedFormSchema } from "@/lib/types";
import { SparkleIcon } from "@/components/icons/SparkleIcon";

type Props = {
  schema: GeneratedFormSchema;
};

export function PreviewReadyCard({ schema }: Props) {
  const t = useTranslations("forms.generate");

  return (
    <div className="rounded-2xl border border-[var(--primary)]/25 bg-gradient-to-br from-[var(--card)] to-[var(--surface)]/40 p-4 space-y-2">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--primary)]">
        <SparkleIcon className="w-3 h-3" />
        {t("preview.readyHeading")}
      </div>
      <div className="text-[14px] font-semibold text-[var(--foreground)] leading-snug">
        {schema.title}
      </div>
      {schema.description && (
        <div className="text-[12.5px] text-[var(--muted)] leading-relaxed line-clamp-3">
          {schema.description}
        </div>
      )}
      <div className="pt-1 text-[11.5px] text-[var(--muted)]">
        {t("preview.readyDescription")}
      </div>
    </div>
  );
}
