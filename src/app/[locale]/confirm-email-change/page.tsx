"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, X } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { fetchProfile } from "@/lib/redux/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";

function ConfirmEmailChangeContent() {
  const t = useTranslations("confirmEmailChange");
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();
  const token = searchParams.get("token");
  const { token: authToken, hydrated } = useAppSelector((state) => state.auth);

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  // The token is single-use server-side; a StrictMode re-mount must not consume it twice.
  const firedRef = useRef(false);

  useEffect(() => {
    // Wait for auth hydration so the success path sees the real session token.
    if (!token || !hydrated || firedRef.current) return;
    firedRef.current = true;
    api
      .confirmEmailChange(token)
      .then(() => {
        setStatus("success");
        // A signed-in session still holds the old address; refresh it.
        if (authToken) dispatch(fetchProfile());
      })
      .catch(() => {
        setStatus("error");
      });
  }, [token, hydrated, authToken, dispatch]);

  const effectiveStatus = !token ? "error" : status;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center shadow-sm">
        {effectiveStatus === "loading" && (
          <>
            <div
              role="status"
              aria-label={t("verifying")}
              className="mx-auto mb-6 h-12 w-12 rounded-full border-4 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin"
            />
            <h2 className="text-xl font-semibold text-[var(--foreground)]">{t("verifying")}</h2>
          </>
        )}

        {effectiveStatus === "success" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--primary)]/10">
              <Check className="h-8 w-8 text-[var(--primary)]" strokeWidth={2} />
            </div>
            <h2 className="mb-2 font-display text-2xl font-semibold text-[var(--foreground)]">
              {t("successTitle")}
            </h2>
            <p className="mb-6 text-sm text-[var(--muted)]">{t("successMessage")}</p>
            <Link
              href="/dashboard"
              className="cta-gradient inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-semibold text-white"
            >
              {t("continue")}
            </Link>
          </>
        )}

        {effectiveStatus === "error" && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <X className="h-8 w-8 text-red-600 dark:text-red-400" strokeWidth={2} />
            </div>
            <h2 className="mb-2 font-display text-2xl font-semibold text-[var(--foreground)]">
              {t("errorTitle")}
            </h2>
            <p className="mb-6 text-sm text-[var(--muted)]">
              {!token ? t("noToken") : t("errorMessage")}
            </p>
            <Link
              href="/profile"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] px-5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
            >
              {t("backToSettings")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function ConfirmEmailChangePage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailChangeContent />
    </Suspense>
  );
}
