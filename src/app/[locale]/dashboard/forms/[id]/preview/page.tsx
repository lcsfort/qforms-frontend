"use client";

import "@renderkit/ui-default/styles.css";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { SchemaRenderer } from "@renderkit/react";
import type { RenderKitDocument } from "@renderkit/schema";
import { useAppSelector } from "@/lib/redux/hooks";
import { api } from "@/lib/api";
import type { FormSettings } from "@/lib/types";

export default function FormPreviewPage() {
  const t = useTranslations("forms.publicForm");
  const tEditor = useTranslations("forms.editor");
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const locale = (params.locale as string) ?? "en";
  const { token, hydrated } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState<{
    schema: RenderKitDocument;
    settings: FormSettings;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.replace(`/${locale}/signin`);
      return;
    }
    const draftKey = `formPreviewDraft:${formId}`;
    try {
      const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(draftKey) : null;
      if (raw) {
        const draft = JSON.parse(raw) as { schema?: unknown; settings?: FormSettings };
        if (draft && draft.schema && typeof draft.schema === "object" && !Array.isArray(draft.schema)) {
          setForm({
            schema: draft.schema as RenderKitDocument,
            settings: draft.settings ?? {},
          });
          setLoading(false);
          return;
        }
      }
    } catch {
      // invalid draft, fall back to API
    }
    api
      .getForm(token, formId)
      .then((data) => {
        setForm({
          schema: data.schema as unknown as RenderKitDocument,
          settings: (data.settings as FormSettings) ?? {},
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token, formId, hydrated, router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t("notFound")}</h1>
          <p className="text-gray-500 mb-4">{t("notFoundDesc")}</p>
          <Link
            href={`/${locale}/dashboard/forms/${formId}`}
            className="text-indigo-600 font-medium hover:underline"
          >
            {tEditor("backToForms")}
          </Link>
        </div>
      </div>
    );
  }

  const pageBg = form.settings.page_background_color;

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--background)]">
      <div className="shrink-0 py-4 px-4 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={`/${locale}/dashboard/forms/${formId}`}
            className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {tEditor("backToForms")}
          </Link>
          <span className="text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
            {tEditor("preview")}
          </span>
        </div>
      </div>
      <div
        className={`force-light-theme qf-preview-surface flex-1 ${!pageBg ? "bg-gray-50" : ""}`}
        style={pageBg ? { backgroundColor: pageBg } : undefined}
      >
        {notice && (
          <div className="max-w-2xl mx-auto w-full px-4 pt-4">
            <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-700 text-xs px-3 py-2">
              {notice}
            </div>
          </div>
        )}
        <SchemaRenderer schema={form.schema} onSubmit={() => setNotice(tEditor("preview"))} />
      </div>
    </div>
  );
}
