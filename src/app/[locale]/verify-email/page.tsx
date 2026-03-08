"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";

function VerifyEmailContent() {
  const t = useTranslations("verifyEmail");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    api
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage(t("successMessage"));
      })
      .catch(() => {
        setStatus("error");
        setMessage(t("errorMessage"));
      });
  }, [token, t]);

  const effectiveStatus = !token ? "error" : status;
  const effectiveMessage = !token ? t("noToken") : message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8 text-center">
        {effectiveStatus === "loading" && (
          <>
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-6" />
            <h2 className="text-xl font-bold">{t("verifying")}</h2>
          </>
        )}

        {effectiveStatus === "success" && (
          <>
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
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("successTitle")}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{effectiveMessage}</p>
            <Link
              href="/signin"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              {t("signIn")}
            </Link>
          </>
        )}

        {effectiveStatus === "error" && (
          <>
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t("errorTitle")}</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{effectiveMessage}</p>
            <Link
              href="/signup"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              {t("tryAgain")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
