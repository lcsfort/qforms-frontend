"use client";

import { useState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchProfile, logout } from "@/lib/redux/authSlice";
import { api } from "@/lib/api";

export default function VerifyEmailRequiredPage() {
  const t = useTranslations("verifyRequired");
  const locale = useLocale();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, hydrated } = useAppSelector((state) => state.auth);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
      return;
    }
    if (!user?.email) {
      dispatch(fetchProfile());
    }
  }, [hydrated, token, user?.email, dispatch, router]);

  const handleResend = async () => {
    if (!token) return;
    setResending(true);
    setResendSuccess(false);
    try {
      await api.resendVerificationEmail(token, locale);
      setResendSuccess(true);
    } catch {
      // silently handled
    } finally {
      setResending(false);
    }
  };

  const handleSignOut = () => {
    dispatch(logout());
    router.push("/");
  };

  if (!hydrated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
          {t("title")}
        </h1>
        <p className="text-[var(--muted)] mb-6">{t("description")}</p>
        {user?.email && (
          <p className="text-sm text-[var(--muted)] mb-6">
            → {user.email}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="w-full bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-white font-semibold py-2.5 rounded-[14px] transition-opacity"
          >
            {resending ? "..." : t("resend")}
          </button>
          {resendSuccess && (
            <p className="text-sm text-green-600 dark:text-green-400 text-center">
              {t("resendSuccess")}
            </p>
          )}
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full border border-[var(--border)] text-[var(--foreground)] font-medium py-2.5 rounded-[14px] hover:bg-[var(--surface)]/50 transition-colors"
          >
            {t("signOut")}
          </button>
        </div>
      </div>
    </div>
  );
}
