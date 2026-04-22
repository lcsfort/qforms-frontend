import { useTranslations } from "next-intl";

type Props = {
  prompt: string;
};

export function PreviewRequest({ prompt }: Props) {
  const t = useTranslations("forms.generate");

  return (
    <div className="space-y-2">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        {t("preview.requestHeading")}
      </div>
      <div className="rounded-2xl border border-[var(--border)]/60 bg-[var(--card)]/80 p-4 text-[13.5px] leading-relaxed text-[var(--foreground)]">
        {prompt}
      </div>
    </div>
  );
}
