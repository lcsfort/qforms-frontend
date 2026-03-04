"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchProfile, logout } from "@/lib/redux/authSlice";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!token) {
      router.push("/signin");
      return;
    }
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [token, user, dispatch, router]);

  const handleLogout = () => {
    dispatch(logout());
    router.push("/");
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-indigo-600">Q</span>Forms
          </span>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {user.email}
            </span>
            {!user.isEmailVerified && (
              <span className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full">
                {t("emailNotVerified")}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              {t("signOut")}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">
          {t("welcome", { name: user.name || "empty" })}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          {t("subtitle")}
        </p>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center">
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
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
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
