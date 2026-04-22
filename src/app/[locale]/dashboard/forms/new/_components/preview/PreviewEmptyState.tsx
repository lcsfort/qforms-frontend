import { useTranslations } from "next-intl";
import { SparkleIcon } from "@/components/icons/SparkleIcon";

export function PreviewEmptyState() {
  const t = useTranslations("forms.generate");

  return (
    <div className="relative rounded-2xl border border-dashed border-[var(--border)]/70 bg-[var(--card)]/40 p-6 text-center overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,92,246,0.07),transparent_60%)] pointer-events-none" />
      <div className="relative mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--accent)]/10 ring-1 ring-[var(--primary)]/10">
        <SparkleIcon className="w-5 h-5 text-[var(--primary)]" />
      </div>
      <div className="relative text-[13.5px] font-medium text-[var(--foreground)] mb-1">
        {t("preview.emptyTitle")}
      </div>
      <div className="relative text-[12.5px] leading-relaxed text-[var(--muted)]">
        {t("preview.emptyDescription")}
      </div>
    </div>
  );
}
