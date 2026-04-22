import { useTranslations } from "next-intl";

export function PreviewGeneratingCard() {
  const t = useTranslations("forms.generate");

  return (
    <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--card)]/60 p-4 space-y-2.5">
      <div className="flex items-center gap-2 text-[12px] text-[var(--primary)] font-medium">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--primary)] animate-pulse" />
        {t("preview.generatingHeading")}
      </div>
      <div className="space-y-1.5">
        <div className="h-2 rounded-full bg-[var(--surface)] animate-pulse" />
        <div className="h-2 w-4/5 rounded-full bg-[var(--surface)] animate-pulse" />
        <div className="h-2 w-3/5 rounded-full bg-[var(--surface)] animate-pulse" />
      </div>
      <div className="text-[11.5px] text-[var(--muted)] leading-relaxed">
        {t("preview.generatingDescription")}
      </div>
    </div>
  );
}
