"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useAppSelector } from "@/lib/redux/hooks";
import { api } from "@/lib/api";
import type { FormField, FormSettings, FormMaxWidth } from "@/lib/types";
import { FormRenderer } from "@/components/FormRenderer";

const WIDTH_CLASSES: Record<FormMaxWidth, string> = {
  mobile: "max-w-sm",
  tablet: "max-w-xl",
  desktop: "max-w-2xl",
};

function getWidthClass(w?: FormMaxWidth): string {
  return WIDTH_CLASSES[w ?? "desktop"] ?? "max-w-2xl";
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

  const settings = form?.settings;

  const headerStyle = useMemo(() => {
    if (!settings) return undefined;
    const s: React.CSSProperties = {};
    if (settings.header_font_family) s.fontFamily = settings.header_font_family;
    if (settings.header_font_size != null) s.fontSize = `${settings.header_font_size}px`;
    return Object.keys(s).length ? s : undefined;
  }, [settings?.header_font_family, settings?.header_font_size]);

  const textStyle = useMemo(() => {
    if (!settings) return undefined;
    const s: React.CSSProperties = {};
    if (settings.text_font_family) s.fontFamily = settings.text_font_family;
    if (settings.text_font_size != null) s.fontSize = `${settings.text_font_size}px`;
    return Object.keys(s).length ? s : undefined;
  }, [settings?.text_font_family, settings?.text_font_size]);

  const fontFamiliesToLoad = useMemo(() => {
    if (!settings) return [];
    const set = new Set<string>();
    [settings.header_font_family, settings.question_font_family, settings.text_font_family].forEach((f) => {
      if (f && f.trim()) set.add(f.trim());
    });
    return Array.from(set);
  }, [settings?.header_font_family, settings?.question_font_family, settings?.text_font_family]);

  const googleFontsHref =
    fontFamiliesToLoad.length > 0
      ? `https://fonts.googleapis.com/css2?${fontFamiliesToLoad.map((f) => `family=${encodeURIComponent(f)}`).join("&")}&display=swap`
      : null;

  useEffect(() => {
    if (!googleFontsHref) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = googleFontsHref;
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, [googleFontsHref]);

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

  const widthClass = getWidthClass(form.settings.max_width);
  const headerUrl = form.settings.header_image_url;
  const headerHeight = form.settings.header_height ?? 200;
  const pageBg = form.settings.page_background_color;
  const formBg = form.settings.form_background_color;

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
        className={`force-light-theme flex-1 flex flex-col justify-center py-12 px-4 ${!pageBg ? "bg-gray-50" : ""}`}
        style={pageBg ? { backgroundColor: pageBg } : undefined}
      >
        <div className={`${widthClass} mx-auto w-full`}>
          <div
            className={`rounded-2xl shadow-lg overflow-hidden ${!formBg ? "bg-white" : ""}`}
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
              <h1 className="text-2xl font-bold mb-1" style={headerStyle}>{form.title}</h1>
              {form.description && (
                <p className="text-sm text-gray-500 mb-6" style={textStyle}>{form.description}</p>
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
