"use client";

import {
  type ComponentType,
  type ReactNode,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { fetchWorkspaces, hydrateWorkspace } from "@/lib/redux/workspaceSlice";
import { setSelectedBuildMode } from "@/lib/redux/formsSlice";
import { getPreferences, hydratePreferencesFromServer, savePreferences, usePreferences } from "@/lib/preferences";
import { AppMenu } from "@/components/AppMenu";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { CommandPalette } from "@/components/CommandPalette";
import {
  House,
  LayoutTemplate,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";

type DashboardShellProps = {
  children: ReactNode;
  contentContainerClassName?: string;
  mainClassName?: string;
  hideHeader?: boolean;
  /** Show the ⌘K command-palette trigger in the header (and enable the shortcut). */
  showSearch?: boolean;
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

/* Platform detection for the ⌘ / Ctrl shortcut hint. Read via useSyncExternalStore
   so the value is client-correct without an effect or a hydration mismatch. */
const subscribeNoop = () => () => {};
function getIsMac(): boolean {
  const platform =
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
    navigator.platform ??
    "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}
const getIsMacServer = () => true;

function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center rounded-2xl border border-[var(--border)] bg-[var(--background)] dark:bg-[var(--card)] px-2.5 py-1">
      <span className="inline-flex items-baseline font-semibold text-[17px] tracking-tight">
        <span className="text-[var(--primary)]">Q</span>
        <span className="text-[var(--foreground)]">F</span>
        {/* "orms" collapses its own width (grid 1fr→0fr) + fades, in lockstep with the sidebar width. */}
        <span
          className={`grid text-[var(--foreground)] transition-[grid-template-columns,opacity] duration-[360ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
            compact ? "grid-cols-[0fr] opacity-0" : "grid-cols-[1fr] opacity-100"
          }`}
        >
          <span className="min-w-0 overflow-hidden">orms</span>
        </span>
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
  headerRight,
}: DashboardShellProps) {
  const tShell = useTranslations("shell");
  const tPalette = useTranslations("commandPalette");
  const tWorkspace = useTranslations("workspace");
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const { token, hydrated } = useAppSelector((state) => state.auth);
  const { items: workspaces, activeWorkspaceId } = useAppSelector((state) => state.workspace);

  const [isContentScrolled, setIsContentScrolled] = useState(false);
  // Persisted (localStorage + account sync) so the collapsed rail survives a refresh.
  const isSidebarCollapsed = usePreferences().sidebarCollapsed;
  // Sidebar clips content while animating width; once settled it goes overflow-visible so rail tooltips can escape.
  const [isSidebarAnimating, setIsSidebarAnimating] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const isMac = useSyncExternalStore(subscribeNoop, getIsMac, getIsMacServer);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const mobileNavTriggerRef = useRef<HTMLButtonElement>(null);
  const drawerCloseRef = useRef<HTMLButtonElement>(null);
  const drawerWasOpenRef = useRef(false);

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

  // ⌘K / Ctrl+K toggles the command palette from anywhere in the shell.
  useEffect(() => {
    if (!showSearch) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [showSearch]);

  const handleContentScroll = () => {
    const scrollTop = contentScrollRef.current?.scrollTop ?? 0;
    const nextScrolled = scrollTop > 8;
    setIsContentScrolled((prev) => (prev === nextScrolled ? prev : nextScrolled));
  };

  const toggleSidebar = (collapsed: boolean) => {
    setIsSidebarAnimating(true);
    savePreferences({ sidebarCollapsed: collapsed });
  };

  // Hover label shown beside an icon in the collapsed rail.
  const railTip = (label: string) => (
    <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] font-medium text-[var(--foreground)] opacity-0 shadow-md transition-opacity duration-100 group-hover:opacity-100">
      {label}
    </span>
  );

  const shouldShowHeader = !hideHeader || isSidebarCollapsed;

  const renderCreateCta = (collapsed: boolean) => (
    <Link
      href="/dashboard/forms/new"
      onClick={() => setIsMobileNavOpen(false)}
      aria-label={collapsed ? tShell("createForm") : undefined}
      className={`cta-gradient inline-flex h-10 items-center justify-center gap-2 rounded-xl text-[13.5px] font-semibold text-white whitespace-nowrap ${
        collapsed ? "group relative w-10 px-0" : "w-full px-4"
      }`}
    >
      <Plus className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      {!collapsed && tShell("createForm")}
      {collapsed && railTip(tShell("createForm"))}
    </Link>
  );

  const renderNavList = (collapsed: boolean) => (
    <nav
      aria-label={tShell("navLabel")}
      className={`flex flex-col gap-1 ${collapsed ? "items-center" : ""}`}
    >
      {NAV_ENTRIES.map((entry) => {
        const Icon = entry.icon;
        const active = entry.isActive(pathWithoutLocale);
        return (
          <Link
            key={entry.key}
            href={entry.href}
            onClick={() => setIsMobileNavOpen(false)}
            aria-current={active ? "page" : undefined}
            aria-label={collapsed ? tShell(entry.key) : undefined}
            className={`flex items-center rounded-lg border text-[13px] transition-colors duration-150 whitespace-nowrap ${
              collapsed ? "group relative h-10 w-10 justify-center" : "gap-2.5 px-3 py-2"
            } ${
              active
                ? collapsed
                  ? "border-[var(--primary)]/25 bg-[var(--primary)]/12 text-[var(--primary)]"
                  : "border-transparent bg-[var(--card)] font-medium text-[var(--foreground)] shadow-sm"
                : "border-transparent text-[var(--muted)] hover:bg-[var(--card)]/70 hover:text-[var(--foreground)]"
            }`}
          >
            <Icon
              className={`h-4 w-4 shrink-0 ${active ? "text-[var(--primary)]" : ""}`}
              strokeWidth={1.8}
            />
            {!collapsed && tShell(entry.key)}
            {collapsed && railTip(tShell(entry.key))}
          </Link>
        );
      })}
    </nav>
  );

  const workspaceCard = activeWorkspace ? (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)]/70 px-3 py-3">
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
    <div className="flex h-screen overflow-hidden bg-[var(--surface)] dark:bg-[var(--background)]">
      <aside
        onTransitionEnd={(e) => {
          if (e.propertyName === "width") setIsSidebarAnimating(false);
        }}
        className={`hidden lg:block shrink-0 h-screen sticky top-0 z-30 bg-[var(--surface)] dark:bg-[var(--background)] ${
          isSidebarAnimating ? "overflow-hidden" : "overflow-visible"
        } ${isSidebarCollapsed ? "w-[76px]" : "w-[264px]"}`}
        style={{
          transitionProperty: "width",
          transitionDuration: "360ms",
          transitionTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
          willChange: "width",
        }}
      >
        <div
          className={`flex h-full w-full flex-col pb-4 pt-5 ${
            isSidebarCollapsed ? "items-center px-2.5" : "px-4"
          }`}
        >
          <div className={`mb-5 flex items-center ${isSidebarCollapsed ? "justify-center" : "justify-between pl-1"}`}>
            <Link
              href="/dashboard"
              className="flex min-w-0 items-center"
              aria-label={isSidebarCollapsed ? "QForms" : undefined}
              title={isSidebarCollapsed ? "QForms" : undefined}
            >
              <BrandWordmark compact={isSidebarCollapsed} />
            </Link>
            {!isSidebarCollapsed && (
              <button
                type="button"
                onClick={() => toggleSidebar(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--card)]/70 hover:text-[var(--foreground)] cursor-pointer"
                aria-label={tShell("collapseSidebar")}
              >
                <PanelLeftClose className="h-4 w-4" strokeWidth={1.8} />
              </button>
            )}
          </div>

          <div className="mb-6">{renderCreateCta(isSidebarCollapsed)}</div>

          {renderNavList(isSidebarCollapsed)}

          {!isSidebarCollapsed && (
            <div className="mt-auto flex flex-col gap-2 pt-6">{workspaceCard}</div>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0 p-3 lg:pl-1.5">
        <div className="relative h-full rounded-2xl border border-[var(--border)] bg-[var(--background)] overflow-hidden flex flex-col shadow-[0_1px_3px_rgba(35,32,27,0.04),0_10px_30px_-22px_rgba(35,32,27,0.16)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.3),0_12px_32px_-22px_rgba(0,0,0,0.5)]">
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
                    onClick={() => toggleSidebar(false)}
                    className="hidden lg:inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border)]/70 text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] cursor-pointer"
                    aria-label={tShell("expandSidebar")}
                    title={tShell("expandSidebar")}
                  >
                    <PanelLeftOpen className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                )}

                {/* On the narrowest screens the search field needs the room more than the wordmark does */}
                <Link
                  href="/dashboard"
                  className={`${
                    showSearch ? "hidden sm:flex lg:hidden" : "flex lg:hidden"
                  } min-w-0 shrink-0 items-center`}
                >
                  <BrandWordmark />
                </Link>

                {showSearch ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsPaletteOpen(true)}
                      aria-label={tPalette("open")}
                      aria-haspopup="dialog"
                      className="group flex h-9 min-w-0 max-w-[360px] flex-1 items-center gap-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)]/70 pl-3 pr-2 text-left transition-colors duration-150 hover:border-[var(--primary)]/35 hover:bg-[var(--card)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/25 cursor-pointer"
                    >
                      <Search
                        className="h-4 w-4 shrink-0 text-[var(--muted)] transition-colors group-hover:text-[var(--foreground)]"
                        strokeWidth={2}
                      />
                      <span className="min-w-0 flex-1 truncate text-[13.5px] text-[var(--muted)]">
                        {tPalette("placeholder")}
                      </span>
                      <span className="hidden shrink-0 items-center gap-0.5 sm:flex" aria-hidden suppressHydrationWarning>
                        <kbd className="rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 font-mono text-[10px] leading-none text-[var(--muted)]">
                          {isMac ? "⌘" : "Ctrl"}
                        </kbd>
                        <kbd className="rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 font-mono text-[10px] leading-none text-[var(--muted)]">
                          K
                        </kbd>
                      </span>
                    </button>
                    <div className="flex-1" />
                  </>
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
            className="drawer-enter relative flex h-full w-[296px] max-w-[85vw] flex-col overflow-y-auto border-r border-[var(--border)] bg-[var(--surface)] dark:bg-[var(--background)] px-4 pb-6 pt-5 shadow-2xl"
          >
            <div className="mb-5 flex items-center justify-between pl-1">
              <Link href="/dashboard" onClick={() => setIsMobileNavOpen(false)} className="flex min-w-0 items-center">
                <BrandWordmark />
              </Link>
              <button
                ref={drawerCloseRef}
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--card)]/70 hover:text-[var(--foreground)] cursor-pointer"
                aria-label={tShell("closeNav")}
              >
                <X className="h-4 w-4" strokeWidth={1.8} />
              </button>
            </div>

            <div className="mb-6">{renderCreateCta(false)}</div>

            {renderNavList(false)}

            <div className="mt-6 border-t border-[var(--border)]/70 pt-5">
              <WorkspaceSwitcher variant="panel" onNavigate={() => setIsMobileNavOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {showSearch && (
        <CommandPalette open={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
      )}
    </div>
  );
}
