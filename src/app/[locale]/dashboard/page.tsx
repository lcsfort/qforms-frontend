"use client";

import { useEffect, useState } from "react";
import { useTranslations, useFormatter, useNow } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchProfile } from "@/lib/redux/authSlice";
import { fetchForms, deleteForm } from "@/lib/redux/formsSlice";
import { AppMenu } from "@/components/AppMenu";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tf = useTranslations("forms");
  const format = useFormatter();
  const now = useNow();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, hydrated } = useAppSelector((state) => state.auth);
  const { forms, loading: formsLoading } = useAppSelector((state) => state.forms);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
      return;
    }
    if (user && !user.isEmailVerified) {
      router.push("/verify-email-required");
      return;
    }
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [hydrated, token, user, dispatch, router]);

  useEffect(() => {
    if (token && user?.isEmailVerified) {
      dispatch(fetchForms());
    }
  }, [token, user?.isEmailVerified, dispatch]);

  const handleDeleteClick = (id: string) => {
    setDeleteFormId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteFormId) {
      dispatch(deleteForm(deleteFormId));
      setDeleteFormId(null);
    }
  };

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

      <main className="max-w-4xl mx-auto px-6 pt-20 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              {t("welcome", { name: user.name || "empty" })}
            </h1>
            <p className="text-[var(--muted)]">{t("subtitle")}</p>
          </div>
          <Link
            href="/dashboard/forms/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-5 py-2.5 rounded-lg transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {tf("newForm")}
          </Link>
        </div>

        {!user.isEmailVerified && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 text-yellow-700 dark:text-yellow-400 text-sm">
            {t("emailNotVerified")}
          </div>
        )}

        {formsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          </div>
        ) : forms.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">{tf("noForms")}</h2>
            <p className="text-[var(--muted)] text-sm mb-6">{tf("noFormsDesc")}</p>
            <Link
              href="/dashboard/forms/new"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm"
            >
              {t("generateBtn")}
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {forms.map((form) => (
              <div
                key={form.id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-5 flex items-center justify-between hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
              >
                <Link href={`/dashboard/forms/${form.id}`} className="flex-1 min-w-0 mr-4">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold truncate">{form.title}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        form.status === "published"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                      }`}
                    >
                      {form.status === "published" ? tf("published") : tf("draft")}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                    <span>{tf("responses", { count: form._count?.responses ?? 0 })}</span>
                    <span>{tf("edited")} {format.relativeTime(new Date(form.updatedAt), now)}</span>
                  </div>
                </Link>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/dashboard/forms/${form.id}/responses`}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-[var(--muted)]"
                    title={tf("responsesPage.title")}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => handleDeleteClick(form.id)}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-500"
                    title={tf("editor.deleteForm")}
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <ConfirmDialog
        open={deleteFormId !== null}
        onClose={() => setDeleteFormId(null)}
        onConfirm={handleDeleteConfirm}
        title={tf("deleteTitle")}
        message={tf("deleteConfirm")}
        confirmLabel={tf("editor.deleteForm")}
        cancelLabel={tf("cancel")}
        variant="danger"
      />
    </div>
  );
}
