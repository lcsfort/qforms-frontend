"use client";

import { useState, type FormEvent, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { signin } from "@/lib/redux/authSlice";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { getSigninSchema } from "@/lib/validation";

export default function SigninPage() {
  const t = useTranslations("signin");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, token, hydrated, user, error: authError } = useAppSelector(
    (state) => state.auth
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const displayError = apiError ?? authError ?? null;

  useEffect(() => {
    if (!hydrated || !token) return;
    if (user && !user.isEmailVerified) {
      router.push("/verify-email-required");
      return;
    }
    router.push("/dashboard");
  }, [hydrated, token, user, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setFieldErrors({});

    const schema = getSigninSchema({
      emailRequired: t("validation.emailRequired"),
      emailInvalid: t("validation.emailInvalid"),
      passwordRequired: t("validation.passwordRequired"),
    });

    schema
      .validate({ email, password }, { abortEarly: false })
      .then((values) => {
        dispatch(signin({ email: values.email, password: values.password }))
          .unwrap()
          .catch((err: unknown) => setApiError(err as string));
      })
      .catch((err: { inner?: Array<{ path?: string; message: string }> }) => {
        const errors: Record<string, string> = {};
        if (err.inner) {
          for (const e of err.inner) {
            if (e.path) errors[e.path] = e.message;
          }
        }
        setFieldErrors(errors);
      });
  };

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

          {displayError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg p-3 mb-4">
              {displayError}
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
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
              />
              {fieldErrors.email && (
                <div id="email-error" role="alert" className="mt-1.5 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm p-2.5">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.email}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium"
                >
                  {t("passwordLabel")}
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (fieldErrors.password) setFieldErrors((prev) => { const next = { ...prev }; delete next.password; return next; });
                }}
                placeholder={t("passwordPlaceholder")}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm"
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
              />
              {fieldErrors.password && (
                <div id="password-error" role="alert" className="mt-1.5 flex items-center gap-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-sm p-2.5">
                  <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                  {fieldErrors.password}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? t("submitting") : t("submit")}
            </button>

            <GoogleSignInButton
              mode="signin"
              disabled={loading}
              className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium text-sm transition-colors [&>div]:!flex [&>div]:!justify-center [&>div]:!w-full"
            />
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            {t("noAccount")}{" "}
            <Link
              href="/signup"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              {t("signUpLink")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
