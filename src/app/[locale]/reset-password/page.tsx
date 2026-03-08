"use client";

import { useState, type FormEvent, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { getResetPasswordSchema } from "@/lib/validation";

export default function ResetPasswordPage() {
  const t = useTranslations("resetPassword");
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token"), [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiErrorCode, setApiErrorCode] = useState<"invalidLink" | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (token === null && typeof window !== "undefined") {
      router.replace("/forgot-password");
    }
  }, [token, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setApiErrorCode(null);
    setApiErrorMessage(null);
    setFieldErrors({});

    if (!token) return;

    const schema = getResetPasswordSchema({
      newPasswordRequired: t("validation.newPasswordRequired"),
      newPasswordMin: t("validation.newPasswordMin"),
      newPasswordPattern: t("validation.newPasswordPattern"),
      confirmPasswordRequired: t("validation.confirmPasswordRequired"),
      confirmPasswordMatch: t("validation.confirmPasswordMatch"),
    });

    schema
      .validate({ newPassword, confirmPassword }, { abortEarly: false })
      .then((values) => {
        setLoading(true);
        return api.resetPassword({ token, newPassword: values.newPassword });
      })
      .then(() => setSuccess(true))
      .catch((err: unknown) => {
        if (err && typeof err === "object" && "inner" in err) {
          const errors: Record<string, string> = {};
          const inner = (err as { inner?: Array<{ path?: string; message: string }> }).inner;
          if (inner) {
            for (const e of inner) {
              if (e.path) errors[e.path] = e.message;
            }
          }
          setFieldErrors(errors);
        } else {
          const e = err as Error & { status?: number; message?: string };
          const msg = err instanceof Error ? err.message : String(err ?? "");
          const isInvalidResetLink =
            e?.status === 400 ||
            msg === "Invalid or expired reset link" ||
            /invalid|expired|reset\s*link/i.test(msg);
          if (isInvalidResetLink) {
            setApiErrorCode("invalidLink");
            setApiErrorMessage(null);
          } else {
            setApiErrorCode(null);
            setApiErrorMessage(msg || "Something went wrong");
          }
        }
      })
      .finally(() => setLoading(false));
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 px-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-green-600 dark:text-green-400"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("successTitle")}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t("successMessage")}
          </p>
          <Link
            href="/signin"
            className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            {t("backToSignIn")}
          </Link>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 px-4">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-indigo-600">Q</span>Forms
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold mb-1">{t("title")}</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            {t("subtitle")}
          </p>

          {(apiErrorCode === "invalidLink" || apiErrorMessage) && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg p-3 mb-4">
              {apiErrorCode === "invalidLink" ||
              apiErrorMessage === "Invalid or expired reset link"
                ? t("invalidOrExpiredLink")
                : apiErrorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium mb-1.5"
              >
                {t("newPasswordLabel")}
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.newPassword) setFieldErrors((prev) => { const next = { ...prev }; delete next.newPassword; return next; });
                }}
                placeholder={t("newPasswordPlaceholder")}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm"
                aria-invalid={!!fieldErrors.newPassword}
              />
              {fieldErrors.newPassword && (
                <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400" role="alert">
                  {fieldErrors.newPassword}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-1.5"
              >
                {t("confirmPasswordLabel")}
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) setFieldErrors((prev) => { const next = { ...prev }; delete next.confirmPassword; return next; });
                }}
                placeholder={t("confirmPasswordPlaceholder")}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm"
                aria-invalid={!!fieldErrors.confirmPassword}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400" role="alert">
                  {fieldErrors.confirmPassword}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? t("submitting") : t("submit")}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            <Link
              href="/signin"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {t("backToSignIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
