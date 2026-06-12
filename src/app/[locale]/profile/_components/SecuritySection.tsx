"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { ValidationError } from "yup";
import { api } from "@/lib/api";
import { getChangePasswordSchema, type ChangePasswordValidationMessages } from "@/lib/validation";
import { SettingsCard, SettingsSection } from "./primitives";

const INPUT_CLASS =
  "w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]";

export function SecuritySection({ token }: { token: string }) {
  const t = useTranslations("profile");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validationMessages: ChangePasswordValidationMessages = useMemo(
    () => ({
      currentPasswordRequired: t("validation.currentPasswordRequired"),
      newPasswordRequired: t("validation.newPasswordRequired"),
      newPasswordMin: t("validation.newPasswordMin"),
      newPasswordPattern: t("validation.newPasswordPattern"),
      confirmPasswordRequired: t("validation.confirmPasswordRequired"),
      confirmPasswordMatch: t("validation.confirmPasswordMatch"),
    }),
    [t],
  );

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);
    setSuccess(false);

    try {
      await getChangePasswordSchema(validationMessages).validate(
        { currentPassword, newPassword, confirmNewPassword },
        { abortEarly: false },
      );
    } catch (err) {
      if (err instanceof ValidationError) {
        const errs: Record<string, string> = {};
        err.inner.forEach((e) => {
          if (e.path) errs[e.path] = e.message;
        });
        setFieldErrors(errs);
      }
      return;
    }

    setSaving(true);
    try {
      await api.changePassword(token, { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: unknown) {
      const error = err as { message?: string };
      setApiError(error.message ?? t("genericError"));
    } finally {
      setSaving(false);
    }
  };

  const clearState = () => {
    setFieldErrors({});
    setSuccess(false);
    setApiError(null);
  };

  return (
    <SettingsSection title={t("sectionSecurity")} description={t("sectionSecurityDesc")}>
      <SettingsCard>
        <form onSubmit={handleChangePassword} noValidate aria-label={t("changePassword")}>
          <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="current-password" className="mb-1.5 block text-[12.5px] font-medium text-[var(--foreground)]">
              {t("currentPasswordLabel")}
            </label>
            <input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => {
                setCurrentPassword(e.target.value);
                clearState();
              }}
              placeholder={t("currentPasswordPlaceholder")}
              aria-invalid={Boolean(fieldErrors.currentPassword)}
              aria-describedby={fieldErrors.currentPassword ? "current-password-error" : undefined}
              className={INPUT_CLASS}
            />
            {fieldErrors.currentPassword && (
              <p id="current-password-error" role="alert" className="mt-1 text-xs text-red-500">
                {fieldErrors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="new-password" className="mb-1.5 block text-[12.5px] font-medium text-[var(--foreground)]">
              {t("newPasswordLabel")}
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                clearState();
              }}
              placeholder={t("newPasswordPlaceholder")}
              aria-invalid={Boolean(fieldErrors.newPassword)}
              aria-describedby={fieldErrors.newPassword ? "new-password-error" : undefined}
              className={INPUT_CLASS}
            />
            {fieldErrors.newPassword && (
              <p id="new-password-error" role="alert" className="mt-1 text-xs text-red-500">
                {fieldErrors.newPassword}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="mb-1.5 block text-[12.5px] font-medium text-[var(--foreground)]">
              {t("confirmPasswordLabel")}
            </label>
            <input
              id="confirm-new-password"
              type="password"
              value={confirmNewPassword}
              onChange={(e) => {
                setConfirmNewPassword(e.target.value);
                clearState();
              }}
              placeholder={t("confirmPasswordPlaceholder")}
              aria-invalid={Boolean(fieldErrors.confirmNewPassword)}
              aria-describedby={fieldErrors.confirmNewPassword ? "confirm-new-password-error" : undefined}
              className={INPUT_CLASS}
            />
            {fieldErrors.confirmNewPassword && (
              <p id="confirm-new-password-error" role="alert" className="mt-1 text-xs text-red-500">
                {fieldErrors.confirmNewPassword}
              </p>
            )}
          </div>
          </div>

          {apiError && <p role="alert" className="mb-3 mt-4 text-sm text-red-500">{apiError}</p>}
          {success && (
            <p role="status" className="mb-3 mt-1 text-sm text-green-600 dark:text-green-400">
              {t("passwordChanged")}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="mt-4 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
          >
            {saving ? t("changingPassword") : t("changePasswordBtn")}
          </button>
        </form>
      </SettingsCard>
    </SettingsSection>
  );
}
