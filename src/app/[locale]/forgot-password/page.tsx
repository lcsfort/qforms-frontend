"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { getForgotPasswordSchema } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setFieldErrors({});

    const schema = getForgotPasswordSchema({
      emailRequired: t("validation.emailRequired"),
      emailInvalid: t("validation.emailInvalid"),
    });

    schema
      .validate({ email }, { abortEarly: false })
      .then(() => {
        setLoading(true);
        return api.requestPasswordReset({ email: email.trim(), locale });
      })
      .then(() => setSuccess(true))
      .catch((err: unknown) => {
        if (err && typeof err === "object" && "inner" in err) {
          const errors: Record<string, string> = {};
          const inner = (err as { inner?: Array<{ path?: string; message: string }> }).inner;
          if (inner) {
            for (const e of inner) {
              if (e.path && e.path !== "password") errors[e.path] = e.message;
            }
          }
          setFieldErrors(errors);
        } else {
          setApiError((err as Error).message ?? "Something went wrong");
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
                d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">{t("successTitle")}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t("successMessage")}
          </p>
          <Link
            href="/signin"
            className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
          >
            {t("backToSignIn")}
          </Link>
        </div>
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

          {apiError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg p-3 mb-4">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
              >
                {t("emailLabel")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => { const next = { ...prev }; delete next.email; return next; });
                }}
                placeholder={t("emailPlaceholder")}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm"
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <p className="mt-1.5 text-sm text-amber-600 dark:text-amber-400" role="alert">
                  {fieldErrors.email}
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
