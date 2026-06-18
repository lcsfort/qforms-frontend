"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { SchemaRenderer } from "@renderkit/react";
import type { RenderKitDocument } from "@renderkit/schema";
import { api } from "@/lib/api";
import type { FormSettings } from "@/lib/types";
import { useRenderkitAnalytics } from "@/components/public-form/useRenderkitAnalytics";

export default function PublicFormPage() {
  const t = useTranslations("forms.publicForm");
  const params = useParams();
  const slug = params.slug as string;
  const locale = typeof params.locale === "string" ? params.locale : "en";

  const [form, setForm] = useState<{
    schema: RenderKitDocument;
    settings: FormSettings;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPublicForm(slug)
      .then((data) => {
        setForm({
          schema: data.schema as unknown as RenderKitDocument,
          settings: (data.settings as FormSettings) ?? {},
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const analytics = useRenderkitAnalytics({
    slug,
    locale,
    document: form?.schema ?? null,
    enabled: !submitted,
  });

  const handleSubmit = async (state: Record<string, unknown>) => {
    setSubmitError(null);
    try {
      await api.submitFormResponse(slug, state);
      analytics.onSubmitSuccess();
      setSubmitted(true);
    } catch (err: unknown) {
      const message = (err as { message?: string }).message ?? "Something went wrong";
      setSubmitError(message);
      analytics.onSubmitError(message);
      throw err;
    }
  };

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
          <p className="text-gray-500 dark:text-gray-400">{t("notFoundDesc")}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    const message = form.settings.submit_message || t("defaultThankYou");
    const pageBg = form.settings.page_background_color;
    const formBg = form.settings.form_background_color;
    return (
      <div
        className={`min-h-screen w-full flex flex-col justify-center py-12 px-4 ${!pageBg ? "bg-gray-50 dark:bg-gray-900" : ""}`}
        style={pageBg ? { backgroundColor: pageBg } : undefined}
      >
        <div
          className={`rounded-2xl shadow-lg p-10 max-w-md w-full mx-auto text-center ${!formBg ? "bg-card dark:bg-gray-800" : ""}`}
          style={formBg ? { backgroundColor: formBg } : undefined}
        >
          <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">{t("submitted")}</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
          {form.settings.allow_multiple_submissions && (
            <button
              onClick={() => setSubmitted(false)}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t("submitAnother")}
            </button>
          )}
          <p className="mt-6 pt-4 text-center text-xs text-gray-400 dark:text-gray-500">
            {t("poweredByPrefix")}
            <Link
              href="/"
              className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline transition-colors"
            >
              QForms
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // The RenderKit document owns the entire visual surface (theme, layout, hero,
  // fields, and the submit button). The host only provides a full-bleed page
  // background fallback and wires submit + analytics.
  const pageBg = form.settings.page_background_color;
  return (
    <div
      className={`min-h-screen w-full ${!pageBg ? "bg-gray-50 dark:bg-gray-900" : ""}`}
      style={pageBg ? { backgroundColor: pageBg } : undefined}
    >
      <div
        ref={analytics.containerRef}
        className="qf-form-surface"
        onFocusCapture={analytics.onFocusCapture}
        onBlurCapture={analytics.onBlurCapture}
      >
        <SchemaRenderer
          schema={form.schema}
          onChange={analytics.onChange}
          onAction={analytics.onAction}
          onSubmit={handleSubmit}
        />
      </div>
      {submitError && (
        <div className="max-w-2xl mx-auto px-4">
          <div className="mt-4 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm">
            {submitError}
          </div>
        </div>
      )}
    </div>
  );
}
