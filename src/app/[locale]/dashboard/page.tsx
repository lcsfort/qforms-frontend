"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { deleteForm, fetchForms } from "@/lib/redux/formsSlice";
import { fetchProfile } from "@/lib/redux/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DashboardShell } from "@/components/DashboardShell";
import type { FormListSort, FormListStatus } from "@/lib/types";

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456ZM16.894 20.567 16.5 21.75l-.394-1.183a2.25 2.25 0 0 0-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 0 0 1.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 0 0 1.423 1.423l1.183.394-1.183.394a2.25 2.25 0 0 0-1.423 1.423Z" />
    </svg>
  );
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tf = useTranslations("forms");
  const format = useFormatter();
  const now = useNow();
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { user, token, hydrated } = useAppSelector((state) => state.auth);
  const {
    forms,
    loading: formsLoading,
    loadingMore,
    hasMore,
    nextCursor,
    totalCount,
  } = useAppSelector((state) => state.forms);
  const [deleteFormId, setDeleteFormId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [sortBy, setSortBy] = useState<FormListSort>("recent");
  const [statusFilter, setStatusFilter] = useState<FormListStatus>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [openToolbarMenu, setOpenToolbarMenu] = useState<"sort" | "filter" | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 12;

  useEffect(() => {
    if (!hydrated) return;
    if (!token) {
      router.push("/signin");
      return;
    }
    if (user && !user.isEmailVerified) {
      router.push("/verify-email-required");
      return;
    }
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [hydrated, token, user, dispatch, router]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim());
    }, 220);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  const queryKey = useMemo(
    () => `${sortBy}|${statusFilter}|${debouncedSearchQuery.toLowerCase()}`,
    [sortBy, statusFilter, debouncedSearchQuery],
  );
  const hasActiveFilters = Boolean(debouncedSearchQuery || statusFilter !== "all");
  const sortOptions: Array<{ value: FormListSort; label: string }> = [
    { value: "recent", label: t("optionRecent") },
    { value: "oldest", label: t("optionOldest") },
    { value: "title", label: t("optionTitle") },
  ];
  const filterOptions: Array<{ value: FormListStatus; label: string }> = [
    { value: "all", label: t("optionAll") },
    { value: "published", label: t("optionPublished") },
    { value: "draft", label: t("optionDraft") },
  ];

  useEffect(() => {
    if (!token || !user?.isEmailVerified) return;
    dispatch(
      fetchForms({
        cursor: 0,
        limit: PAGE_SIZE,
        sort: sortBy,
        status: statusFilter,
        query: debouncedSearchQuery,
        queryKey,
      }),
    );
  }, [token, user?.isEmailVerified, dispatch, sortBy, statusFilter, debouncedSearchQuery, queryKey]);

  const handleDeleteClick = (id: string) => {
    setDeleteFormId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteFormId) {
      dispatch(deleteForm(deleteFormId));
      setDeleteFormId(null);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (event.key === "Escape") {
        setOpenToolbarMenu(null);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!openToolbarMenu) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const insideSort = sortMenuRef.current?.contains(target);
      const insideFilter = filterMenuRef.current?.contains(target);
      if (!insideSort && !insideFilter) {
        setOpenToolbarMenu(null);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openToolbarMenu]);

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = aiPrompt.trim();
    if (trimmed) {
      router.push(`/dashboard/forms/new?prompt=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/dashboard/forms/new");
    }
  };

  useEffect(() => {
    if (!token || !user?.isEmailVerified) return;
    if (!hasMore || loadingMore || formsLoading) return;
    if (nextCursor === null) return;
    const node = loadMoreRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting) return;
        dispatch(
          fetchForms({
            cursor: nextCursor,
            limit: PAGE_SIZE,
            sort: sortBy,
            status: statusFilter,
            query: debouncedSearchQuery,
            append: true,
            queryKey,
          }),
        );
      },
      { rootMargin: "280px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    token,
    user?.isEmailVerified,
    hasMore,
    loadingMore,
    formsLoading,
    nextCursor,
    dispatch,
    sortBy,
    statusFilter,
    debouncedSearchQuery,
    queryKey,
  ]);

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardShell
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      isSearchFocused={isSearchFocused}
      onSearchFocus={() => setIsSearchFocused(true)}
      onSearchBlur={() => setIsSearchFocused(false)}
      searchInputRef={searchInputRef}
    >

            {/* ── Hero area ── */}
            <section className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-5">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)] mb-1">
                    {t("welcome", { name: user.name || "empty" })}
                  </h1>
                  <p className="text-sm text-[var(--muted)]">{t("subtitle")}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href="/dashboard/forms/new"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--foreground)] px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    {tf("newForm")}
                  </Link>
                  <Link
                    href="/dashboard/forms/new"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 px-4 py-2 rounded-lg transition-all duration-150 shadow-sm shadow-[var(--primary)]/20 active:scale-[0.98]"
                  >
                    <SparkleIcon className="w-4 h-4" />
                    {t("createWithAi")}
                  </Link>
                </div>
              </div>

              {/* AI Prompt bar */}
              <form onSubmit={handleAiSubmit}>
                <div className="ai-prompt-glow rounded-xl">
                  <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] pl-4 pr-2 py-2.5">
                    <SparkleIcon className="w-5 h-5 text-[var(--primary)] shrink-0 opacity-70" />
                    <input
                      type="text"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder={t("aiPlaceholder")}
                      className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted)]"
                    />
                    <button
                      type="submit"
                      className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg text-[var(--primary)] hover:bg-[var(--surface)] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                      </svg>
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {!user.isEmailVerified && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 text-yellow-700 dark:text-yellow-400 text-sm">
                {t("emailNotVerified")}
              </div>
            )}

            {/* ── Content area ── */}
            {formsLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-9 h-9 border-[3px] border-[var(--primary)]/15 border-t-[var(--primary)] rounded-full animate-spin" />
              </div>
            ) : forms.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-4">
                  {hasActiveFilters ? (
                    <svg className="w-7 h-7 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                    </svg>
                  ) : (
                    <SparkleIcon className="w-7 h-7 text-[var(--primary)]" />
                  )}
                </div>
                <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1.5">
                  {hasActiveFilters ? t("noSearchResults") : tf("noForms")}
                </h2>
                <p className="text-sm text-[var(--muted)] mb-6 max-w-sm">
                  {hasActiveFilters ? t("noSearchResultsDesc") : tf("noFormsDesc")}
                </p>
                {hasActiveFilters ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="text-sm font-medium text-[var(--foreground)] px-4 py-2 rounded-lg border border-[var(--border)] hover:bg-[var(--surface)] transition-colors"
                  >
                    {t("clearSearch")}
                  </button>
                ) : (
                  <Link
                    href="/dashboard/forms/new"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-white bg-[var(--primary)] hover:opacity-90 px-5 py-2.5 rounded-lg transition-all duration-150 shadow-sm shadow-[var(--primary)]/20 active:scale-[0.98]"
                  >
                    <SparkleIcon className="w-4 h-4" />
                    {t("generateBtn")}
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* ── Toolbar ── */}
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {t("resultsCount", { count: totalCount || forms.length })}
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {searchQuery.trim().length > 0 && (
                      <span className="h-9 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-medium text-[var(--foreground)]">
                        <svg className="h-3.5 w-3.5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                        </svg>
                        <span className="max-w-[140px] truncate">{searchQuery.trim()}</span>
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                          aria-label={t("clearSearch")}
                          title={t("clearSearch")}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    )}
                    {sortBy !== "recent" && (
                      <span className="h-9 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/35 bg-[var(--primary)]/10 px-3 text-xs font-medium text-[var(--primary)]">
                        <svg className="h-3.5 w-3.5 text-[var(--primary)]/80" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12m-12 5.25h8.25m-8.25 5.25h4.5M3.75 6.75h.008v.008H3.75V6.75Zm0 5.25h.008v.008H3.75V12Zm0 5.25h.008v.008H3.75v-.008Z" />
                        </svg>
                        <span>{sortOptions.find((option) => option.value === sortBy)?.label}</span>
                        <button
                          type="button"
                          onClick={() => setSortBy("recent")}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--primary)]/80 transition-colors hover:bg-[var(--primary)]/15 hover:text-[var(--primary)]"
                          aria-label={t("sortRecent")}
                          title={t("sortRecent")}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    )}
                    {statusFilter !== "all" && (
                      <span className="h-9 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/35 bg-[var(--primary)]/10 px-3 text-xs font-medium text-[var(--primary)]">
                        <svg className="h-3.5 w-3.5 text-[var(--primary)]/80" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6.75 12h10.5M10.5 19.5h3" />
                        </svg>
                        <span>{filterOptions.find((option) => option.value === statusFilter)?.label}</span>
                        <button
                          type="button"
                          onClick={() => setStatusFilter("all")}
                          className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--primary)]/80 transition-colors hover:bg-[var(--primary)]/15 hover:text-[var(--primary)]"
                          aria-label={t("filterAll")}
                          title={t("filterAll")}
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    )}
                    <div ref={sortMenuRef} className="relative group">
                      <span
                        className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] shadow-sm transition-opacity ${
                          openToolbarMenu === "sort" ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {t("sortLabel")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenToolbarMenu((prev) => (prev === "sort" ? null : "sort"))}
                        aria-label={t("sortLabel")}
                        className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border bg-[var(--card)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40 ${
                          openToolbarMenu === "sort" ? "border-[var(--primary)]/45" : "border-[var(--border)]"
                        }`}
                      >
                        <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12m-12 5.25h8.25m-8.25 5.25h4.5M3.75 6.75h.008v.008H3.75V6.75Zm0 5.25h.008v.008H3.75V12Zm0 5.25h.008v.008H3.75v-.008Z" />
                        </svg>
                      </button>
                      {openToolbarMenu === "sort" && (
                        <div className="absolute right-0 z-20 mt-2 min-w-[180px] rounded-xl border border-[var(--border)]/90 bg-[var(--card)]/95 p-1.5 shadow-xl backdrop-blur-sm">
                          {sortOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setSortBy(option.value);
                                setOpenToolbarMenu(null);
                              }}
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                sortBy === option.value
                                  ? "bg-[var(--primary)]/18 text-[var(--primary)]"
                                  : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                              }`}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span className="w-3.5 inline-flex justify-center">
                                  {sortBy === option.value ? "✓" : ""}
                                </span>
                                {option.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div ref={filterMenuRef} className="relative group">
                      <span
                        className={`pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] shadow-sm transition-opacity ${
                          openToolbarMenu === "filter" ? "opacity-0" : "opacity-0 group-hover:opacity-100"
                        }`}
                      >
                        {t("filterLabel")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setOpenToolbarMenu((prev) => (prev === "filter" ? null : "filter"))}
                        aria-label={t("filterLabel")}
                        className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border bg-[var(--card)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] ${
                          openToolbarMenu === "filter" || statusFilter !== "all"
                            ? "border-[var(--primary)]/45"
                            : "border-[var(--border)]"
                        }`}
                      >
                        <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6.75 12h10.5M10.5 19.5h3" />
                        </svg>
                      </button>
                      {openToolbarMenu === "filter" && (
                        <div className="absolute right-0 z-20 mt-2 min-w-[180px] rounded-xl border border-[var(--border)]/90 bg-[var(--card)]/95 p-1.5 shadow-xl backdrop-blur-sm">
                          {filterOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => {
                                setStatusFilter(option.value);
                                setOpenToolbarMenu(null);
                              }}
                              className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                                statusFilter === option.value
                                  ? "bg-[var(--primary)]/18 text-[var(--primary)]"
                                  : "text-[var(--foreground)] hover:bg-[var(--surface)]"
                              }`}
                            >
                              <span className="inline-flex items-center gap-2">
                                <span className="w-3.5 inline-flex justify-center">
                                  {statusFilter === option.value ? "✓" : ""}
                                </span>
                                {option.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="relative group">
                      <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
                        {viewMode === "grid" ? t("gridView") : t("listView")}
                      </span>
                      <button
                        type="button"
                        onClick={() => setViewMode((prev) => (prev === "grid" ? "list" : "grid"))}
                        title={viewMode === "grid" ? t("gridView") : t("listView")}
                        aria-label={viewMode === "grid" ? t("gridView") : t("listView")}
                        className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40"
                      >
                        {viewMode === "grid" ? (
                          <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 4.5h6.75v6.75H3.75V4.5Zm9.75 0h6.75v6.75H13.5V4.5Zm-9.75 9.75h6.75V21H3.75v-6.75Zm9.75 0h6.75V21H13.5v-6.75Z" />
                          </svg>
                        ) : (
                          <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75h15m-15 5.25h15m-15 5.25h15" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "flex flex-col gap-3"}>
                  {forms.map((form, index) => (
                    <div
                      key={form.id}
                      className="card-enter group bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 transition-all duration-200 hover:shadow-md hover:border-[var(--primary)]/25"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      {/* Row 1: Title + badge + overflow */}
                      <div className="flex items-center gap-2 mb-2.5">
                        <Link href={`/dashboard/forms/${form.id}`} className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[var(--foreground)] truncate">
                            {form.title}
                          </h3>
                        </Link>
                        <span
                          className={`inline-flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${
                            form.status === "published"
                              ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            form.status === "published"
                              ? "bg-[var(--primary)]"
                              : "bg-emerald-500 dark:bg-emerald-400"
                          }`} />
                          {form.status === "published" ? tf("published") : tf("draft")}
                        </span>
                      </div>

                      {/* Row 2: Metadata */}
                      <div className="flex items-center gap-4 text-[12px] text-[var(--muted)] mb-3">
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5V6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v6.75m-19.5 0v4.5A2.25 2.25 0 0 0 4.5 20.25h15a2.25 2.25 0 0 0 2.25-2.25v-4.5" />
                          </svg>
                          {tf("responses", { count: form._count?.responses ?? 0 })}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                          </svg>
                          {tf("edited")} {format.relativeTime(new Date(form.updatedAt), now)}
                        </span>
                      </div>

                      {/* Row 3: Actions */}
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/forms/${form.id}`}
                          className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                          title={tf("editor.title")}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                          </svg>
                        </Link>
                        <Link
                          href={`/dashboard/forms/${form.id}/responses`}
                          className="p-1.5 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                          title={tf("responsesPage.title")}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(form.id)}
                          className="p-1.5 rounded-md text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title={tf("editor.deleteForm")}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {loadingMore && (
                  <div className="mt-4 rounded-xl border border-[var(--border)]/70 bg-[var(--card)]/70 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 rounded-full border-2 border-[var(--primary)]/20 border-t-[var(--primary)] animate-spin" />
                      <span className="text-sm text-[var(--muted)]">{t("loadingMore")}</span>
                    </div>
                  </div>
                )}
                {!loadingMore && hasMore && <div ref={loadMoreRef} className="h-1 w-full" />}
                {!loadingMore && !hasMore && forms.length > 0 && (
                  <div className="mt-4 text-center text-xs text-[var(--muted)]">{t("endOfList")}</div>
                )}
              </>
            )}
      <ConfirmDialog
        open={deleteFormId !== null}
        onClose={() => setDeleteFormId(null)}
        onConfirm={handleDeleteConfirm}
        title={tf("deleteTitle")}
        message={tf("deleteConfirm")}
        confirmLabel={tf("editor.deleteForm")}
        cancelLabel={tf("cancel")}
        variant="danger"
      />
    </DashboardShell>
  );
}
