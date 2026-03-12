"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useAppSelector } from "@/lib/redux/hooks";
import { api } from "@/lib/api";
import type { Form, FormField, FormResponse } from "@/lib/types";

export default function ResponsesPage() {
  const t = useTranslations("forms.responsesPage");
  const params = useParams();
  const formId = params.id as string;
  const { token } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    Promise.all([
      api.getForm(token, formId),
      api.getFormResponses(token, formId),
    ])
      .then(([f, r]) => {
        setForm(f);
        setResponses(r);
      })
      .finally(() => setLoading(false));
  }, [token, formId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  const fields = Array.isArray(form?.schema)
    ? (form.schema as FormField[])
    : [];

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <main className="max-w-6xl mx-auto px-6 pt-8 pb-12">
        <Link
          href={`/dashboard/forms/${formId}`}
          className="inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t("backToForm")}
        </Link>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">
            {t("title")} — {form?.title}
          </h1>
          <span className="text-sm text-[var(--muted)]">
            {t("totalResponses", { count: responses.length })}
          </span>
        </div>

        {responses.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <h2 className="text-lg font-semibold mb-2">{t("noResponses")}</h2>
            <p className="text-[var(--muted)] text-sm">{t("noResponsesDesc")}</p>
          </div>
        ) : (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-gray-50 dark:bg-gray-800/50">
                    <th className="px-4 py-3 text-left font-medium text-[var(--muted)] whitespace-nowrap">
                      #
                    </th>
                    {[...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((field) => (
                      <th
                        key={field.id}
                        className="px-4 py-3 text-left font-medium text-[var(--muted)] whitespace-nowrap"
                      >
                        {field.label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left font-medium text-[var(--muted)] whitespace-nowrap">
                      {t("submittedAt")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((resp, idx) => (
                    <tr
                      key={resp.id}
                      className="border-b border-[var(--border)] last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/30"
                    >
                      <td className="px-4 py-3 text-[var(--muted)]">{idx + 1}</td>
                      {[...fields].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((field) => {
                        const val = resp.data[field.id];
                        const display = Array.isArray(val)
                          ? val.join(", ")
                          : val != null
                            ? String(val)
                            : "—";
                        return (
                          <td key={field.id} className="px-4 py-3 max-w-[200px] truncate">
                            {display}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-[var(--muted)] whitespace-nowrap">
                        {new Date(resp.submittedAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
