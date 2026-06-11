"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, ChevronsUpDown } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { setActiveWorkspace } from "@/lib/redux/workspaceSlice";

type WorkspaceSwitcherProps = {
  /** "header" renders a compact pill with a popover; "panel" renders the list inline (mobile drawer). */
  variant?: "header" | "panel";
  /** Called when a link inside the switcher navigates away (lets a parent drawer close itself). */
  onNavigate?: () => void;
};

export function WorkspaceSwitcher({ variant = "header", onNavigate }: WorkspaceSwitcherProps) {
  const t = useTranslations("shell");
  const tWorkspace = useTranslations("workspace");
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((s) => s.auth);
  const { items, activeWorkspaceId, loading } = useAppSelector((s) => s.workspace);
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const active = items.find((w) => w.id === activeWorkspaceId);

  if (!token || items.length === 0) return null;

  const workspaceList = (
    <div className="flex flex-col gap-0.5">
      {items.map((workspace) => {
        const isActive = workspace.id === activeWorkspaceId;
        return (
          <button
            key={workspace.id}
            type="button"
            onClick={() => {
              dispatch(setActiveWorkspace(workspace.id));
              setOpen(false);
            }}
            aria-current={isActive ? "true" : undefined}
            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-100 cursor-pointer ${
              isActive
                ? "bg-[var(--primary)]/8 text-[var(--foreground)]"
                : "text-[var(--foreground)] hover:bg-[var(--surface)]/70"
            }`}
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--border)]/80 bg-[var(--surface)]/70 text-[12px] font-semibold text-[var(--foreground)]">
              {workspace.name.charAt(0).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[13px] font-medium leading-tight">{workspace.name}</span>
              <span className="block truncate text-[11px] text-[var(--muted)]">
                {tWorkspace(`role.${workspace.role}`)}
              </span>
            </span>
            {isActive && <Check className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" strokeWidth={2.5} />}
          </button>
        );
      })}
    </div>
  );

  const manageLink = (
    <Link
      href="/dashboard/workspace"
      onClick={() => {
        setOpen(false);
        onNavigate?.();
      }}
      className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12.5px] font-medium text-[var(--primary)] transition-colors duration-100 hover:bg-[var(--primary)]/8"
    >
      {t("manageWorkspace")}
    </Link>
  );

  if (variant === "panel") {
    return (
      <div>
        <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
          {t("workspaceLabel")}
        </p>
        {workspaceList}
        <div className="mt-1 border-t border-[var(--border)]/60 pt-1">{manageLink}</div>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        disabled={loading}
        aria-expanded={open}
        aria-label={t("switchWorkspace")}
        className="flex h-9 max-w-[200px] items-center gap-2 rounded-xl border border-[var(--border)]/80 bg-[var(--card)] px-2 pr-2.5 text-[13px] text-[var(--foreground)] transition-colors duration-100 hover:bg-[var(--surface)]/70 disabled:opacity-60 cursor-pointer"
      >
        <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--border)]/70 bg-[var(--surface)]/70 text-[11px] font-semibold">
          {active?.name.charAt(0).toUpperCase() ?? "W"}
        </span>
        <span className="hidden min-w-0 truncate font-medium sm:block">
          {active?.name ?? t("workspaceLabel")}
        </span>
        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" strokeWidth={2} />
      </button>

      {open && (
        <div className="menu-enter absolute right-0 top-full z-50 mt-1.5 w-64 rounded-xl border border-[var(--border)]/80 bg-[var(--card)] py-1.5 shadow-xl shadow-black/8 glass-panel dark:shadow-black/20">
          <p className="px-4 pb-1.5 pt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
            {t("workspaceLabel")}
          </p>
          <div className="px-1.5">{workspaceList}</div>
          <div className="mx-1.5 mt-1 border-t border-[var(--border)]/50 pt-1">{manageLink}</div>
        </div>
      )}
    </div>
  );
}
