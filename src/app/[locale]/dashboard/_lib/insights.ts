import type { Form } from "@/lib/types";
import { DEFAULT_PREFERENCES, type AttentionPreferences } from "@/lib/preferences";

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

const ATTENTION_PRIORITY: Record<AttentionKind, number> = {
  lowCompletion: 0,
  noResponses: 1,
  draftIdle: 2,
};

/**
 * Derives "needs attention" signals from the loaded forms list.
 * Only uses real aggregates returned by the forms list endpoint;
 * the rules and thresholds come from the user's preferences.
 */
export function getAttentionItems(
  forms: Form[],
  now: Date,
  config: AttentionPreferences = DEFAULT_PREFERENCES.attention,
  limit = 3,
): AttentionItem[] {
  const items: AttentionItem[] = [];

  for (const form of forms) {
    const stats = form.listStats;
    const responseCount = form._count?.responses ?? 0;

    if (
      config.lowCompletionEnabled &&
      form.status === "published" &&
      stats?.completionRate != null &&
      stats.startedSessions >= config.minSessions &&
      stats.completionRate < config.lowCompletionThreshold
    ) {
      items.push({ form, kind: "lowCompletion" });
      continue;
    }

    if (
      config.noResponsesEnabled &&
      form.status === "published" &&
      (stats?.viewCount ?? 0) >= config.minViews &&
      responseCount === 0
    ) {
      items.push({ form, kind: "noResponses" });
      continue;
    }

    if (config.draftIdleEnabled && form.status === "draft") {
      const idleMs = now.getTime() - new Date(form.updatedAt).getTime();
      if (idleMs > config.draftIdleDays * 24 * 60 * 60 * 1000) {
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
