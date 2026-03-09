"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchProfile } from "@/lib/redux/authSlice";
import { AppMenu } from "@/components/AppMenu";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
      return;
    }
    if (user && !user.isEmailVerified) {
      router.push("/verify-email-required");
      return;
    }
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [hydrated, token, user, dispatch, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="fixed top-4 left-4 z-50">
        <AppMenu />
      </div>

      <main className="max-w-4xl mx-auto px-6 pt-20 pb-12">
        <h1 className="text-3xl font-bold mb-2">
          {t("welcome", { name: user.name || "empty" })}
        </h1>
        <p className="text-[var(--muted)] mb-8">
          {t("subtitle")}
        </p>

        {!user.isEmailVerified && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 text-yellow-700 dark:text-yellow-400 text-sm">
            {t("emailNotVerified")}
          </div>
        )}

        <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-indigo-600 dark:text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2">{t("emptyTitle")}</h2>
          <p className="text-[var(--muted)] text-sm mb-6">
            {t("emptyDesc")}
          </p>
          <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
            {t("generateBtn")}
          </button>
        </div>
      </main>
    </div>
  );
}
