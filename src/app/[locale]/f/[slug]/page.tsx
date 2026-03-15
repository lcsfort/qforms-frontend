"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
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

export default function PublicFormPage() {
  const t = useTranslations("forms.publicForm");
  const params = useParams();
  const slug = params.slug as string;

  const [form, setForm] = useState<{
    title: string;
    description: string | null;
    schema: FormField[];
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
          title: data.title,
          description: data.description,
          schema: Array.isArray(data.schema) ? (data.schema as FormField[]) : [],
          settings: (data.settings as FormSettings) ?? {},
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSubmit = async (data: Record<string, unknown>) => {
    setSubmitError(null);
    try {
      await api.submitFormResponse(slug, data);
      setSubmitted(true);
    } catch (err: unknown) {
      const e = err as { message?: string };
      setSubmitError(e.message ?? "Something went wrong");
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-10 max-w-md w-full mx-4 text-center">
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
    <div
      className={`min-h-screen py-12 px-4 ${!pageBg ? "bg-gray-50 dark:bg-gray-900" : ""}`}
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
              onSubmit={handleSubmit}
              submitLabel={t("submit")}
            />
            {submitError && (
              <div className="mt-4 px-4 py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-600 dark:text-red-400 text-sm">
                {submitError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
