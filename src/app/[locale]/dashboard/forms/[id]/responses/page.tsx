"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/navigation";
import { useAppSelector } from "@/lib/redux/hooks";
import { api } from "@/lib/api";
import type { Form, FormBehaviorAnalytics, FormResponse } from "@/lib/types";
import {
  type ResponsesFilters,
  buildResponsesDashboardData,
} from "@/lib/analytics/responses";
import { LineChartCard } from "@/components/analytics/LineChartCard";
import { BarChartCard } from "@/components/analytics/BarChartCard";
import { DonutChartCard } from "@/components/analytics/DonutChartCard";
import { ChartCard } from "@/components/analytics/ChartCard";
import { DashboardShell } from "@/components/DashboardShell";

export default function ResponsesPage() {
  const t = useTranslations("forms.responsesPage");
  const params = useParams();
  const router = useRouter();
  const formId = params.id as string;
  const { token, hydrated } = useAppSelector((state) => state.auth);

  const [form, setForm] = useState<Form | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [behavior, setBehavior] = useState<FormBehaviorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"responses" | "bi" | "behavior">("responses");
  const [filters, setFilters] = useState<ResponsesFilters>({
    dateFrom: "",
    dateTo: "",
    fieldIds: [],
    segmentFieldId: "",
    segmentValue: "",
  });
  const [showRawData, setShowRawData] = useState(false);

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
      return;
    }
    Promise.all([
      api.getForm(token, formId),
      api.getFormResponses(token, formId),
      api.getFormBehaviorAnalytics(token, formId),
    ])
      .then(([f, r, b]) => {
        setForm(f);
        setResponses(r);
        setBehavior(b);
      })
      .finally(() => setLoading(false));
  }, [hydrated, token, formId, router]);

  const dashboard = useMemo(
    () => buildResponsesDashboardData(form, responses, filters),
    [form, responses, filters],
  );

  const segmentField = useMemo(
    () =>
      dashboard.fields.find((field) => field.id === filters.segmentFieldId) ?? null,
    [dashboard.fields, filters.segmentFieldId],
  );
  const segmentOptions = useMemo(() => {
    if (!segmentField) return [];
    const distribution = dashboard.fieldAnalytics.find(
      (field) => field.fieldId === segmentField.id,
    );
    return distribution?.topChoices ?? [];
  }, [dashboard.fieldAnalytics, segmentField]);

  const trendLineData = useMemo(
    () => ({
      labels: dashboard.trend.map((point) => point.date),
      datasets: [
        {
          label: t("charts.submissionTrend"),
          data: dashboard.trend.map((point) => point.count),
          borderColor: "#7C3AED",
          backgroundColor: "rgba(124,58,237,0.16)",
          fill: true,
        },
      ],
    }),
    [dashboard.trend, t],
  );

  const segmentDonutData = useMemo(
    () => ({
      labels: segmentOptions.map((item) => item.label),
      datasets: [
        {
          data: segmentOptions.map((item) => item.count),
          backgroundColor: [
            "#7C3AED",
            "#06B6D4",
            "#10B981",
            "#F59E0B",
            "#EF4444",
            "#6366F1",
          ],
          borderWidth: 0,
        },
      ],
    }),
    [segmentOptions],
  );

  const topFieldChoices = useMemo(() => {
    return dashboard.fieldAnalytics
      .filter((field) => field.topChoices.length > 0)
      .slice(0, 1)[0];
  }, [dashboard.fieldAnalytics]);

  const topFieldBarData = useMemo(
    () => ({
      labels: topFieldChoices?.topChoices.map((item) => item.label) ?? [],
      datasets: [
        {
          label: t("charts.topAnswers"),
          data: topFieldChoices?.topChoices.map((item) => item.count) ?? [],
          backgroundColor: "rgba(124,58,237,0.85)",
          borderRadius: 8,
        },
      ],
    }),
    [topFieldChoices, t],
  );

  const behaviorFieldLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const field of dashboard.fields) {
      map.set(field.id, field.label);
    }
    return map;
  }, [dashboard.fields]);

  const behaviorFunnelData = useMemo(
    () => ({
      labels: behavior?.funnel.map((step) => t(`behavior.funnel.${step.step}`)) ?? [],
      datasets: [
        {
          label: t("behavior.funnel.title"),
          data: behavior?.funnel.map((step) => step.count) ?? [],
          backgroundColor: "rgba(124,58,237,0.85)",
          borderRadius: 8,
        },
      ],
    }),
    [behavior, t],
  );

  const slowestQuestionsData = useMemo(
    () => {
      const palette = [
        "#FF5F57",
        "#FEBB2E",
        "#28C840",
        "#0A84FF",
        "#BF5AF2",
        "#64D2FF",
      ];
      const topFields = behavior?.fields.slice(0, 6) ?? [];
      return {
        labels: topFields.map((_, index) => `Q${index + 1}`),
        datasets: [
          {
            label: t("behavior.slowestQuestions"),
            data: topFields.map((field) => Math.round(field.averageTimeMs / 1000)),
            backgroundColor: topFields.map((_, index) => palette[index % palette.length]),
            borderRadius: 8,
          },
        ],
      };
    },
    [behavior, t],
  );

  const slowestQuestionsLegend = useMemo(() => {
    const palette = ["#FF5F57", "#FEBB2E", "#28C840", "#0A84FF", "#BF5AF2", "#64D2FF"];
    const topFields = behavior?.fields.slice(0, 6) ?? [];
    return topFields.map((field, index) => ({
      key: field.fieldId,
      color: palette[index % palette.length],
      label: `Q${index + 1} - ${behaviorFieldLabelMap.get(field.fieldId) ?? field.fieldId}`,
      value: `${Math.round(field.averageTimeMs / 1000)}s`,
    }));
  }, [behavior, behaviorFieldLabelMap]);

  const deviceBreakdownData = useMemo(
    () => ({
      labels: behavior?.deviceBreakdown.map((item) => item.label) ?? [],
      datasets: [
        {
          data: behavior?.deviceBreakdown.map((item) => item.count) ?? [],
          backgroundColor: ["#7C3AED", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"],
          borderWidth: 0,
        },
      ],
    }),
    [behavior],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardShell contentContainerClassName="max-w-6xl mx-auto">
      <main className="px-6 pt-8 pb-12">
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
            {t("totalResponses", { count: dashboard.kpis.totalResponses })}
          </span>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[var(--card)] border border-[var(--border)] mb-6">
          {([
            ["responses", t("tabs.responses")],
            ["bi", t("tabs.bi")],
            ["behavior", t("tabs.behavior")],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeTab === key
                  ? "bg-indigo-600 text-white"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {responses.length === 0 ? (
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-12 text-center">
            <h2 className="text-lg font-semibold mb-2">{t("noResponses")}</h2>
            <p className="text-[var(--muted)] text-sm">{t("noResponsesDesc")}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
              <div className="flex flex-wrap gap-3">
                <div className="min-w-36">
                  <label className="block text-xs text-[var(--muted)] mb-1">
                    {t("filters.from")}
                  </label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
                  />
                </div>
                <div className="min-w-36">
                  <label className="block text-xs text-[var(--muted)] mb-1">
                    {t("filters.to")}
                  </label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
                  />
                </div>
                <div className="min-w-56">
                  <label className="block text-xs text-[var(--muted)] mb-1">
                    {t("filters.segmentField")}
                  </label>
                  <select
                    value={filters.segmentFieldId}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        segmentFieldId: e.target.value,
                        segmentValue: "",
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
                  >
                    <option value="">{t("filters.none")}</option>
                    {dashboard.fields.map((field) => (
                      <option key={field.id} value={field.id}>
                        {field.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-56">
                  <label className="block text-xs text-[var(--muted)] mb-1">
                    {t("filters.segmentValue")}
                  </label>
                  <select
                    value={filters.segmentValue}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, segmentValue: e.target.value }))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
                    disabled={!filters.segmentFieldId}
                  >
                    <option value="">{t("filters.allValues")}</option>
                    {segmentOptions.map((item) => (
                      <option key={item.label} value={item.label}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            {activeTab === "bi" && (
              <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                {
                  label: t("kpis.totalResponses"),
                  value: dashboard.kpis.totalResponses.toString(),
                },
                {
                  label: t("kpis.uniqueIps"),
                  value: dashboard.kpis.uniqueIps.toString(),
                },
                {
                  label: t("kpis.completionRate"),
                  value: `${dashboard.kpis.completionRate.toFixed(1)}%`,
                },
                {
                  label: t("kpis.avgAnswered"),
                  value: dashboard.kpis.averageAnsweredFields.toFixed(1),
                },
              ].map((card) => (
                <div
                  key={card.label}
                  className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4"
                >
                  <p className="text-xs text-[var(--muted)]">{card.label}</p>
                  <p className="text-2xl font-semibold mt-1">{card.value}</p>
                </div>
              ))}
              </section>
            )}

            {activeTab === "bi" && (
              <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <div className="xl:col-span-2">
                <LineChartCard
                  title={t("charts.submissionTrend")}
                  subtitle={t("charts.submissionTrendSubtitle")}
                  data={trendLineData}
                  empty={dashboard.trend.length === 0}
                  emptyLabel={t("emptyChart")}
                />
              </div>
              <DonutChartCard
                title={t("charts.segmentShare")}
                subtitle={t("charts.segmentShareSubtitle")}
                data={segmentDonutData}
                empty={segmentOptions.length === 0}
                emptyLabel={t("emptyChart")}
              />
              </section>
            )}

            {activeTab === "responses" && (
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <BarChartCard
                title={t("charts.topAnswers")}
                subtitle={topFieldChoices?.label ?? t("charts.pickFieldHint")}
                data={topFieldBarData}
                empty={!topFieldChoices}
                emptyLabel={t("emptyChart")}
              />
              <DonutChartCard
                title={t("charts.segmentShare")}
                subtitle={t("charts.segmentShareSubtitle")}
                data={segmentDonutData}
                empty={segmentOptions.length === 0}
                emptyLabel={t("emptyChart")}
              />
              </section>
            )}

            {activeTab === "bi" && (
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ChartCard title={t("bi.title")} subtitle={t("bi.subtitle")}>
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg bg-[var(--background)] p-3">
                      <p className="text-xs text-[var(--muted)]">{t("bi.currentPeriod")}</p>
                      <p className="text-xl font-semibold">{dashboard.bi.currentPeriod}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--background)] p-3">
                      <p className="text-xs text-[var(--muted)]">{t("bi.previousPeriod")}</p>
                      <p className="text-xl font-semibold">{dashboard.bi.previousPeriod}</p>
                    </div>
                    <div className="rounded-lg bg-[var(--background)] p-3">
                      <p className="text-xs text-[var(--muted)]">{t("bi.delta")}</p>
                      <p
                        className={`text-xl font-semibold ${
                          dashboard.bi.periodDeltaPct > 0
                            ? "text-emerald-600"
                            : dashboard.bi.periodDeltaPct < 0
                              ? "text-red-500"
                              : ""
                        }`}
                      >
                        {dashboard.bi.periodDeltaPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[var(--border)] p-3 text-sm">
                    <p className="font-medium mb-1">{t("bi.forecast")}</p>
                    <p className="text-[var(--muted)]">
                      {t("bi.forecastValue", {
                        value: dashboard.bi.forecastNextPeriod,
                      })}
                    </p>
                    <p className="text-xs text-[var(--muted)] mt-2">{t("bi.estimateDisclaimer")}</p>
                  </div>
                  <ul className="space-y-2 text-sm">
                    {dashboard.bi.narrative.map((line, idx) => (
                      <li key={`${line}-${idx}`} className="rounded-lg bg-[var(--background)] p-2">
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </ChartCard>
              <BarChartCard
                title={t("charts.segmentShare")}
                subtitle={t("charts.segmentShareSubtitle")}
                data={{
                  labels: segmentOptions.map((item) => item.label),
                  datasets: [
                    {
                      label: t("charts.segmentShare"),
                      data: segmentOptions.map((item) => item.count),
                      backgroundColor: "rgba(124,58,237,0.85)",
                      borderRadius: 8,
                    },
                  ],
                }}
                empty={segmentOptions.length === 0}
                emptyLabel={t("emptyChart")}
              />
              </section>
            )}

            {activeTab === "bi" && dashboard.anomalies.length > 0 && (
              <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
                <h3 className="font-semibold mb-2">{t("anomalies.title")}</h3>
                <div className="space-y-2">
                  {dashboard.anomalies.map((anomaly) => (
                    <div
                      key={anomaly.date}
                      className="flex items-center justify-between rounded-lg bg-[var(--background)] px-3 py-2 text-sm"
                    >
                      <span>
                        {anomaly.date} · {anomaly.count} {t("anomalies.responses")}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          anomaly.severity === "high"
                            ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                        }`}
                      >
                        {anomaly.severity}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === "responses" && (
              <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="font-semibold">{t("fieldBreakdowns")}</h3>
                <button
                  type="button"
                  onClick={() => setShowRawData((prev) => !prev)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-[var(--border)] hover:border-indigo-500"
                >
                  {showRawData ? t("hideRawData") : t("showRawData")}
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {dashboard.fieldAnalytics.map((field) => (
                  <div
                    key={field.fieldId}
                    className="rounded-xl border border-[var(--border)] p-3 bg-[var(--background)]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{field.label}</p>
                      <span className="text-xs text-[var(--muted)]">{field.type}</span>
                    </div>
                    <p className="text-xs text-[var(--muted)]">
                      {t("fieldStats", {
                        answered: field.answeredCount,
                        missing: field.missingRate.toFixed(1),
                      })}
                    </p>
                    {field.numeric ? (
                      <p className="text-xs mt-2">
                        {t("numericStats", {
                          min: field.numeric.min,
                          max: field.numeric.max,
                          avg: field.numeric.avg.toFixed(1),
                        })}
                      </p>
                    ) : null}
                    {field.topChoices.length > 0 ? (
                      <ul className="mt-2 space-y-1 text-xs">
                        {field.topChoices.slice(0, 3).map((choice) => (
                          <li
                            key={choice.label}
                            className="flex items-center justify-between rounded-md px-2 py-1 bg-[var(--card)] border border-[var(--border)]"
                          >
                            <span className="truncate">{choice.label}</span>
                            <span>{choice.count}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))}
              </div>

              {showRawData && (
                <div className="mt-4 overflow-x-auto rounded-xl border border-[var(--border)]">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border)] bg-[var(--background)]">
                        <th className="px-3 py-2 text-left">{t("submittedAt")}</th>
                        {dashboard.fields.map((field) => (
                          <th key={field.id} className="px-3 py-2 text-left">
                            {field.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.filteredResponses.map((response) => (
                        <tr key={response.id} className="border-b border-[var(--border)] last:border-b-0">
                          <td className="px-3 py-2 whitespace-nowrap">
                            {new Date(response.submittedAt).toLocaleString()}
                          </td>
                          {dashboard.fields.map((field) => (
                            <td key={field.id} className="px-3 py-2 max-w-[220px] truncate">
                              {Array.isArray(response.data[field.id])
                                ? (response.data[field.id] as unknown[])
                                    .map((item) => String(item))
                                    .join(", ")
                                : response.data[field.id] != null
                                  ? String(response.data[field.id])
                                  : "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
            )}

            {activeTab === "behavior" && (
              <section className="space-y-4">
                {!behavior || behavior.overview.totalSessions === 0 ? (
                  <ChartCard
                    title={t("behavior.title")}
                    subtitle={t("behavior.subtitle")}
                    empty
                    emptyLabel={t("behavior.empty")}
                  >
                    <div />
                  </ChartCard>
                ) : (
                  <>
                    <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                      {[
                        {
                          label: t("behavior.kpis.totalSessions"),
                          value: behavior.overview.totalSessions.toString(),
                        },
                        {
                          label: t("behavior.kpis.started"),
                          value: behavior.overview.startedSessions.toString(),
                        },
                        {
                          label: t("behavior.kpis.submitted"),
                          value: behavior.overview.submittedSessions.toString(),
                        },
                        {
                          label: t("behavior.kpis.completionRate"),
                          value: `${behavior.overview.completionRate.toFixed(1)}%`,
                        },
                      ].map((card) => (
                        <div
                          key={card.label}
                          className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4"
                        >
                          <p className="text-xs text-[var(--muted)]">{card.label}</p>
                          <p className="text-2xl font-semibold mt-1">{card.value}</p>
                        </div>
                      ))}
                    </section>

                    <section className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                      <div className="xl:col-span-2">
                        <BarChartCard
                          title={t("behavior.funnel.title")}
                          subtitle={t("behavior.funnel.subtitle")}
                          data={behaviorFunnelData}
                          empty={behavior.funnel.length === 0}
                          emptyLabel={t("emptyChart")}
                        />
                      </div>
                      <DonutChartCard
                        title={t("behavior.deviceBreakdown")}
                        subtitle={t("behavior.deviceBreakdownSubtitle")}
                        data={deviceBreakdownData}
                        empty={behavior.deviceBreakdown.length === 0}
                        emptyLabel={t("emptyChart")}
                      />
                    </section>

                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <BarChartCard
                        title={t("behavior.slowestQuestions")}
                        subtitle={t("behavior.slowestQuestionsSubtitle")}
                        data={slowestQuestionsData}
                        empty={behavior.fields.length === 0}
                        emptyLabel={t("emptyChart")}
                        hideXAxisLabels
                        legendItems={slowestQuestionsLegend}
                      />
                      <ChartCard
                        title={t("behavior.insights")}
                        subtitle={t("behavior.insightsSubtitle")}
                      >
                        <div className="space-y-2 text-sm">
                          <p>
                            {t("behavior.avgCompletion", {
                              seconds: (
                                behavior.overview.averageCompletionMs / 1000
                              ).toFixed(1),
                            })}
                          </p>
                          <p>
                            {t("behavior.medianCompletion", {
                              seconds: (
                                behavior.overview.medianCompletionMs / 1000
                              ).toFixed(1),
                            })}
                          </p>
                          {behavior.fields.slice(0, 5).map((field) => (
                            <div
                              key={field.fieldId}
                              className="rounded-lg bg-[var(--background)] px-3 py-2"
                            >
                              <p className="font-medium">
                                {behaviorFieldLabelMap.get(field.fieldId) ?? field.fieldId}
                              </p>
                              <p className="text-xs text-[var(--muted)]">
                                {t("behavior.fieldStats", {
                                  avgSeconds: (field.averageTimeMs / 1000).toFixed(1),
                                  edits: field.edits,
                                  dropOffs: field.dropOffs,
                                })}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ChartCard>
                    </section>
                  </>
                )}
              </section>
            )}
          </div>
        )}
      </main>
    </DashboardShell>
  );
}
