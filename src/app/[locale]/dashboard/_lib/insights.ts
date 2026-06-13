import type {
  AttentionKind,
  DashboardAttentionApiItem,
  DashboardLatestApiItem,
} from "@/lib/types";

export type { AttentionKind };

/**
 * Needs-attention / latest-responses are now computed on the backend across ALL
 * workspace forms (GET /forms/dashboard-insights) — see dashboardInsightsSlice.
 * These aliases keep the component prop shapes stable.
 */
export type AttentionItem = DashboardAttentionApiItem;
export type LatestResponseItem = DashboardLatestApiItem;

export function attentionHref(item: AttentionItem): string {
  switch (item.kind) {
    case "lowCompletion":
      return `/dashboard/forms/${item.form.id}/responses`;
    case "noResponses":
    case "draftIdle":
      return `/dashboard/forms/${item.form.id}`;
  }
}
