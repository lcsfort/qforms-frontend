"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchProfile, logout } from "@/lib/redux/authSlice";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

export function LandingNav() {
  const t = useTranslations("nav");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (hydrated && token && !user) {
      dispatch(fetchProfile());
    }
  }, [hydrated, token, user, dispatch]);

  const handleSignOut = () => {
    dispatch(logout());
    router.push("/");
  };

  const isLoggedIn = hydrated && !!token;

  return (
    <nav className="w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold tracking-tight">
          <span className="text-indigo-600">Q</span>Forms
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher />
          {isLoggedIn ? (
            <>
              {user?.email && (
                <span className="text-sm text-[var(--muted)] max-w-[120px] truncate hidden sm:inline">
                  {user.email}
                </span>
              )}
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t("dashboard")}
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                {t("signOut")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {t("signIn")}
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {t("getStarted")}
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
