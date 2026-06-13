"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ListFilter, Users } from "lucide-react";
import { api } from "@/lib/api";
import { getUserAvatarUrl, getUserInitials } from "@/lib/userAvatar";
import type { AuditLogEntry, WorkspaceMemberRow } from "@/lib/types";
import { FilterMenu, type FilterOption } from "./FilterMenu";

const PAGE_SIZE = 20;

/** Actions offered in the "filter by action" menu ("" = all). */
const ACTION_FILTERS = [
  "",
  "FORM_CREATED",
  "FORM_UPDATED",
  "FORM_PUBLISHED",
  "FORM_UNPUBLISHED",
  "FORM_DELETED",
  "MEMBER_ROLE_UPDATED",
  "MEMBER_REMOVED",
  "INVITE_ACCEPTED",
  "INVITE_CREATED",
  "INVITE_CANCELLED",
] as const;

const REL_DIVISIONS: Array<[number, Intl.RelativeTimeFormatUnit]> = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [4.34524, "week"],
  [12, "month"],
  [Number.POSITIVE_INFINITY, "year"],
];

export function ActivityLog({
  token,
  workspaceId,
  members,
}: {
  token: string;
  workspaceId: string;
  members: WorkspaceMemberRow[];
}) {
  const t = useTranslations("workspace");
  const locale = useLocale();
  const rtf = useMemo(
    () => new Intl.RelativeTimeFormat(locale, { numeric: "auto" }),
    [locale],
  );

  const [items, setItems] = useState<AuditLogEntry[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [actionFilter, setActionFilter] = useState("");
  const [actorFilter, setActorFilter] = useState("");
  const filtersActive = actionFilter !== "" || actorFilter !== "";

  const actionOptions: FilterOption[] = useMemo(
    () =>
      ACTION_FILTERS.map((value) => ({
        value,
        label: t(`activity.filterAction.${value || "all"}`),
      })),
    [t],
  );
  const actorOptions: FilterOption[] = useMemo(
    () => [
      { value: "", label: t("activity.filterActor.anyone") },
      ...members.map((m) => ({
        value: m.userId,
        label: m.user.name?.trim() || m.user.email,
      })),
    ],
    [members, t],
  );

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .listWorkspaceAuditLog(token, workspaceId, {
        limit: PAGE_SIZE,
        action: actionFilter || undefined,
        actorId: actorFilter || undefined,
      })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setNextCursor(res.nextCursor);
        setHasMore(res.hasMore);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : t("activity.loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, workspaceId, actionFilter, actorFilter, t]);

  const loadMore = async () => {
    if (nextCursor == null || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await api.listWorkspaceAuditLog(token, workspaceId, {
        cursor: nextCursor,
        limit: PAGE_SIZE,
        action: actionFilter || undefined,
        actorId: actorFilter || undefined,
      });
      setItems((prev) => [...prev, ...res.items]);
      setNextCursor(res.nextCursor);
      setHasMore(res.hasMore);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("activity.loadFailed"));
    } finally {
      setLoadingMore(false);
    }
  };

  const relTime = (iso: string): string => {
    let duration = (new Date(iso).getTime() - Date.now()) / 1000;
    for (const [amount, unit] of REL_DIVISIONS) {
      if (Math.abs(duration) < amount) return rtf.format(Math.round(duration), unit);
      duration /= amount;
    }
    return rtf.format(Math.round(duration), "year");
  };

  const roleName = (value: unknown): string =>
    typeof value === "string" && value ? t(`role.${value}`) : "";

  const describe = (entry: AuditLogEntry): string => {
    const meta = (entry.metadata ?? {}) as Record<string, unknown>;
    const str = (key: string) => (typeof meta[key] === "string" ? (meta[key] as string) : "");
    const actor = entry.actor?.name?.trim() || entry.actor?.email || t("activity.someone");
    const formName = str("name") || t("activity.untitledForm");
    switch (entry.action) {
      case "WORKSPACE_CREATED":
        return t("activity.action.WORKSPACE_CREATED", { actor });
      case "FORM_CREATED":
        return t("activity.action.FORM_CREATED", { actor, name: formName });
      case "FORM_UPDATED":
        return t("activity.action.FORM_UPDATED", { actor, name: formName });
      case "FORM_PUBLISHED":
        return t("activity.action.FORM_PUBLISHED", { actor, name: formName });
      case "FORM_UNPUBLISHED":
        return t("activity.action.FORM_UNPUBLISHED", { actor, name: formName });
      case "FORM_DELETED":
        return t("activity.action.FORM_DELETED", { actor, name: formName });
      case "MEMBER_ROLE_UPDATED":
        return t("activity.action.MEMBER_ROLE_UPDATED", {
          actor,
          target: str("targetName") || str("targetEmail"),
          role: roleName(meta.newRole),
        });
      case "MEMBER_REMOVED":
        return t("activity.action.MEMBER_REMOVED", {
          actor,
          target: str("targetName") || str("targetEmail"),
        });
      case "INVITE_CREATED":
        return t("activity.action.INVITE_CREATED", {
          actor,
          email: str("email"),
          role: roleName(meta.role),
        });
      case "INVITE_CANCELLED":
        return t("activity.action.INVITE_CANCELLED", { actor, email: str("email") });
      case "INVITE_ACCEPTED":
        return t("activity.action.INVITE_ACCEPTED", { actor });
      default:
        return t("activity.action.generic", { actor, action: entry.action });
    }
  };

  return (
    <section className="soft-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-[var(--foreground)]">{t("activity.title")}</h2>
          <p className="mt-1 text-[13px] text-[var(--muted)]">{t("activity.subtitle")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterMenu
            value={actionFilter}
            options={actionOptions}
            onChange={setActionFilter}
            ariaLabel={t("activity.filterActionLabel")}
            icon={<ListFilter className="h-3.5 w-3.5" strokeWidth={2} />}
          />
          {members.length > 1 && (
            <FilterMenu
              value={actorFilter}
              options={actorOptions}
              onChange={setActorFilter}
              ariaLabel={t("activity.filterActorLabel")}
              icon={<Users className="h-3.5 w-3.5" strokeWidth={2} />}
            />
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-7 w-7 animate-spin rounded-full border-[3px] border-[var(--primary)]/20 border-t-[var(--primary)]" />
        </div>
      ) : error ? (
        <p className="mt-5 text-[13px] text-red-600 dark:text-red-400">{error}</p>
      ) : items.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-[var(--border)] px-4 py-8 text-center">
          <p className="text-[13px] text-[var(--muted)]">
            {filtersActive ? t("activity.emptyFiltered") : t("activity.empty")}
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-5 space-y-0.5">
            {items.map((entry) => {
              const avatarUrl = entry.actor ? getUserAvatarUrl(entry.actor) : null;
              const initials = entry.actor ? getUserInitials(entry.actor) : "·";
              return (
                <li key={entry.id} className="flex items-start gap-3 rounded-xl px-2 py-2.5">
                  <div className="relative mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--surface)]">
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="" fill className="object-cover" unoptimized />
                    ) : (
                      <span className="text-[11px] font-semibold text-[var(--foreground)]">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] leading-snug text-[var(--foreground)]">{describe(entry)}</p>
                    <p
                      className="mt-0.5 text-[12px] text-[var(--muted)]"
                      title={new Date(entry.createdAt).toLocaleString()}
                    >
                      {relTime(entry.createdAt)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          {hasMore && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="inline-flex h-9 items-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-[13px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:opacity-60 cursor-pointer"
              >
                {loadingMore ? t("activity.loading") : t("activity.loadMore")}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
