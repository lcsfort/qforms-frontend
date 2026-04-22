import { useTranslations } from "next-intl";
import type { CapturedDetail } from "../../_lib/types";

type Props = {
  details: CapturedDetail[];
};

export function PreviewCapturedDetails({ details }: Props) {
  const t = useTranslations("forms.generate");

  if (details.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)]">
        {t("preview.capturedHeading")}
      </div>
      <div className="space-y-2">
        {details.map((d, i) => (
          <div
            key={`${i}-${d.question}`}
            className="rounded-xl border border-[var(--border)]/60 bg-[var(--card)]/60 p-3.5"
          >
            <div className="text-[11.5px] text-[var(--muted)] leading-snug mb-1">
              {d.question}
            </div>
            <div className="text-[13px] font-medium text-[var(--foreground)] leading-snug">
              {d.answer}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
