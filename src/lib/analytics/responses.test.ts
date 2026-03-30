import { describe, expect, it } from "vitest";
import type { Form, FormResponse } from "../types";
import { buildResponsesDashboardData } from "./responses";

const form: Form = {
  id: "form_1",
  title: "Survey",
  description: null,
  slug: "survey",
  status: "draft",
  schema: [
    { id: "q1", type: "radio", label: "Channel", order: 1, options: [] },
    { id: "q2", type: "number", label: "Score", order: 2 },
  ],
  settings: {},
  createdBy: "user_1",
  createdAt: "2026-03-01T00:00:00.000Z",
  updatedAt: "2026-03-01T00:00:00.000Z",
};

const responses: FormResponse[] = [
  {
    id: "r1",
    formId: "form_1",
    data: { q1: "Email", q2: 8 },
    ip: "1.1.1.1",
    submittedAt: "2026-03-20T12:00:00.000Z",
  },
  {
    id: "r2",
    formId: "form_1",
    data: { q1: "Email", q2: 9 },
    ip: "2.2.2.2",
    submittedAt: "2026-03-21T12:00:00.000Z",
  },
  {
    id: "r3",
    formId: "form_1",
    data: { q1: "Social", q2: 3 },
    ip: "3.3.3.3",
    submittedAt: "2026-03-22T12:00:00.000Z",
  },
];

describe("buildResponsesDashboardData", () => {
  it("computes KPI and field analytics", () => {
    const data = buildResponsesDashboardData(form, responses, {
      dateFrom: "",
      dateTo: "",
      fieldIds: [],
      segmentFieldId: "q1",
      segmentValue: "",
    });

    expect(data.kpis.totalResponses).toBe(3);
    expect(data.kpis.uniqueIps).toBe(3);
    expect(data.fieldAnalytics[0]?.topChoices[0]).toEqual({
      label: "Email",
      count: 2,
    });
    expect(data.fieldAnalytics[1]?.numeric?.avg).toBeCloseTo(6.666, 2);
  });

  it("applies segment filter", () => {
    const data = buildResponsesDashboardData(form, responses, {
      dateFrom: "",
      dateTo: "",
      fieldIds: [],
      segmentFieldId: "q1",
      segmentValue: "Social",
    });
    expect(data.filteredResponses).toHaveLength(1);
    expect(data.kpis.totalResponses).toBe(1);
  });

  it("builds BI deltas and forecast", () => {
    const data = buildResponsesDashboardData(form, responses, {
      dateFrom: "",
      dateTo: "",
      fieldIds: [],
      segmentFieldId: "q1",
      segmentValue: "",
    });
    expect(data.bi.currentPeriod).toBeGreaterThanOrEqual(0);
    expect(data.bi.forecastNextPeriod).toBeGreaterThanOrEqual(0);
    expect(["up", "down", "flat"]).toContain(data.bi.momentum);
  });
});

