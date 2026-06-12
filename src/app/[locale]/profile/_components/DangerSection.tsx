"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api";
import { logout, type User } from "@/lib/redux/authSlice";
import { useAppDispatch } from "@/lib/redux/hooks";

const INPUT_CLASS =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-red-400";

type Step = "closed" | "credentials" | "code";

export function DangerSection({ user, token }: { user: User; token: string }) {
  const t = useTranslations("profile.danger");
  const tProfile = useTranslations("profile");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const isLocal = user.authProvider !== "google";

  const [step, setStep] = useState<Step>("closed");
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retentionDays, setRetentionDays] = useState(15);

  const canRequestCode =
    !busy && confirmText.trim() === user.email && (!isLocal || password.length > 0);
  const canConfirm = !busy && code.trim().length === 6;

  const reset = () => {
    setStep("closed");
    setError(null);
    setPassword("");
    setConfirmText("");
    setCode("");
  };

  const requestCode = async () => {
    if (!canRequestCode) return;
    setBusy(true);
    setError(null);
    try {
      const res = await api.requestAccountDeletion(token, {
        ...(isLocal ? { currentPassword: password } : {}),
        confirmEmail: confirmText.trim(),
      });
      setRetentionDays(res.retentionDays);
      setCode("");
      setStep("code");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? tProfile("genericError"));
    } finally {
      setBusy(false);
    }
  };

  const confirmDeletion = async () => {
    if (!canConfirm) return;
    setBusy(true);
    setError(null);
    try {
      await api.confirmAccountDeletion(token, { code: code.trim() });
      dispatch(logout());
      router.push("/");
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message ?? tProfile("genericError"));
      setBusy(false);
    }
  };

  return (
    <section>
      <h2 className="text-[17px] font-semibold tracking-tight text-red-600 dark:text-red-400">
        {t("title")}
      </h2>
      <p className="mt-0.5 text-[13px] text-[var(--muted)]">{t("desc")}</p>

      <div className="mt-4 rounded-2xl border border-red-200 bg-red-50/40 p-5 sm:p-6 dark:border-red-900/40 dark:bg-red-950/15">
        <p className="text-[12.5px] leading-relaxed text-[var(--muted)]">
          {t("warning", { days: retentionDays })}
        </p>

        {step === "closed" && (
          <button
            type="button"
            onClick={() => setStep("credentials")}
            className="mt-4 inline-flex h-9 items-center rounded-xl border border-red-300 px-4 text-[13px] font-medium text-red-600 transition-colors hover:bg-red-100/60 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-500/10 cursor-pointer"
          >
            {t("deleteBtn")}
          </button>
        )}

        {step === "credentials" && (
          <div className="mt-4 space-y-3">
            {isLocal && (
              <div>
                <label
                  htmlFor="delete-account-password"
                  className="mb-1.5 block text-[12.5px] font-medium text-[var(--foreground)]"
                >
                  {tProfile("currentPasswordLabel")}
                </label>
                <input
                  id="delete-account-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className={INPUT_CLASS}
                />
              </div>
            )}
            <div>
              <label
                htmlFor="delete-account-confirm"
                className="mb-1.5 block text-[12.5px] font-medium text-[var(--foreground)]"
              >
                {t("typeToConfirm", { email: user.email })}
              </label>
              <input
                id="delete-account-confirm"
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                  setError(null);
                }}
                className={INPUT_CLASS}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-500">
                {error}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => void requestCode()}
                disabled={!canRequestCode}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {busy ? t("sendingCode") : t("sendCodeBtn")}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] cursor-pointer"
              >
                {t("keep")}
              </button>
            </div>
          </div>
        )}

        {step === "code" && (
          <div className="mt-4 space-y-3">
            <p role="status" className="text-[12.5px] leading-relaxed text-[var(--foreground)]">
              {t("codeSent", { email: user.email })}
            </p>
            <div>
              <label
                htmlFor="delete-account-code"
                className="mb-1.5 block text-[12.5px] font-medium text-[var(--foreground)]"
              >
                {t("codeLabel")}
              </label>
              <input
                id="delete-account-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                className={`${INPUT_CLASS} max-w-[180px] text-center text-lg font-semibold tracking-[0.35em]`}
              />
            </div>
            <p className="text-[12px] leading-relaxed text-red-600/90 dark:text-red-400/90">
              {t("finalNotice", { days: retentionDays })}
            </p>
            {error && (
              <p role="alert" className="text-sm text-red-500">
                {error}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void confirmDeletion()}
                disabled={!canConfirm}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
              >
                {busy ? t("deleting") : t("deleteBtn")}
              </button>
              <button
                type="button"
                onClick={reset}
                className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] cursor-pointer"
              >
                {t("keep")}
              </button>
              <button
                type="button"
                onClick={() => void requestCode()}
                disabled={busy}
                className="text-[12.5px] font-medium text-[var(--muted)] transition-colors hover:text-[var(--foreground)] disabled:opacity-50 cursor-pointer"
              >
                {t("resendCode")}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
