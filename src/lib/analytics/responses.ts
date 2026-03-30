import type { Form, FormField, FormResponse } from "@/lib/types";

export interface ResponsesFilters {
  dateFrom: string;
  dateTo: string;
  fieldIds: string[];
  segmentFieldId: string;
  segmentValue: string;
}

export interface KpiMetrics {
  totalResponses: number;
  uniqueIps: number;
  completionRate: number;
  averageAnsweredFields: number;
}

export interface TrendPoint {
  date: string;
  count: number;
}

export interface ChoiceCount {
  label: string;
  count: number;
}

export interface FieldAnalytics {
  fieldId: string;
  label: string;
  type: string;
  answeredCount: number;
  missingRate: number;
  topChoices: ChoiceCount[];
  numeric: {
    min: number;
    max: number;
    avg: number;
  } | null;
}

export interface AnomalySignal {
  date: string;
  count: number;
  severity: "medium" | "high";
  zScore: number;
}

export interface BiInsights {
  currentPeriod: number;
  previousPeriod: number;
  periodDeltaPct: number;
  momentum: "up" | "down" | "flat";
  strongestSegment: ChoiceCount | null;
  weakestSegment: ChoiceCount | null;
  forecastNextPeriod: number;
  narrative: string[];
}

export interface ResponsesDashboardData {
  fields: FormField[];
  filteredResponses: FormResponse[];
  kpis: KpiMetrics;
  trend: TrendPoint[];
  anomalies: AnomalySignal[];
  fieldAnalytics: FieldAnalytics[];
  bi: BiInsights;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseResponseDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getResponseValueAsStrings(value: unknown): string[] {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }
  const single = String(value).trim();
  return single ? [single] : [];
}

function getNumericValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function inDateRange(date: Date, from: string, to: string): boolean {
  const ts = date.getTime();
  const min = from ? new Date(`${from}T00:00:00`).getTime() : -Infinity;
  const max = to ? new Date(`${to}T23:59:59`).getTime() : Infinity;
  return ts >= min && ts <= max;
}

function getCategoricalDistribution(
  responses: FormResponse[],
  fieldId: string,
): ChoiceCount[] {
  const counts = new Map<string, number>();
  for (const response of responses) {
    const values = getResponseValueAsStrings(response.data[fieldId]);
    for (const value of values) {
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function computeTrend(responses: FormResponse[]): TrendPoint[] {
  const map = new Map<string, number>();
  for (const response of responses) {
    const date = parseResponseDate(response.submittedAt);
    if (!date) continue;
    const key = toDateOnly(date);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function computeAnomalies(trend: TrendPoint[]): AnomalySignal[] {
  if (trend.length < 6) return [];
  const values = trend.map((point) => point.count);
  const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  if (std === 0) return [];

  return trend
    .map((point) => {
      const zScore = (point.count - avg) / std;
      return {
        date: point.date,
        count: point.count,
        zScore,
        severity:
          Math.abs(zScore) >= 2.5
            ? ("high" as const)
            : ("medium" as const),
      };
    })
    .filter((signal) => Math.abs(signal.zScore) >= 1.8)
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
    .slice(0, 5);
}

function computeForecast(trend: TrendPoint[]): number {
  if (trend.length < 2) return trend[trend.length - 1]?.count ?? 0;
  const lastSeven = trend.slice(-7).map((point) => point.count);
  if (lastSeven.length < 2) return lastSeven[0] ?? 0;
  const avgGrowth =
    lastSeven
      .slice(1)
      .reduce((sum, value, idx) => sum + (value - lastSeven[idx]), 0) /
    (lastSeven.length - 1);
  const raw = (lastSeven[lastSeven.length - 1] ?? 0) + avgGrowth;
  return Math.max(0, Math.round(raw));
}

function computeBiInsights(
  trend: TrendPoint[],
  segmentDistribution: ChoiceCount[],
): BiInsights {
  const today = new Date();
  const startCurrent = today.getTime() - 7 * DAY_MS;
  const startPrevious = today.getTime() - 14 * DAY_MS;

  let currentPeriod = 0;
  let previousPeriod = 0;
  for (const point of trend) {
    const ts = new Date(`${point.date}T00:00:00`).getTime();
    if (ts >= startCurrent) currentPeriod += point.count;
    else if (ts >= startPrevious) previousPeriod += point.count;
  }

  const periodDeltaPct =
    previousPeriod === 0
      ? currentPeriod > 0
        ? 100
        : 0
      : ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  const momentum =
    periodDeltaPct > 5 ? "up" : periodDeltaPct < -5 ? "down" : "flat";
  const strongestSegment = segmentDistribution[0] ?? null;
  const weakestSegment =
    segmentDistribution.length > 1
      ? segmentDistribution[segmentDistribution.length - 1]
      : null;
  const forecastNextPeriod = computeForecast(trend);

  const narrative: string[] = [];
  if (momentum === "up") {
    narrative.push("Response volume is accelerating versus the prior period.");
  } else if (momentum === "down") {
    narrative.push("Response volume is cooling down compared to the prior period.");
  } else {
    narrative.push("Response volume is stable period-over-period.");
  }
  if (strongestSegment) {
    narrative.push(
      `Top segment is "${strongestSegment.label}" with ${strongestSegment.count} responses.`,
    );
  }
  narrative.push(
    `Estimated next period responses: ${forecastNextPeriod} (trend-based estimate).`,
  );

  return {
    currentPeriod,
    previousPeriod,
    periodDeltaPct,
    momentum,
    strongestSegment,
    weakestSegment,
    forecastNextPeriod,
    narrative,
  };
}

export function buildResponsesDashboardData(
  form: Form | null,
  responses: FormResponse[],
  filters: ResponsesFilters,
): ResponsesDashboardData {
  const fields = Array.isArray(form?.schema)
    ? ([...form.schema] as FormField[]).sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      )
    : [];

  const filteredResponses = responses.filter((response) => {
    const date = parseResponseDate(response.submittedAt);
    if (!date || !inDateRange(date, filters.dateFrom, filters.dateTo)) {
      return false;
    }
    if (filters.segmentFieldId && filters.segmentValue) {
      const values = getResponseValueAsStrings(response.data[filters.segmentFieldId]);
      if (!values.includes(filters.segmentValue)) return false;
    }
    return true;
  });

  const totalFields = fields.length || 1;
  let answeredCells = 0;
  let totalCells = 0;
  const ipSet = new Set<string>();
  for (const response of filteredResponses) {
    if (response.ip) ipSet.add(response.ip);
    for (const field of fields) {
      totalCells += 1;
      const values = getResponseValueAsStrings(response.data[field.id]);
      if (values.length > 0) answeredCells += 1;
    }
  }

  const completionRate = totalCells === 0 ? 0 : (answeredCells / totalCells) * 100;
  const averageAnsweredFields =
    filteredResponses.length === 0
      ? 0
      : answeredCells / filteredResponses.length;

  const trend = computeTrend(filteredResponses);
  const anomalies = computeAnomalies(trend);

  const visibleFieldSet =
    filters.fieldIds.length > 0 ? new Set(filters.fieldIds) : null;

  const fieldAnalytics = fields
    .filter((field) => !visibleFieldSet || visibleFieldSet.has(field.id))
    .map((field) => {
      const topChoices = getCategoricalDistribution(filteredResponses, field.id).slice(
        0,
        6,
      );
      const numericValues = filteredResponses
        .map((response) => getNumericValue(response.data[field.id]))
        .filter((value): value is number => value != null);
      const answeredCount = filteredResponses.reduce((acc, response) => {
        return acc + (getResponseValueAsStrings(response.data[field.id]).length > 0 ? 1 : 0);
      }, 0);
      const missingRate =
        filteredResponses.length === 0
          ? 0
          : ((filteredResponses.length - answeredCount) / filteredResponses.length) * 100;

      return {
        fieldId: field.id,
        label: field.label,
        type: field.type,
        answeredCount,
        missingRate,
        topChoices,
        numeric:
          numericValues.length > 0
            ? {
                min: Math.min(...numericValues),
                max: Math.max(...numericValues),
                avg:
                  numericValues.reduce((sum, value) => sum + value, 0) /
                  numericValues.length,
              }
            : null,
      };
    });

  const segmentDistribution =
    filters.segmentFieldId.length > 0
      ? getCategoricalDistribution(filteredResponses, filters.segmentFieldId)
      : [];

  const bi = computeBiInsights(trend, segmentDistribution);

  return {
    fields,
    filteredResponses,
    kpis: {
      totalResponses: filteredResponses.length,
      uniqueIps: ipSet.size,
      completionRate,
      averageAnsweredFields,
    },
    trend,
    anomalies,
    fieldAnalytics,
    bi,
  };
}

