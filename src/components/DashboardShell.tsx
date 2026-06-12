"use client";

import { type ComponentType, type ReactNode, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchWorkspaces, hydrateWorkspace } from "@/lib/redux/workspaceSlice";
import { setSelectedBuildMode } from "@/lib/redux/formsSlice";
import { getPreferences, hydratePreferencesFromServer } from "@/lib/preferences";
import { AppMenu } from "@/components/AppMenu";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import {
  House,
  LayoutTemplate,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Users,
  X,
} from "lucide-react";

type DashboardShellProps = {
  children: ReactNode;
  contentContainerClassName?: string;
  mainClassName?: string;
  hideHeader?: boolean;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isSearchFocused?: boolean;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  headerRight?: ReactNode;
};

type NavKey = "navHome" | "navTemplates" | "navWorkspace" | "navSettings";

type NavEntry = {
  key: NavKey;
  href: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  isActive: (path: string) => boolean;
};

const NAV_ENTRIES: NavEntry[] = [
  {
    key: "navHome",
    href: "/dashboard",
    icon: House,
    isActive: (path) => path === "/dashboard",
  },
  {
    key: "navTemplates",
    href: "/dashboard/templates",
    icon: LayoutTemplate,
    isActive: (path) => path === "/dashboard/templates" || path.startsWith("/dashboard/templates/"),
  },
  {
    key: "navWorkspace",
    href: "/dashboard/workspace",
    icon: Users,
    isActive: (path) => path === "/dashboard/workspace" || path.startsWith("/dashboard/workspace/"),
  },
  {
    key: "navSettings",
    href: "/profile",
    icon: Settings,
    isActive: (path) => path === "/profile" || path.startsWith("/profile/"),
  },
];

/* The stored default build mode is applied once per app load (the user can
   still toggle modes freely inside the creation flow afterwards). */
let hasAppliedDefaultBuildMode = false;

function BrandWordmark() {
  return (
    <span className="inline-flex items-center rounded-2xl border border-[var(--border)]/60 bg-[var(--surface)]/50 px-2.5 py-1">
      <span className="font-semibold text-[17px] tracking-tight">
        <span className="text-[var(--primary)]">Q</span>
        <span className="text-[var(--foreground)]">Forms</span>
      </span>
    </span>
  );
}

export function DashboardShell({
  children,
  contentContainerClassName = "max-w-5xl mx-auto",
  mainClassName = "dashboard-main-scroll flex-1 overflow-y-auto px-5 sm:px-8 pt-[88px] pb-16 bg-[var(--background)]/70",
  hideHeader = false,
  showSearch = true,
  searchQuery,
  onSearchQueryChange,
  searchInputRef,
  isSearchFocused,
  onSearchFocus,
  onSearchBlur,
  headerRight,
}: DashboardShellProps) {
  const tDashboard = useTranslations("dashboard");
  const tShell = useTranslations("shell");
  const tWorkspace = useTranslations("workspace");
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { token, hydrated } = useAppSelector((state) => state.auth);
  const { items: workspaces, activeWorkspaceId } = useAppSelector((state) => state.workspace);

  const [isContentScrolled, setIsContentScrolled] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localSearchFocused, setLocalSearchFocused] = useState(false);
  const localSearchInputRef = useRef<HTMLInputElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpenRef = useRef(false);

  const resolvedQuery = searchQuery ?? localSearchQuery;
  const resolvedFocused = isSearchFocused ?? localSearchFocused;
  const resolvedSearchRef = searchInputRef ?? localSearchInputRef;

  // Path without the locale prefix, e.g. /en/dashboard -> /dashboard
  const pathWithoutLocale = `/${pathname.split("/").slice(2).join("/")}`;
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  useEffect(() => {
    dispatch(hydrateWorkspace());
  }, [dispatch]);

  useEffect(() => {
    if (!hydrated || !token) return;
    dispatch(fetchWorkspaces());
    // Pull the account's preferences, then apply the stored default build mode once per app load.
    void (async () => {
      await hydratePreferencesFromServer(token);
      if (!hasAppliedDefaultBuildMode) {
        hasAppliedDefaultBuildMode = true;
        const mode = getPreferences().defaultBuildMode;
        if (mode !== "planning") {
          dispatch(setSelectedBuildMode(mode));
        }
      }
    })();
  }, [dispatch, hydrated, token]);

  useEffect(() => {
    if (!isMobileNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMobileNavOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isMobileNavOpen]);

  // Move focus into the drawer when it opens; hand it back to the trigger when it closes.
  useEffect(() => {
    if (isMobileNavOpen) {
      drawerWasOpenRef.current = true;
      drawerCloseRef.current?.focus();
    } else if (drawerWasOpenRef.current) {
      drawerWasOpenRef.current = false;
      mobileNavTriggerRef.current?.focus();
    }
  }, [isMobileNavOpen]);

  useEffect(() => {
    if (!showSearch) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        resolvedSearchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showSearch, resolvedSearchRef]);

  const setQuery = (value: string) => {
    if (onSearchQueryChange) {
      onSearchQueryChange(value);
    } else {
      setLocalSearchQuery(value);
    }
  };

  const handleSearchFocus = () => {
    onSearchFocus?.();
    if (isSearchFocused === undefined) {
      setLocalSearchFocused(true);
    }
  };

  const handleSearchBlur = () => {
    onSearchBlur?.();
    if (isSearchFocused === undefined) {
      setLocalSearchFocused(false);
    }
  };

  const handleContentScroll = () => {
    const scrollTop = contentScrollRef.current?.scrollTop ?? 0;
    const nextScrolled = scrollTop > 8;
    setIsContentScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
  };

  const shouldShowHeader = !hideHeader || isSidebarCollapsed;

  const createCta = (
    <Link
      href="/dashboard/forms/new"
      onClick={() => setIsMobileNavOpen(false)}
      className="cta-gradient inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 text-[13.5px] font-semibold text-white"
    >
      <Plus className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      {tShell("createForm")}
    </Link>
  );

  const navList = (
    <nav aria-label={tShell("navLabel")} className="flex flex-col gap-1">
      {NAV_ENTRIES.map((entry) => {
        const Icon = entry.icon;
        const active = entry.isActive(pathWithoutLocale);
        return (
          <Link
            key={entry.key}
            href={entry.href}
            onClick={() => setIsMobileNavOpen(false)}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-[13px] transition-colors duration-150 ${
              active
                ? "border-[var(--border)]/80 bg-[var(--card)] font-medium text-[var(--foreground)] shadow-sm"
                : "border-transparent text-[var(--muted)] hover:bg-[var(--surface)]/60 hover:text-[var(--foreground)]"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${active ? "text-[var(--primary)]" : ""}`}
              strokeWidth={1.8}
            />
            {tShell(entry.key)}
          </Link>
        );
      })}
    </nav>
  );

  const workspaceCard = activeWorkspace ? (
    <div className="rounded-xl border border-[var(--border)]/70 bg-[var(--card)]/70 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
        {tShell("workspaceLabel")}
      </p>
      <p className="mt-1.5 truncate text-[13px] font-semibold text-[var(--foreground)]" title={activeWorkspace.name}>
        {activeWorkspace.name}
      </p>
      <p className="truncate text-[11px] text-[var(--muted)]">{tWorkspace(`role.${activeWorkspace.role}`)}</p>
      <Link
        href="/dashboard/workspace"
        className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary-dark)]"
      >
        {tShell("manageWorkspace")}
      </Link>
    </div>
  ) : null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <aside
        inert={isSidebarCollapsed}
        className={`hidden lg:block shrink-0 h-screen sticky top-0 overflow-hidden bg-[var(--background)] ${
          isSidebarCollapsed ? "w-0" : "w-[264px]"
        }`}
        style={{
          transitionProperty: "width",
          transitionDuration: "360ms",
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "width",
        }}
      >
        <div
          className={`flex h-full w-[264px] flex-col px-4 pb-4 pt-5 ${
            isSidebarCollapsed ? "opacity-0 -translate-x-2" : "opacity-100 translate-x-0"
          }`}
          style={{
            transitionProperty: "opacity, transform",
            transitionDuration: "320ms",
            transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
            willChange: "opacity, transform",
          }}
        >
          <div className="mb-5 flex items-center justify-between pl-1">
            <Link href="/dashboard" className="flex min-w-0 items-center">
              <BrandWordmark />
            </Link>
            <button
              type="button"
              onClick={() => setIsSidebarCollapsed(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] cursor-pointer"
              aria-label={tShell("collapseSidebar")}
            >
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>

          <div className="mb-6">{createCta}</div>

          {navList}

          <div className="mt-auto flex flex-col gap-2 pt-6">{workspaceCard}</div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 p-3 lg:pl-1.5">
        <div className="relative h-full rounded-2xl border border-[var(--border)]/70 bg-[var(--card)]/80 backdrop-blur-sm overflow-hidden flex flex-col">
          {shouldShowHeader && (
            <header
              className={`absolute top-0 left-0 right-0 z-50 border-b transition-all duration-200 ${
                isContentScrolled ? "header-glass-scrolled shadow-sm" : "header-glass-top"
              }`}
            >
              <div className="flex h-14 items-center gap-2.5 px-4 sm:px-6">
                <button
                  ref={mobileNavTriggerRef}
                  type="button"
                  onClick={() => setIsMobileNavOpen(true)}
                  className="lg:hidden inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)]/70 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] cursor-pointer"
                  aria-label={tShell("openNav")}
                  aria-expanded={isMobileNavOpen}
                >
                  <Menu className="h-4 w-4" strokeWidth={1.8} />
                </button>

                {isSidebarCollapsed && (
                  <button
                    type="button"
                    onClick={() => setIsSidebarCollapsed(false)}
                    className="hidden lg:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)]/70 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] cursor-pointer"
                    aria-label={tShell("expandSidebar")}
                  >
                    <PanelLeftOpen className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                )}

                {/* On the narrowest screens the search field needs the room more than the wordmark does */}
                <Link
                  href="/dashboard"
                  className={`${
                    isSidebarCollapsed
                      ? showSearch
                        ? "hidden sm:flex"
                        : "flex"
                      : showSearch
                        ? "hidden sm:flex lg:hidden"
                        : "flex lg:hidden"
                  } min-w-0 shrink-0 items-center`}
                >
                  <BrandWordmark />
                </Link>

                {showSearch ? (
                  <div className="flex min-w-0 flex-1 justify-center px-1 sm:px-4">
                    <div className="relative w-full max-w-xl">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                      </svg>
                      <input
                        ref={resolvedSearchRef}
                        type="text"
                        value={resolvedQuery}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                        placeholder={tDashboard("searchPlaceholder")}
                        className={`w-full h-9 rounded-xl border border-[var(--border)] bg-[var(--background)]/80 pl-9 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/40 ${
                          resolvedQuery || resolvedFocused ? "pr-8" : "pr-16"
                        }`}
                      />
                      {resolvedQuery && (
                        <button
                          type="button"
                          onClick={() => setQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                          aria-label={tDashboard("clearSearch")}
                        >
                          <X className="h-3.5 w-3.5" strokeWidth={2} />
                        </button>
                      )}
                      {!resolvedQuery && !resolvedFocused && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[var(--muted)] border border-[var(--border)] rounded px-1.5 py-px hidden sm:inline pointer-events-none font-mono">
                          {tDashboard("searchShortcut")}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                <div className="flex shrink-0 items-center gap-2">
                  <div className="hidden md:block">
                    <WorkspaceSwitcher />
                  </div>
                  {headerRight}
                  <AppMenu />
                </div>
              </div>
            </header>
          )}

          <main
            ref={contentScrollRef}
            onScroll={handleContentScroll}
            className={`${mainClassName} ${
              hideHeader && shouldShowHeader ? "pt-14" : ""
            }`}
          >
            <div className={contentContainerClassName}>
              {children}
            </div>
          </main>
        </div>
      </div>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={tShell("closeNav")}
            onClick={() => setIsMobileNavOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={tShell("navLabel")}
            className="drawer-enter relative flex h-full w-[296px] max-w-[85vw] flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--background)] px-4 pb-6 pt-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between pl-1">
              <Link href="/dashboard" onClick={() => setIsMobileNavOpen(false)} className="flex min-w-0 items-center">
                <BrandWordmark />
              </Link>
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] cursor-pointer"
                aria-label={tShell("closeNav")}
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>

            <div className="mb-6">{createCta}</div>

            {navList}

            <div className="mt-6 border-t border-[var(--border)]/70 pt-5">
              <WorkspaceSwitcher variant="panel" onNavigate={() => setIsMobileNavOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
