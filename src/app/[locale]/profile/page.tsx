"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchProfile, setUser } from "@/lib/redux/authSlice";
import { AppMenu } from "@/components/AppMenu";
import { api } from "@/lib/api";
import {
  getUpdateNameSchema,
  getChangePasswordSchema,
  type ChangePasswordValidationMessages,
  type UpdateNameValidationMessages,
} from "@/lib/validation";
import { ValidationError } from "yup";
import { Link } from "@/i18n/navigation";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
      return;
    }
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [hydrated, token, user, dispatch, router]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <div className="fixed top-4 left-4 z-50">
        <AppMenu />
      </div>

      <main className="max-w-2xl mx-auto px-6 pt-20 pb-12">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors inline-flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {t("backToDashboard")}
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

        <NameCard user={user} token={token!} />

        {user.authProvider !== "google" && (
          <div className="mt-6">
            <PasswordCard token={token!} />
          </div>
        )}

        <div className="mt-6">
          <AiSettingsCard token={token!} />
        </div>
      </main>
    </div>
  );
}

function NameCard({
  user,
  token,
}: {
  user: { id: string; email: string; name: string | null; isEmailVerified: boolean; authProvider?: "local" | "google" };
  token: string;
}) {
  const t = useTranslations("profile");
  const dispatch = useAppDispatch();

  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

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
      await getUpdateNameSchema(validationMessages).validate(
        { name },
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
      const updated = await api.updateName(token, { name });
      dispatch(setUser(updated));
      setSuccess(true);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setApiError(error.message ?? "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">{t("personalInfo")}</h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-[var(--muted)] mb-1.5">
          {t("emailLabel")}
        </label>
        <div className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-sm text-[var(--muted)]">
          {user.email}
        </div>
      </div>

      <form onSubmit={handleSaveName} noValidate>
        <label htmlFor="profile-name" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
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
          className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow text-sm"
        />
        {fieldErrors.name && (
          <p className="text-red-500 text-xs mt-1">{fieldErrors.name}</p>
        )}

        {apiError && (
          <p className="text-red-500 text-sm mt-3">{apiError}</p>
        )}
        {success && (
          <p className="text-green-600 dark:text-green-400 text-sm mt-3">{t("nameSaved")}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-4 bg-[var(--primary)] hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-lg transition-opacity text-sm disabled:opacity-50 cursor-pointer"
        >
          {saving ? t("saving") : t("saveBtn")}
        </button>
      </form>
    </div>
  );
}

function PasswordCard({ token }: { token: string }) {
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
      setApiError(error.message ?? "Something went wrong");
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
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-4">{t("changePassword")}</h2>

      <form onSubmit={handleChangePassword} noValidate>
        <div className="mb-4">
          <label htmlFor="current-password" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            {t("currentPasswordLabel")}
          </label>
          <input
            id="current-password"
            type="password"
            value={currentPassword}
            onChange={(e) => { setCurrentPassword(e.target.value); clearState(); }}
            placeholder={t("currentPasswordPlaceholder")}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow text-sm"
          />
          {fieldErrors.currentPassword && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.currentPassword}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="new-password" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            {t("newPasswordLabel")}
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); clearState(); }}
            placeholder={t("newPasswordPlaceholder")}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow text-sm"
          />
          {fieldErrors.newPassword && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.newPassword}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="confirm-new-password" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            {t("confirmPasswordLabel")}
          </label>
          <input
            id="confirm-new-password"
            type="password"
            value={confirmNewPassword}
            onChange={(e) => { setConfirmNewPassword(e.target.value); clearState(); }}
            placeholder={t("confirmPasswordPlaceholder")}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow text-sm"
          />
          {fieldErrors.confirmNewPassword && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.confirmNewPassword}</p>
          )}
        </div>

        {apiError && (
          <p className="text-red-500 text-sm mt-1 mb-3">{apiError}</p>
        )}
        {success && (
          <p className="text-green-600 dark:text-green-400 text-sm mt-1 mb-3">{t("passwordChanged")}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="bg-[var(--primary)] hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-lg transition-opacity text-sm disabled:opacity-50 cursor-pointer"
        >
          {saving ? t("changingPassword") : t("changePasswordBtn")}
        </button>
      </form>
    </div>
  );
}

const MODELS_BY_PROVIDER: Record<string, { id: string; label: string }[]> = {
  gemini: [
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  ],
  openai: [
    { id: "gpt-4.1", label: "GPT-4.1" },
    { id: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    { id: "o3-mini", label: "o3-mini" },
  ],
  claude: [
    { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { id: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku" },
  ],
};

function AiSettingsCard({ token }: { token: string }) {
  const t = useTranslations("profile.aiSettings");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [model, setModel] = useState<string | null>(null);
  const [customModel, setCustomModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [hasApiKey, setHasApiKey] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  const isCustomModel = useMemo(() => {
    if (!provider || !model) return false;
    const known = MODELS_BY_PROVIDER[provider] ?? [];
    return !known.some((m) => m.id === model);
  }, [provider, model]);

  const loadSettings = useCallback(async () => {
    try {
      const data = await api.getAiSettings(token);
      setProvider(data.provider);
      setHasApiKey(data.hasApiKey);
      if (data.model) {
        const known = MODELS_BY_PROVIDER[data.provider ?? ""] ?? [];
        if (known.some((m) => m.id === data.model)) {
          setModel(data.model);
          setCustomModel("");
        } else {
          setModel("__custom__");
          setCustomModel(data.model);
        }
      } else {
        setModel(null);
        setCustomModel("");
      }
    } catch {
      /* ignore load errors */
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const clearMessages = () => {
    setSuccess(null);
    setApiError(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setSaving(true);

    const resolvedModel = model === "__custom__" ? customModel : model;

    try {
      const data = await api.updateAiSettings(token, {
        provider,
        model: resolvedModel,
        apiKey: apiKey || undefined,
      });
      setProvider(data.provider);
      setHasApiKey(data.hasApiKey);
      setApiKey("");
      if (data.model) {
        const known = MODELS_BY_PROVIDER[data.provider ?? ""] ?? [];
        if (known.some((m) => m.id === data.model)) {
          setModel(data.model);
          setCustomModel("");
        } else {
          setModel("__custom__");
          setCustomModel(data.model);
        }
      }
      setSuccess(t("saved"));
    } catch {
      setApiError(t("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    clearMessages();
    setSaving(true);
    try {
      await api.updateAiSettings(token, {
        provider: null,
        model: null,
        apiKey: null,
      });
      setProvider(null);
      setModel(null);
      setCustomModel("");
      setApiKey("");
      setHasApiKey(false);
      setSuccess(t("cleared"));
    } catch {
      setApiError(t("error"));
    } finally {
      setSaving(false);
    }
  };

  const handleProviderChange = (newProvider: string) => {
    clearMessages();
    setProvider(newProvider || null);
    setModel(null);
    setCustomModel("");
    setApiKey("");
    setHasApiKey(false);
  };

  if (loading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
        <div className="animate-pulse h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-4" />
        <div className="animate-pulse h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    );
  }

  const providerModels = provider ? (MODELS_BY_PROVIDER[provider] ?? []) : [];

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6">
      <h2 className="text-lg font-semibold mb-1">{t("title")}</h2>
      <p className="text-sm text-[var(--muted)] mb-5">{t("description")}</p>

      <form onSubmit={handleSave} noValidate>
        <div className="mb-4">
          <label htmlFor="ai-provider" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
            {t("providerLabel")}
          </label>
          <select
            id="ai-provider"
            value={provider ?? ""}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow text-sm"
          >
            <option value="">{t("providerNone")}</option>
            <option value="gemini">{t("providerGemini")}</option>
            <option value="openai">{t("providerOpenai")}</option>
            <option value="claude">{t("providerClaude")}</option>
          </select>
        </div>

        {provider && (
          <>
            <div className="mb-4">
              <label htmlFor="ai-model" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                {t("modelLabel")}
              </label>
              <select
                id="ai-model"
                value={isCustomModel ? "__custom__" : (model ?? "")}
                onChange={(e) => {
                  clearMessages();
                  const val = e.target.value;
                  setModel(val || null);
                  if (val !== "__custom__") setCustomModel("");
                }}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow text-sm"
              >
                <option value="">—</option>
                {providerModels.map((m) => (
                  <option key={m.id} value={m.id}>{m.label}</option>
                ))}
                <option value="__custom__">{t("modelCustom")}</option>
              </select>

              {(model === "__custom__" || isCustomModel) && (
                <input
                  type="text"
                  value={customModel}
                  onChange={(e) => { setCustomModel(e.target.value); clearMessages(); }}
                  placeholder={t("modelPlaceholder")}
                  className="mt-2 w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow text-sm"
                />
              )}
            </div>

            <div className="mb-4">
              <label htmlFor="ai-api-key" className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                {t("apiKeyLabel")}
                {hasApiKey && !apiKey && (
                  <span className="ml-2 text-xs font-normal text-green-600 dark:text-green-400">
                    ({t("apiKeySet")})
                  </span>
                )}
              </label>
              <input
                id="ai-api-key"
                type="password"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); clearMessages(); }}
                placeholder={hasApiKey ? "••••••••••••" : t("apiKeyPlaceholder")}
                className="w-full px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent outline-none transition-shadow text-sm"
              />
              <p className="text-xs text-[var(--muted)] mt-1">{t("apiKeyHint")}</p>
            </div>
          </>
        )}

        {apiError && (
          <p className="text-red-500 text-sm mt-1 mb-3">{apiError}</p>
        )}
        {success && (
          <p className="text-green-600 dark:text-green-400 text-sm mt-1 mb-3">{success}</p>
        )}

        <div className="flex items-center gap-3">
          {provider && (
            <button
              type="submit"
              disabled={saving}
              className="bg-[var(--primary)] hover:opacity-90 text-white font-semibold px-5 py-2.5 rounded-lg transition-opacity text-sm disabled:opacity-50 cursor-pointer"
            >
              {saving ? t("saving") : t("save")}
            </button>
          )}

          {provider && (
            <button
              type="button"
              disabled={saving}
              onClick={handleClear}
              className="text-sm text-[var(--muted)] hover:text-red-500 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {t("clear")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
