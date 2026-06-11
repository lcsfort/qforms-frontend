import type { Form } from "@/lib/types";

export type AttentionKind = "lowCompletion" | "noResponses" | "draftIdle";

export interface AttentionItem {
  form: Form;
  kind: AttentionKind;
}

export interface LatestResponseItem {
  form: Form;
  lastResponseAt: string;
  responseCount: number;
}

const LOW_COMPLETION_THRESHOLD = 40;
const MIN_SESSIONS_FOR_COMPLETION = 5;
const MIN_VIEWS_FOR_NO_RESPONSES = 5;
const DRAFT_IDLE_DAYS = 7;

const ATTENTION_PRIORITY: Record<AttentionKind, number> = {
  lowCompletion: 0,
  noResponses: 1,
  draftIdle: 2,
};

/**
 * Derives "needs attention" signals from the loaded forms list.
 * Only uses real aggregates returned by the forms list endpoint.
 */
export function getAttentionItems(forms: Form[], now: Date, limit = 3): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const form of forms) {
    const stats = form.listStats;
    const responseCount = form._count?.responses ?? 0;

    if (
      form.status === "published" &&
      stats?.completionRate != null &&
      stats.startedSessions >= MIN_SESSIONS_FOR_COMPLETION &&
      stats.completionRate < LOW_COMPLETION_THRESHOLD
    ) {
      items.push({ form, kind: "lowCompletion" });
      continue;
    }

    if (
      form.status === "published" &&
      (stats?.viewCount ?? 0) >= MIN_VIEWS_FOR_NO_RESPONSES &&
      responseCount === 0
    ) {
      items.push({ form, kind: "noResponses" });
      continue;
    }

    if (form.status === "draft") {
      const idleMs = now.getTime() - new Date(form.updatedAt).getTime();
      if (idleMs > DRAFT_IDLE_DAYS * 24 * 60 * 60 * 1000) {
        items.push({ form, kind: "draftIdle" });
      }
    }
  }

  return items
    .sort((a, b) => ATTENTION_PRIORITY[a.kind] - ATTENTION_PRIORITY[b.kind])
    .slice(0, limit);
}

export function getLatestResponseItems(forms: Form[], limit = 3): LatestResponseItem[] {
  return forms
    .flatMap((form) => {
      const lastResponseAt = form.listStats?.lastResponseAt;
      if (!lastResponseAt) return [];
      return [{ form, lastResponseAt, responseCount: form._count?.responses ?? 0 }];
    })
    .sort((a, b) => new Date(b.lastResponseAt).getTime() - new Date(a.lastResponseAt).getTime())
    .slice(0, limit);
}

export function attentionHref(item: AttentionItem): string {
  switch (item.kind) {
    case "lowCompletion":
      return `/dashboard/forms/${item.form.id}/responses`;
    case "noResponses":
    case "draftIdle":
      return `/dashboard/forms/${item.form.id}`;
  }
}
