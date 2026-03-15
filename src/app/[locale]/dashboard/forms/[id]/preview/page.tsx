"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAppSelector } from "@/lib/redux/hooks";
import { api } from "@/lib/api";
import type { FormField, FormSettings, FormMaxWidth } from "@/lib/types";
import { FormRenderer } from "@/components/FormRenderer";

const WIDTH_CLASSES: Record<FormMaxWidth, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  "2xl": "max-w-2xl",
  full: "max-w-full",
};

function getWidthClass(w?: FormMaxWidth): string {
  return WIDTH_CLASSES[w ?? "lg"] ?? "max-w-lg";
}

export default function FormPreviewPage() {
  const t = useTranslations("forms.publicForm");
  const tEditor = useTranslations("forms.editor");
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const locale = (params.locale as string) ?? "en";
  const { token, hydrated } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState<{
    title: string;
    description: string | null;
    schema: FormField[];
    settings: FormSettings;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
        const draft = JSON.parse(raw) as { title: string; description: string; schema: FormField[]; settings: FormSettings };
        if (draft && typeof draft.title === "string" && Array.isArray(draft.schema) && draft.settings) {
          setForm({
            title: draft.title,
            description: draft.description ?? null,
            schema: draft.schema,
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
          title: data.title,
          description: data.description,
          schema: Array.isArray(data.schema) ? (data.schema as FormField[]) : [],
          settings: (data.settings as FormSettings) ?? {},
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [token, formId, hydrated, router, locale]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">{t("notFound")}</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t("notFoundDesc")}</p>
          <Link
            href={`/${locale}/dashboard/forms/${formId}`}
            className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            {tEditor("backToForms")}
          </Link>
        </div>
      </div>
    );
  }

  const widthClass = getWidthClass(form.settings.max_width);
  const headerUrl = form.settings.header_image_url;
  const headerHeight = form.settings.header_height ?? 200;
  const pageBg = form.settings.page_background_color;
  const formBg = form.settings.form_background_color;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="py-4 px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href={`/${locale}/dashboard/forms/${formId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            {tEditor("backToForms")}
          </Link>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {tEditor("preview")}
          </span>
        </div>
      </div>
      <div
        className={`py-12 px-4 ${!pageBg ? "bg-gray-50 dark:bg-gray-900" : ""}`}
        style={pageBg ? { backgroundColor: pageBg } : undefined}
      >
        <div className={`${widthClass} mx-auto`}>
          <div
            className={`rounded-2xl shadow-lg overflow-hidden ${!formBg ? "bg-white dark:bg-gray-800" : ""}`}
            style={formBg ? { backgroundColor: formBg } : undefined}
          >
            {headerUrl && (
              <div
                className="w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${headerUrl})`,
                  height: `${headerHeight}px`,
                }}
              />
            )}
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-1">{form.title}</h1>
              {form.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{form.description}</p>
              )}
              <FormRenderer
                fields={form.schema}
                settings={form.settings}
                onSubmit={() => {}}
                disabled
                submitLabel={tEditor("preview")}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
