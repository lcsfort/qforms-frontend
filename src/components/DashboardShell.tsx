"use client";

import { type ReactNode, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { usePathname, useRouter as useNextRouter } from "next/navigation";
import { Link, useRouter as useIntlRouter } from "@/i18n/navigation";
import { useTheme } from "@/lib/theme";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { logout } from "@/lib/redux/authSlice";
import { AppMenu } from "@/components/AppMenu";
import { getUserAvatarUrl, getUserInitials } from "@/lib/userAvatar";

const flags: Record<string, string> = { en: "🇺🇸", pt: "🇧🇷" };
const langLabels: Record<string, string> = { en: "English", pt: "Português" };

type DashboardShellProps = {
  children: ReactNode;
  contentContainerClassName?: string;
  mainClassName?: string;
  showSearch?: boolean;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
  isSearchFocused?: boolean;
  onSearchFocus?: () => void;
  onSearchBlur?: () => void;
  headerRight?: ReactNode;
};

export function DashboardShell({
  children,
  contentContainerClassName = "max-w-5xl mx-auto",
  mainClassName = "dashboard-main-scroll flex-1 overflow-y-auto px-5 sm:px-8 pt-[88px] pb-16 bg-[var(--background)]/70",
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
  const tMenu = useTranslations("appMenu");
  const { theme, setTheme } = useTheme();
  const dispatch = useAppDispatch();
  const intlRouter = useIntlRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const { user } = useAppSelector((state) => state.auth);

  const [isContentScrolled, setIsContentScrolled] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [localSearchFocused, setLocalSearchFocused] = useState(false);
  const localSearchInputRef = useRef<HTMLInputElement>(null);
  const contentScrollRef = useRef<HTMLDivElement>(null);

  const resolvedQuery = searchQuery ?? localSearchQuery;
  const resolvedFocused = isSearchFocused ?? localSearchFocused;
  const resolvedSearchRef = searchInputRef ?? localSearchInputRef;

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

  const switchLocale = (newLocale: string) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    nextRouter.push(segments.join("/"));
  };

  const handleSignOut = () => {
    dispatch(logout());
    intlRouter.push("/");
  };

  const avatarUrl = user ? getUserAvatarUrl(user) : null;
  const initials = user ? getUserInitials(user) : "";

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <aside className="hidden lg:block w-[288px] shrink-0 h-screen sticky top-0 overflow-hidden border-r border-[var(--border)]/60 bg-[var(--background)] px-3 py-3">
        <div className="h-full rounded-2xl border border-[var(--border)]/70 bg-[var(--card)]/80 backdrop-blur-sm p-3 flex flex-col overflow-hidden">
          <div className="mb-4 rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]/45 px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[var(--border)] bg-[var(--card)] flex items-center justify-center shrink-0">
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={user?.name || user?.email || "User"} fill className="object-cover" unoptimized />
                ) : (
                  <span className="text-sm font-semibold text-[var(--foreground)]">{initials}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold text-[var(--foreground)] truncate" title={user?.name || user?.email || ""}>
                  {user?.name || user?.email || ""}
                </p>
                {user?.name && (
                  <p className="text-[11px] leading-snug text-[var(--muted)] mt-0.5 whitespace-normal break-all" title={user.email}>
                    {user.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <nav className="flex flex-col gap-0.5 mb-auto">
            <Link
              href="/profile"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
            >
              <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
              {tMenu("profile")}
            </Link>
            <button
              type="button"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors text-left cursor-pointer"
            >
              <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
              </svg>
              {tMenu("help")}
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-left cursor-pointer"
            >
              <svg className="w-4 h-4 opacity-60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
              </svg>
              {tMenu("signOut")}
            </button>
          </nav>

          <div className="mt-4 pt-4 border-t border-[var(--border)]/70">
            <div className="rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]/30 px-2 py-2">
              <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider px-1">{tMenu("theme")}</span>
              <div className="flex flex-col gap-0.5 mt-1.5">
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                    theme === "light" ? "text-[var(--foreground)] font-medium bg-[var(--card)]" : "text-[var(--muted)]"
                  }`}
                >
                  {theme === "light" ? (
                    <svg className="w-3.5 h-3.5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--border)]" />
                  )}
                  Light
                </button>
                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                    theme === "dark" ? "text-[var(--foreground)] font-medium bg-[var(--card)]" : "text-[var(--muted)]"
                  }`}
                >
                  {theme === "dark" ? (
                    <svg className="w-3.5 h-3.5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--border)]" />
                  )}
                  Dark
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-[var(--border)]/60 bg-[var(--surface)]/30 px-2 py-2 mt-2">
              <span className="text-[10px] font-semibold text-[var(--muted)] uppercase tracking-wider px-1">{tMenu("language")}</span>
              <div className="flex flex-col gap-0.5 mt-1.5">
                {(["en", "pt"] as const).map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => switchLocale(loc)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-[13px] transition-colors cursor-pointer ${
                      locale === loc ? "text-[var(--foreground)] font-medium bg-[var(--card)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {locale === loc ? (
                      <svg className="w-3.5 h-3.5 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--border)]" />
                    )}
                    <span className="text-sm leading-none">{flags[loc]}</span>
                    {langLabels[loc]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0 p-3">
        <div className="relative h-full rounded-2xl border border-[var(--border)]/70 bg-[var(--card)]/80 backdrop-blur-sm overflow-hidden flex flex-col">
          <header
            className={`absolute top-0 left-0 right-0 z-50 border-b transition-all duration-200 ${
              isContentScrolled ? "header-glass-scrolled shadow-sm" : "header-glass-top"
            }`}
          >
            <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
              <div className="lg:hidden">
                <AppMenu />
              </div>

              <Link href="/dashboard" className="flex items-center min-w-0 shrink-0 px-2.5 py-1 rounded-2xl bg-[var(--surface)]/50 border border-[var(--border)]/60">
                <span className="font-semibold text-[17px] tracking-tight">
                  <span className="text-[var(--primary)]">Q</span>
                  <span className="text-[var(--foreground)]">Forms</span>
                </span>
              </Link>

              {showSearch ? (
                <div className="flex-1 flex justify-center px-4">
                  <div className="relative w-full max-w-2xl">
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
                      className={`w-full h-10 rounded-2xl border border-[var(--border)] bg-[var(--background)] pl-9 text-sm outline-none transition-all duration-200 focus:ring-1 focus:ring-[var(--primary)]/30 focus:border-[var(--primary)]/40 ${
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
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
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

              {headerRight}
            </div>
          </header>

          <main
            ref={contentScrollRef}
            onScroll={handleContentScroll}
            className={mainClassName}
          >
            <div className={contentContainerClassName}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
