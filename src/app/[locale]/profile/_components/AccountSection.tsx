"use client";

import { useCallback, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ValidationError } from "yup";
import { ImageUp } from "lucide-react";
import { api } from "@/lib/api";
import { setUser, type User } from "@/lib/redux/authSlice";
import { useAppDispatch } from "@/lib/redux/hooks";
import { getUserAvatarUrl, getUserInitials } from "@/lib/userAvatar";
import { getUpdateNameSchema, type UpdateNameValidationMessages } from "@/lib/validation";
import { SettingsCard, SettingsSection } from "./primitives";

export function AccountSection({ user, token }: { user: User; token: string }) {
  const t = useTranslations("profile");
  const dispatch = useAppDispatch();

  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const validationMessages: UpdateNameValidationMessages = useMemo(
    () => ({ nameRequired: t("validation.nameRequired") }),
    [t],
  );

  const handleSaveName = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);
    setSuccess(false);

    try {
      await getUpdateNameSchema(validationMessages).validate({ name }, { abortEarly: false });
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
      const updated = await api.updateName(token, { name });
      dispatch(setUser(updated));
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setApiError(error.message ?? t("genericError"));
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatarFile = useCallback(
    async (file: File) => {
      setAvatarError(null);
      setApiError(null);
      setSuccess(false);
      if (!file.type.startsWith("image/")) {
        setAvatarError(t("avatarInvalidType"));
        return;
      }
      setUploadingAvatar(true);
      try {
        const { url } = await api.uploadFile(token, file, "avatar");
        const updated = await api.updateAvatar(token, { avatarUrl: url });
        dispatch(setUser(updated));
      } catch {
        setAvatarError(t("avatarUploadError"));
      } finally {
        setUploadingAvatar(false);
      }
    },
    [token, dispatch, t],
  );

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAvatarFile(file);
    e.target.value = "";
  };

  const onAvatarDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadAvatarFile(file);
  };

  const avatarUrl = getUserAvatarUrl(user);
  const initials = getUserInitials(user);
  const displayName = user.name?.trim() || user.email.split("@")[0] || user.email;

  return (
    <SettingsSection title={t("personalInfo")} description={t("personalInfoDesc")}>
      <SettingsCard>
        <div className="lg:grid lg:grid-cols-2 lg:gap-10">
          <div>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)]">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={64}
                height={64}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <span className="text-lg font-semibold text-[var(--muted)]">{initials}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-[18px] font-semibold tracking-tight text-[var(--foreground)]">
              {displayName}
            </p>
            <p className="truncate text-[12.5px] text-[var(--muted)]">{user.email}</p>
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-1.5 text-[12.5px] font-medium text-[var(--muted)]">{t("profilePicture")}</p>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onAvatarDrop}
            onClick={() => avatarInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label={uploadingAvatar ? t("uploadingPicture") : t("clickOrDragToUpload")}
            aria-busy={uploadingAvatar}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                avatarInputRef.current?.click();
              }
            }}
            className={`flex items-center justify-center gap-2.5 rounded-xl border border-dashed px-4 py-5 transition-colors cursor-pointer ${
              dragOver
                ? "border-[var(--primary)]/60 bg-[var(--primary)]/5"
                : "border-[var(--border)] hover:border-[var(--primary)]/40 hover:bg-[var(--surface)]/40"
            }`}
          >
            {uploadingAvatar ? (
              <span role="status" className="flex items-center">
                <span aria-hidden="true" className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--primary)]/25 border-t-[var(--primary)]" />
                <span className="sr-only">{t("uploadingPicture")}</span>
              </span>
            ) : (
              <>
                <ImageUp className="h-[18px] w-[18px] text-[var(--muted)]" strokeWidth={1.8} />
                <span className="text-[13px] text-[var(--muted)]">{t("clickOrDragToUpload")}</span>
              </>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          {avatarError && <p role="alert" className="mt-2 text-sm text-red-500">{avatarError}</p>}
        </div>
          </div>

        <div className="mt-5 border-t border-[var(--border)]/60 pt-5 lg:mt-0 lg:border-t-0 lg:pt-0">
          <EmailBlock user={user} token={token} />

          <form onSubmit={handleSaveName} noValidate>
            <label htmlFor="profile-name" className="mb-1.5 block text-[12.5px] font-medium text-[var(--foreground)]">
              {t("nameLabel")}
            </label>
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors({});
                setSuccess(false);
              }}
              placeholder={t("namePlaceholder")}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "profile-name-error" : undefined}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
            {fieldErrors.name && (
              <p id="profile-name-error" role="alert" className="mt-1 text-xs text-red-500">
                {fieldErrors.name}
              </p>
            )}

            {apiError && <p role="alert" className="mt-3 text-sm text-red-500">{apiError}</p>}
            {success && <p role="status" className="mt-3 text-sm text-green-600 dark:text-green-400">{t("nameSaved")}</p>}

            <button
              type="submit"
              disabled={saving}
              className="mt-4 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {saving ? t("saving") : t("saveBtn")}
            </button>
          </form>
        </div>
        </div>
      </SettingsCard>
    </SettingsSection>
  );
}

function EmailBlock({ user, token }: { user: User; token: string }) {
  const t = useTranslations("profile");
  const dispatch = useAppDispatch();
  const isGoogle = user.authProvider === "google";

  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const res = await api.requestEmailChange(token, {
        newEmail: newEmail.trim(),
        currentPassword: password,
      });
      dispatch(setUser({ ...user, pendingEmail: res.pendingEmail }));
      setOpen(false);
      setNewEmail("");
      setPassword("");
    } catch (err: unknown) {
      const e2 = err as { message?: string };
      setError(e2.message ?? t("genericError"));
    } finally {
      setBusy(false);
    }
  };

  const cancelPending = async () => {
    if (cancelBusy) return;
    setError(null);
    setCancelBusy(true);
    try {
      await api.cancelEmailChange(token);
      dispatch(setUser({ ...user, pendingEmail: null }));
    } catch (err: unknown) {
      const e2 = err as { message?: string };
      setError(e2.message ?? t("genericError"));
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--muted)]">
        {t("emailLabel")}
      </label>
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1 truncate rounded-xl border border-[var(--border)] bg-[var(--surface)]/60 px-4 py-2.5 text-sm text-[var(--muted)]">
          {user.email}
        </div>
        {!isGoogle && !user.pendingEmail && (
          <button
            type="button"
            onClick={() => {
              setOpen((prev) => !prev);
              setError(null);
            }}
            aria-expanded={open}
            className="h-[42px] shrink-0 rounded-xl border border-[var(--border)] bg-[var(--card)]/70 px-3.5 text-[12.5px] font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--primary)] cursor-pointer"
          >
            {t("emailChange.change")}
          </button>
        )}
      </div>
      {isGoogle && (
        <p className="mt-1.5 text-[11.5px] text-[var(--muted)]">{t("emailChange.managedByGoogle")}</p>
      )}

      {user.pendingEmail && (
        <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/8 px-3.5 py-2.5">
          <p role="status" className="min-w-0 text-[12px] leading-relaxed text-[var(--foreground)]">
            {t("emailChange.pending", { email: user.pendingEmail })}
          </p>
          <button
            type="button"
            onClick={() => void cancelPending()}
            disabled={cancelBusy}
            className="shrink-0 text-[12px] font-medium text-[var(--muted)] transition-colors hover:text-red-500 disabled:opacity-50 cursor-pointer"
          >
            {t("emailChange.cancel")}
          </button>
        </div>
      )}

      {open && !user.pendingEmail && (
        <form
          onSubmit={submit}
          className="mt-3 space-y-3 rounded-xl border border-[var(--border)]/70 bg-[var(--surface)]/40 p-3.5"
        >
          <div>
            <label htmlFor="new-email" className="mb-1.5 block text-[12.5px] font-medium text-[var(--foreground)]">
              {t("emailChange.newEmailLabel")}
            </label>
            <input
              id="new-email"
              type="email"
              required
              value={newEmail}
              onChange={(e) => {
                setNewEmail(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label htmlFor="email-change-password" className="mb-1.5 block text-[12.5px] font-medium text-[var(--foreground)]">
              {t("currentPasswordLabel")}
            </label>
            <input
              id="email-change-password"
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(null);
              }}
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy || !newEmail.trim() || !password}
              className="rounded-xl bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {busy ? t("emailChange.sending") : t("emailChange.submit")}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setError(null);
              }}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] cursor-pointer"
            >
              {t("emailChange.dismiss")}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
