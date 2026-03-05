"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-[var(--background)] px-4">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface)]/50 via-[var(--background)] to-[var(--surface)]/30" />
      <div className="absolute top-1/4 left-1/4 w-[320px] h-[320px] bg-[var(--primary)]/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/3 right-1/4 w-[280px] h-[280px] bg-[var(--accent)]/10 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Big 404 */}
        <div className="mb-2">
          <span
            className="text-[clamp(6rem,18vw,10rem)] font-bold leading-none tracking-tighter bg-gradient-to-b from-[var(--primary)] to-[var(--primary-dark)] bg-clip-text text-transparent"
            style={{ lineHeight: 0.9 }}
          >
            404
          </span>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-sm p-8 shadow-lg">
          <h2 className="text-2xl font-semibold text-[var(--foreground)] mb-1">
            {t("title")}
          </h2>
          <p className="text-[var(--primary)] font-medium mb-3">{t("tagline")}</p>
          <p className="text-[var(--muted)] text-base leading-relaxed mb-8">
            {t("description")}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto bg-[var(--primary)] hover:opacity-90 text-white font-semibold px-6 py-3 rounded-[14px] transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5"
            >
              {t("backHome")}
            </Link>
            <Link
              href="/signup"
              className="w-full sm:w-auto border border-[var(--border)] text-[var(--foreground)] font-medium px-6 py-3 rounded-[14px] hover:bg-[var(--surface)]/50 transition-colors duration-150"
            >
              {t("createForm")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
