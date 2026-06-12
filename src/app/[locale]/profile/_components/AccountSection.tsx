"use client";

import { useCallback, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ValidationError } from "yup";
import { Camera, ImageUp } from "lucide-react";
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
  const [avatarSuccess, setAvatarSuccess] = useState(false);
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
      if (uploadingAvatar) return;
      setAvatarError(null);
      setAvatarSuccess(false);
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
        setAvatarSuccess(true);
      } catch {
        setAvatarError(t("avatarUploadError"));
      } finally {
        setUploadingAvatar(false);
      }
    },
    [token, dispatch, t, uploadingAvatar],
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
        {/* Row 1 — identity header; the avatar itself is the upload control and
            the whole row accepts drops. */}
        <div
          className="flex items-center gap-4"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            // dragleave also fires when the pointer moves onto a child of the
            // row; only clear when the drag truly left the row.
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
          }}
          onDrop={onAvatarDrop}
        >
          <button
            type="button"
            onClick={() => {
              if (!uploadingAvatar) avatarInputRef.current?.click();
            }}
            aria-label={t("changePhoto")}
            aria-busy={uploadingAvatar}
            className={`group relative h-16 w-16 shrink-0 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--card)] ${
              dragOver ? "ring-2 ring-[var(--primary)] ring-offset-2 ring-offset-[var(--card)]" : ""
            }`}
          >
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)]">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt=""
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              ) : (
                <span className="text-lg font-semibold text-[var(--muted)]">{initials}</span>
              )}
            </span>
            <span
              aria-hidden="true"
              className={`absolute inset-0 flex items-center justify-center rounded-full bg-black/45 transition-opacity duration-150 ${
                dragOver || uploadingAvatar
                  ? "opacity-100"
                  : "opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              }`}
            >
              {uploadingAvatar ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <ImageUp className="h-[18px] w-[18px] text-white" strokeWidth={1.8} />
              )}
            </span>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-[22px] w-[22px] items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--muted)] shadow-sm transition-colors group-hover:border-[var(--primary)]/40 group-hover:text-[var(--primary)]"
            >
              <Camera className="h-3.5 w-3.5" strokeWidth={1.8} />
            </span>
          </button>
          <span role="status" className="sr-only">
            {uploadingAvatar ? t("uploadingPicture") : avatarSuccess ? t("photoUpdated") : ""}
          </span>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
          <div className="min-w-0">
            <p
              className="truncate font-display text-[18px] font-semibold tracking-tight text-[var(--foreground)]"
              title={displayName}
            >
              {displayName}
            </p>
            <p className={`truncate text-[12px] ${dragOver ? "text-[var(--primary)]" : "text-[var(--muted)]"}`}>
              {uploadingAvatar ? t("uploadingPicture") : t("photoHint")}
            </p>
          </div>
        </div>
        {avatarError && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{avatarError}</p>}

        {/* Row 2 — name, with Save physically scoped to this field. */}
        <form onSubmit={handleSaveName} noValidate className="mt-5 border-t border-[var(--border)]/60 pt-5">
          <label htmlFor="profile-name" className="mb-1.5 block text-[12.5px] font-medium text-[var(--foreground)]">
            {t("nameLabel")}
          </label>
          <div className="flex max-w-[440px] items-center gap-2">
            <input
              id="profile-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setFieldErrors({});
                setApiError(null);
                setSuccess(false);
              }}
              placeholder={t("namePlaceholder")}
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? "profile-name-error" : undefined}
              className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none transition-shadow focus:border-transparent focus:ring-2 focus:ring-[var(--primary)]"
            />
            <button
              type="submit"
              disabled={saving}
              className="h-[42px] min-w-[96px] shrink-0 whitespace-nowrap rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50 cursor-pointer"
            >
              {saving ? t("saving") : t("saveBtn")}
            </button>
          </div>
          {fieldErrors.name && (
            <p id="profile-name-error" role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
              {fieldErrors.name}
            </p>
          )}
          {apiError && <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">{apiError}</p>}
          {/* Always mounted so the announcement is reliable; visible only on success. */}
          <p role="status" className={success ? "mt-2 text-sm text-green-700 dark:text-green-400" : "sr-only"}>
            {success ? t("nameSaved") : ""}
          </p>
        </form>

        {/* Row 3 — email as a read-mostly label/value/action row. */}
        <div className="mt-5 border-t border-[var(--border)]/60 pt-5">
          <EmailBlock user={user} token={token} />
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
  const changeBtnRef = useRef<HTMLButtonElement>(null);
  const pendingBannerRef = useRef<HTMLParagraphElement>(null);

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
      // The form (and the Change button) unmount on success; move focus to the
      // pending banner so keyboard/SR users land on the confirmation.
      requestAnimationFrame(() => pendingBannerRef.current?.focus());
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
      // The banner (with the focused button) unmounts; the Change button remounts.
      requestAnimationFrame(() => changeBtnRef.current?.focus());
    } catch (err: unknown) {
      const e2 = err as { message?: string };
      setError(e2.message ?? t("genericError"));
    } finally {
      setCancelBusy(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-medium text-[var(--foreground)]">{t("emailLabel")}</p>
          <p className="mt-0.5 truncate text-sm text-[var(--foreground)]" title={user.email}>
            {user.email}
          </p>
        </div>
        {!isGoogle && !user.pendingEmail && (
          <button
            ref={changeBtnRef}
            type="button"
            onClick={() => {
              setOpen((prev) => !prev);
              setError(null);
              setNewEmail("");
              setPassword("");
            }}
            aria-expanded={open}
            aria-controls={open ? "email-change-form" : undefined}
            className="inline-flex h-9 shrink-0 items-center rounded-xl border border-[var(--border)] bg-[var(--card)]/70 px-3.5 text-[12.5px] font-medium text-[var(--foreground)] transition-colors hover:border-[var(--primary)]/40 hover:text-[var(--primary)] cursor-pointer"
          >
            {t("emailChange.change")}
          </button>
        )}
      </div>
      {isGoogle && (
        <p className="mt-1.5 text-[11.5px] text-[var(--muted)]">{t("emailChange.managedByGoogle")}</p>
      )}

      {user.pendingEmail && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-xl border border-[var(--accent)]/35 bg-[var(--accent)]/8 px-3.5 py-2.5">
          <p
            ref={pendingBannerRef}
            tabIndex={-1}
            role="status"
            className="min-w-0 [overflow-wrap:anywhere] text-[12px] leading-relaxed text-[var(--foreground)] outline-none"
          >
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
          id="email-change-form"
          className="mt-3 rounded-xl border border-[var(--border)]/70 bg-[var(--surface)]/40 p-3.5"
        >
          <div className="grid gap-3 sm:grid-cols-2">
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
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
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
                setNewEmail("");
                setPassword("");
                // The form unmounts; return focus to the still-mounted Change button.
                changeBtnRef.current?.focus();
              }}
              className="rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] cursor-pointer"
            >
              {t("emailChange.dismiss")}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
