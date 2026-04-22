import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function ChatTopLinks() {
  const te = useTranslations("forms.editor");

  return (
    <div className="flex items-center w-full">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-[13px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {te("backToForms")}
      </Link>
    </div>
  );
}

export function HeroHeader() {
  const t = useTranslations("forms.generate");

  return (
    <>
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--primary)] mb-4">
          <span className="h-1 w-1 rounded-full bg-[var(--primary)]" />
          {t("eyebrow")}
        </div>
        <h1 className="text-[34px] md:text-[42px] font-semibold tracking-tight leading-[1.05] text-[var(--foreground)]">
          {t("heading")}
        </h1>
        <p className="mt-4 max-w-[52ch] text-[15px] leading-relaxed text-[var(--muted)]">
          {t("helper")}
        </p>
      </div>
    </>
  );
}
