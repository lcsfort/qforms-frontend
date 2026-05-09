"use client";

import { useEffect } from "react";
import { Link } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import {
  fetchWorkspaces,
  hydrateWorkspace,
  setActiveWorkspace,
} from "@/lib/redux/workspaceSlice";

export function WorkspaceSwitcher() {
  const dispatch = useAppDispatch();
  const { token, hydrated } = useAppSelector((s) => s.auth);
  const { items, activeWorkspaceId, loading } = useAppSelector(
    (s) => s.workspace,
  );

  useEffect(() => {
    dispatch(hydrateWorkspace());
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated || !token) return;
    dispatch(fetchWorkspaces());
  }, [dispatch, hydrated, token]);

  const active = items.find((w) => w.id === activeWorkspaceId);

  if (!token || items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)]/35 px-3.5 py-3 mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-[0.12em]">
          Workspace
        </span>
        <Link
          href="/dashboard/workspace"
          className="text-[11px] font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
        >
          Manage
        </Link>
      </div>
      <select
        value={activeWorkspaceId ?? ""}
        disabled={loading}
        onChange={(e) => dispatch(setActiveWorkspace(e.target.value || null))}
        className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-[13px] text-[var(--foreground)]"
      >
        {items.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name} ({w.role})
          </option>
        ))}
      </select>
      {active ? (
        <p
          className="text-[10px] text-[var(--muted)] mt-2 truncate"
          title={active.slug}
        >
          {active.slug}
        </p>
      ) : null}
    </div>
  );
}
