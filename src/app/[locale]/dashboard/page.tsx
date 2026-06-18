"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createForm, deleteForm, fetchForms } from "@/lib/redux/formsSlice";
import { blankFormDocument } from "@/lib/forms";
import { fetchDashboardInsights } from "@/lib/redux/dashboardInsightsSlice";
import { fetchProfile } from "@/lib/redux/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { savePreferences, usePreferences } from "@/lib/preferences";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DashboardShell } from "@/components/DashboardShell";
import { SparkleIcon } from "@/components/icons/SparkleIcon";
import { type FormListSort, type FormListStatus } from "@/lib/types";
import { ArrowDownWideNarrow, LayoutGrid, ListFilter, Rows3, Search, X } from "lucide-react";
import { ActivityMenu } from "./_components/ActivityMenu";
import { AttentionAllModal } from "./_components/AttentionAllModal";
import { DashboardHero } from "./_components/DashboardHero";
import { FormCard } from "./_components/FormCard";
import { TemplateShortcuts } from "./_components/TemplateShortcuts";
import { WorkspaceActivityPanel } from "./_components/WorkspaceActivityPanel";

const PAGE_SIZE = 12;
/** How many attention items the rail/bell show inline before "View all". */
const ATTENTION_RAIL_LIMIT = 3;

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tf = useTranslations("forms");
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
    responsesThisMonth,
    bestWorkspaceCompletionRate,
    insightTotalCount,
    activeQueryKey,
  } = useAppSelector((state) => state.forms);
  const {
    attention: attentionItems,
    attentionTotalCount,
    latest: latestResponses,
    loading: insightsLoading,
    activeInsightsQueryKey,
  } = useAppSelector((state) => state.dashboardInsights);
  const activeWorkspaceId = useAppSelector((state) => state.workspace.activeWorkspaceId);

  const [pendingDelete, setPendingDelete] = useState<{ id: string; matchTitle: string } | null>(null);
  const [attentionModalOpen, setAttentionModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<FormListSort>("recent");
  const [statusFilter, setStatusFilter] = useState<FormListStatus>("all");
  const preferences = usePreferences();
  const viewMode = preferences.formsView;
  // Debounced so dragging a threshold in settings doesn't fire a request per keystroke.
  const [debouncedAttention, setDebouncedAttention] = useState(preferences.attention);
  const [openToolbarMenu, setOpenToolbarMenu] = useState<"sort" | "filter" | null>(null);
  const [creatingBlankForm, setCreatingBlankForm] = useState(false);
  const [blankFormError, setBlankFormError] = useState<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const formsSectionRef = useRef<HTMLElement>(null);
  const prevHadFiltersRef = useRef(false);

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

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      // savePreferences() rebuilds `attention` into a fresh object on every write (even unrelated
      // ones like collapsing the sidebar). Only adopt a new reference when the values truly changed,
      // so the insights fetch — and the rail's loading skeleton — don't flicker on each toggle.
      setDebouncedAttention((prev) =>
        JSON.stringify(prev) === JSON.stringify(preferences.attention) ? prev : preferences.attention,
      );
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [preferences.attention]);

  // activeWorkspaceId is part of the key so switching workspaces in the top bar refetches the list.
  const queryKey = useMemo(
    () => `${activeWorkspaceId ?? ""}|${sortBy}|${statusFilter}|${debouncedSearchQuery.toLowerCase()}`,
    [activeWorkspaceId, sortBy, statusFilter, debouncedSearchQuery],
  );

  // Needs-attention / latest-responses come from the backend (all forms), keyed by
  // workspace + settled thresholds so it refetches on either change and drops stale responses.
  const insightsParams = useMemo(
    () => ({ ...debouncedAttention, attentionLimit: ATTENTION_RAIL_LIMIT }),
    [debouncedAttention],
  );
  const insightsQueryKey = useMemo(
    () => `${activeWorkspaceId ?? ""}|${JSON.stringify(debouncedAttention)}`,
    [activeWorkspaceId, debouncedAttention],
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

  useEffect(() => {
    if (!token || !user?.isEmailVerified) return;
    dispatch(fetchDashboardInsights({ params: insightsParams, queryKey: insightsQueryKey }));
  }, [token, user?.isEmailVerified, dispatch, insightsParams, insightsQueryKey]);

  // Searching from the top bar should reveal the results without manual scrolling.
  useEffect(() => {
    if (hasActiveFilters && !prevHadFiltersRef.current) {
      formsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    prevHadFiltersRef.current = hasActiveFilters;
  }, [hasActiveFilters]);

  const handleDeleteClick = useCallback(
    (id: string, rawTitle: string) => {
      const matchTitle = rawTitle.trim() || tf("blankFormTitle");
      setPendingDelete({ id, matchTitle });
    },
    [tf],
  );

  const handleDeleteConfirm = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setPendingDelete(null);
    await dispatch(deleteForm(id));
    // Deleting a form changes what needs attention — recompute from the backend.
    if (token && user?.isEmailVerified) {
      dispatch(fetchDashboardInsights({ params: insightsParams, queryKey: insightsQueryKey }));
    }
  };

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
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenToolbarMenu(null);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [openToolbarMenu]);

  const createBlankFormAndOpenEditor = useCallback(async () => {
    if (!token || creatingBlankForm) return;
    setBlankFormError(null);
    setCreatingBlankForm(true);
    try {
      const form = await dispatch(
        createForm({
          title: tf("blankFormTitle"),
          schema: blankFormDocument(tf("blankFormTitle")) as unknown as Record<
            string,
            unknown
          >,
          settings: {},
        }),
      ).unwrap();
      router.push(`/dashboard/forms/${form.id}`);
    } catch (err: unknown) {
      const e = err as string | { message?: string };
      setBlankFormError(typeof e === "string" ? e : e?.message ?? tf("blankFormError"));
    } finally {
      setCreatingBlankForm(false);
    }
  }, [token, creatingBlankForm, dispatch, router, tf]);

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

  // Distinguish "never fetched" (activeQueryKey null) from "loaded empty" to avoid an empty-state flash.
  const showFormsLoading = formsLoading || activeQueryKey === null;
  // Same "never fetched vs. loaded empty" distinction for the attention/latest rails.
  const showInsightsLoading = insightsLoading || activeInsightsQueryKey === null;

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardShell
      showSearch
      headerRight={
        <ActivityMenu
          attention={attentionItems}
          attentionTotalCount={attentionTotalCount}
          latest={latestResponses}
          loading={showInsightsLoading}
          onViewAll={() => setAttentionModalOpen(true)}
        />
      }
      contentContainerClassName="w-full"
      mainClassName="dashboard-main-scroll flex-1 overflow-y-auto px-5 sm:px-8 lg:px-10 pt-[88px] pb-16 bg-transparent"
    >
      {!user.isEmailVerified && (
        <div className="mb-6 px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 text-yellow-700 dark:text-yellow-400 text-sm">
          {t("emailNotVerified")}
        </div>
      )}

      <div className="flex flex-col gap-10 xl:flex-row xl:gap-8">
        {/* ── Main column ── */}
        <div className="flex min-w-0 flex-1 flex-col gap-12">
          <DashboardHero
            name={user.name}
            creatingBlank={creatingBlankForm}
            blankError={blankFormError}
            onStartBlank={() => void createBlankFormAndOpenEditor()}
          />

          {/* ── Recent forms ── */}
          <section ref={formsSectionRef} aria-labelledby="recent-forms-title" className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-baseline gap-2.5">
                <h2 id="recent-forms-title" className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">
                  {t("recentFormsTitle")}
                </h2>
                {!showFormsLoading && (
                  <span className="text-[12.5px] text-[var(--muted)]">
                    {t("resultsCount", { count: totalCount || forms.length })}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted)]"
                    strokeWidth={2}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    aria-label={t("searchPlaceholder")}
                    className={`h-9 w-[160px] rounded-lg border bg-[var(--card)] pl-8 text-[13px] text-[var(--foreground)] outline-none transition-colors duration-150 placeholder:text-[var(--muted)] focus:border-[var(--primary)]/45 focus:ring-1 focus:ring-[var(--primary)]/25 sm:w-[220px] ${
                      searchQuery ? "border-[var(--primary)]/40 pr-8" : "border-[var(--border)] pr-3"
                    }`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)]"
                      aria-label={t("clearSearch")}
                      title={t("clearSearch")}
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  )}
                </div>
                {sortBy !== "recent" && (
                  <span className="h-9 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/35 bg-[var(--primary)]/10 px-3 text-xs font-medium text-[var(--primary)]">
                    <ArrowDownWideNarrow className="h-3.5 w-3.5 text-[var(--primary)]/80" strokeWidth={1.8} />
                    <span>{sortOptions.find((option) => option.value === sortBy)?.label}</span>
                    <button
                      type="button"
                      onClick={() => setSortBy("recent")}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--primary)]/80 transition-colors hover:bg-[var(--primary)]/15 hover:text-[var(--primary)]"
                      aria-label={t("sortRecent")}
                      title={t("sortRecent")}
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </span>
                )}
                {statusFilter !== "all" && (
                  <span className="h-9 inline-flex items-center gap-2 rounded-full border border-[var(--primary)]/35 bg-[var(--primary)]/10 px-3 text-xs font-medium text-[var(--primary)]">
                    <ListFilter className="h-3.5 w-3.5 text-[var(--primary)]/80" strokeWidth={1.8} />
                    <span>{filterOptions.find((option) => option.value === statusFilter)?.label}</span>
                    <button
                      type="button"
                      onClick={() => setStatusFilter("all")}
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[var(--primary)]/80 transition-colors hover:bg-[var(--primary)]/15 hover:text-[var(--primary)]"
                      aria-label={t("filterAll")}
                      title={t("filterAll")}
                    >
                      <X className="h-3 w-3" strokeWidth={2} />
                    </button>
                  </span>
                )}
                <div ref={sortMenuRef} className="relative group">
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] shadow-sm transition-opacity ${
                      openToolbarMenu === "sort" ? "opacity-0" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                    }`}
                  >
                    {t("sortLabel")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenToolbarMenu((prev) => (prev === "sort" ? null : "sort"))}
                    aria-label={t("sortLabel")}
                    aria-expanded={openToolbarMenu === "sort"}
                    className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border bg-[var(--card)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40 ${
                      openToolbarMenu === "sort" ? "border-[var(--primary)]/45" : "border-[var(--border)]"
                    }`}
                  >
                    <ArrowDownWideNarrow className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
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
                    aria-hidden="true"
                    className={`pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] shadow-sm transition-opacity ${
                      openToolbarMenu === "filter" ? "opacity-0" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
                    }`}
                  >
                    {t("filterLabel")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenToolbarMenu((prev) => (prev === "filter" ? null : "filter"))}
                    aria-label={t("filterLabel")}
                    aria-expanded={openToolbarMenu === "filter"}
                    className={`h-9 w-9 inline-flex items-center justify-center rounded-lg border bg-[var(--card)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] ${
                      openToolbarMenu === "filter" || statusFilter !== "all"
                        ? "border-[var(--primary)]/45"
                        : "border-[var(--border)]"
                    }`}
                  >
                    <ListFilter className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
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
                  <span aria-hidden="true" className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    {viewMode === "grid" ? t("gridView") : t("listView")}
                  </span>
                  <button
                    type="button"
                    onClick={() => savePreferences({ formsView: viewMode === "grid" ? "list" : "grid" })}
                    aria-label={viewMode === "grid" ? t("gridView") : t("listView")}
                    className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/40"
                  >
                    {viewMode === "grid" ? (
                      <LayoutGrid className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
                    ) : (
                      <Rows3 className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.8} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {showFormsLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-9 h-9 border-[3px] border-[var(--primary)]/15 border-t-[var(--primary)] rounded-full animate-spin" />
              </div>
            ) : forms.length === 0 ? (
              hasActiveFilters ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-[var(--border)]/80 bg-[var(--card)]/60 px-6 py-14 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface)]">
                    <Search className="h-6 w-6 text-[var(--muted)]" strokeWidth={1.5} />
                  </div>
                  <h3 className="mb-1.5 text-lg font-semibold text-[var(--foreground)]">{t("noSearchResults")}</h3>
                  <p className="mb-6 max-w-sm text-sm text-[var(--muted)]">{t("noSearchResultsDesc")}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setStatusFilter("all");
                    }}
                    className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
                  >
                    {t("clearFilters")}
                  </button>
                </div>
              ) : (
                <div className="premium-card flex flex-col items-center px-6 py-14 text-center">
                  <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)]/70 bg-[var(--surface)]/60">
                    <SparkleIcon className="h-7 w-7 text-[var(--primary)]" />
                  </span>
                  <h3 className="mb-1.5 text-lg font-semibold text-[var(--foreground)]">{t("emptyTitle")}</h3>
                  <p className="mb-6 max-w-sm text-sm text-[var(--muted)]">{t("emptyDesc")}</p>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href="/dashboard/forms/new"
                      className="cta-gradient inline-flex h-10 items-center justify-center gap-2 rounded-xl px-5 text-[13.5px] font-semibold text-white"
                    >
                      <SparkleIcon className="h-4 w-4" />
                      {t("generateBtn")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void createBlankFormAndOpenEditor()}
                      disabled={creatingBlankForm}
                      className="inline-flex h-10 items-center justify-center rounded-xl border border-[var(--border)] px-5 text-[13.5px] font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)] disabled:opacity-60"
                    >
                      {t("quickStartScratch")}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <>
                <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3" : "flex flex-col gap-3"}>
                  {forms.map((form, index) => (
                    // Stagger within each fetched page, not the whole list — late pages must not wait out a long delay.
                    <FormCard
                      key={form.id}
                      form={form}
                      index={index % PAGE_SIZE}
                      onDelete={handleDeleteClick}
                      variant={viewMode === "grid" ? "grid" : "row"}
                    />
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
          </section>

          <TemplateShortcuts />
        </div>

        {/* ── Right rail ── */}
        <aside className="w-full xl:w-[320px] xl:shrink-0">
          {/* top offset clears the 56px overlaid header plus breathing room */}
          <div className="xl:sticky xl:top-[76px]">
            <WorkspaceActivityPanel
              totalCount={insightTotalCount}
              responsesThisMonth={responsesThisMonth}
              bestCompletionRate={bestWorkspaceCompletionRate}
              attention={attentionItems}
              attentionTotalCount={attentionTotalCount}
              latest={latestResponses}
              loading={showInsightsLoading}
              onViewAll={() => setAttentionModalOpen(true)}
            />
          </div>
        </aside>
      </div>

      <AttentionAllModal
        open={attentionModalOpen}
        onClose={() => setAttentionModalOpen(false)}
        params={insightsParams}
        totalCount={attentionTotalCount}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={tf("deleteTitle")}
        message={tf("deleteConfirm")}
        confirmLabel={tf("editor.deleteForm")}
        cancelLabel={tf("cancel")}
        variant="danger"
        confirmMatchText={pendingDelete?.matchTitle}
        confirmMatchInstruction={tf("deleteTypeInstruction")}
        confirmMatchInputLabel={tf("deleteTypeInputLabel")}
      />
    </DashboardShell>
  );
}
