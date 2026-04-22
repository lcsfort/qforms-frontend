"use client";

import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createForm, deleteForm, fetchForms } from "@/lib/redux/formsSlice";
import { fetchProfile } from "@/lib/redux/authSlice";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DashboardShell } from "@/components/DashboardShell";
import { defaultFormListStats, type FormListSort, type FormListStatus } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUpDown,
  BarChart3,
  CircleDashed,
  Command,
  CornerDownLeft,
  Eye,
  FileText,
  Plus,
  Sparkles,
  Upload,
  Workflow,
} from "lucide-react";

type CommandItem = {
  id: string;
  title: string;
  description: string;
  section: "actions" | "recent" | "ai";
  icon: ComponentType<{ className?: string }>;
  badge?: string;
  onSelect: () => void;
};

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
  const tResume = useTranslations("forms.generate.resume");
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
    responsesThisMonth,
    bestWorkspaceCompletionRate,
  } = useAppSelector((state) => state.forms);
  const [pendingDelete, setPendingDelete] = useState<{
    id: string;
    matchTitle: string;
  } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [commandOpen, setCommandOpen] = useState(false);
  const [commandActiveIndex, setCommandActiveIndex] = useState(0);
  const [commandNavigated, setCommandNavigated] = useState(false);
  const [sortBy, setSortBy] = useState<FormListSort>("recent");
  const [statusFilter, setStatusFilter] = useState<FormListStatus>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [openToolbarMenu, setOpenToolbarMenu] = useState<"sort" | "filter" | null>(null);
  const [creatingBlankForm, setCreatingBlankForm] = useState(false);
  const [blankFormError, setBlankFormError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const commandInputRef = useRef<HTMLInputElement>(null);
  const commandPanelRef = useRef<HTMLDivElement>(null);
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

  const handleDeleteClick = (id: string, rawTitle: string) => {
    const matchTitle = rawTitle.trim() || tf("blankFormTitle");
    setPendingDelete({ id, matchTitle });
  };

  const handleDeleteConfirm = () => {
    if (pendingDelete) {
      dispatch(deleteForm(pendingDelete.id));
      setPendingDelete(null);
    }
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        commandInputRef.current?.focus();
        setCommandOpen(true);
        return;
      }
      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey
      ) {
        const target = event.target as HTMLElement | null;
        const typingInField =
          target instanceof HTMLInputElement ||
          target instanceof HTMLTextAreaElement ||
          target?.isContentEditable;
        if (!typingInField) {
          event.preventDefault();
          commandInputRef.current?.focus();
          setCommandOpen(true);
        }
        return;
      }
      if (event.key === "Escape") {
        setOpenToolbarMenu(null);
        setCommandOpen(false);
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

  useEffect(() => {
    if (!commandOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!commandPanelRef.current?.contains(target)) {
        setCommandOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [commandOpen]);

  const executeCommandQuery = (rawValue: string) => {
    const trimmed = rawValue.trim();
    if (!trimmed) {
      router.push("/dashboard/forms/new");
      return;
    }

    const normalized = trimmed.toLowerCase();
    if (normalized.startsWith("/")) {
      if (normalized.includes("create") || normalized.includes("new")) {
        router.push("/dashboard/forms/new");
        return;
      }
      if (normalized.includes("analytics") && forms[0]?.id) {
        router.push(`/dashboard/forms/${forms[0].id}/responses`);
        return;
      }
      if (normalized.includes("import")) {
        router.push("/dashboard/forms/new");
        return;
      }
      setSearchQuery(trimmed.slice(1));
      return;
    }

    if (
      normalized.includes("generate") ||
      normalized.includes("create") ||
      normalized.includes("ai")
    ) {
      router.push(`/dashboard/forms/new?prompt=${encodeURIComponent(trimmed)}`);
      return;
    }

    setSearchQuery(trimmed);
  };

  const suggestionChips = useMemo(
    () => [
      t("chipEventRsvp"),
      t("chipLeadCapture"),
      t("chipHiringForm"),
      t("chipClientOnboarding"),
      t("chipResearchSurvey"),
    ],
    [t],
  );

  const quickActions = useMemo<CommandItem[]>(
    () => [
      {
        id: "create-form",
        title: t("actionCreateForm"),
        description: t("actionCreateFormDesc"),
        section: "actions",
        icon: Plus,
        onSelect: () => router.push("/dashboard/forms/new"),
      },
      {
        id: "generate-ai",
        title: t("actionGenerateAi"),
        description: t("actionGenerateAiDesc"),
        section: "actions",
        icon: Sparkles,
        onSelect: () => {
          if (aiPrompt.trim()) {
            router.push(`/dashboard/forms/new?prompt=${encodeURIComponent(aiPrompt.trim())}`);
            return;
          }
          router.push("/dashboard/forms/new");
        },
      },
      {
        id: "import-responses",
        title: t("actionImportResponses"),
        description: t("actionImportResponsesDesc"),
        section: "actions",
        icon: Upload,
        onSelect: () => router.push("/dashboard/forms/new"),
      },
      {
        id: "create-workflow",
        title: t("actionCreateWorkflow"),
        description: t("actionCreateWorkflowDesc"),
        section: "actions",
        icon: Workflow,
        onSelect: () => setSearchQuery("workflow"),
      },
      {
        id: "open-analytics",
        title: t("actionOpenAnalytics"),
        description: t("actionOpenAnalyticsDesc"),
        section: "actions",
        icon: BarChart3,
        onSelect: () => {
          if (forms[0]?.id) {
            router.push(`/dashboard/forms/${forms[0].id}/responses`);
          }
        },
      },
    ],
    [aiPrompt, forms, router, t],
  );

  const recentFormCommands = useMemo<CommandItem[]>(
    () =>
      forms.slice(0, 4).map((form) => ({
        id: `recent-${form.id}`,
        title: form.title,
        description: `${tf(form.status === "published" ? "published" : "draft")} · ${tf("edited")} ${format.relativeTime(new Date(form.updatedAt), now)}`,
        section: "recent" as const,
        icon: FileText,
        badge: form.status === "published" ? tf("published") : tf("draft"),
        onSelect: () => router.push(`/dashboard/forms/${form.id}`),
      })),
    [forms, format, now, router, tf],
  );

  const aiSuggestions = useMemo<CommandItem[]>(
    () =>
      [
        t("aiSuggestionWorkflow"),
        t("aiSuggestionIntake"),
        t("aiSuggestionCompletion"),
      ].map((value, index) => ({
        id: `ai-${index}`,
        title: value,
        description: t("aiSuggestionDesc"),
        section: "ai" as const,
        icon: Sparkles,
        onSelect: () => {
          setAiPrompt(value);
          commandInputRef.current?.focus();
        },
      })),
    [t],
  );

  const commandItems = useMemo(() => {
    const raw = aiPrompt.trim();
    const query = raw.toLowerCase();
    const allItems = [...quickActions, ...recentFormCommands, ...aiSuggestions];
    if (!query) return allItems;

    // Preset chips are starters for the prompt, not a search over command titles.
    // Without this, labels like "Lead Capture" filter everything out (no item contains that text).
    const matchesPresetChip = suggestionChips.some(
      (chip) => chip.trim().toLowerCase() === query,
    );
    if (matchesPresetChip) return allItems;

    return allItems.filter(
      (item) =>
        item.title.toLowerCase().includes(query) || item.description.toLowerCase().includes(query),
    );
  }, [aiPrompt, quickActions, recentFormCommands, aiSuggestions, suggestionChips]);

  useEffect(() => {
    if (!commandItems.length) {
      setCommandActiveIndex(0);
      return;
    }
    setCommandActiveIndex((prev) => Math.min(prev, commandItems.length - 1));
  }, [commandItems]);

  useEffect(() => {
    if (!commandOpen) {
      setCommandNavigated(false);
    }
  }, [commandOpen]);

  const handleAiSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeCommandQuery(aiPrompt);
    setCommandOpen(false);
  };

  const handleNewBlankForm = async () => {
    if (!token || creatingBlankForm) return;
    setBlankFormError(null);
    setCreatingBlankForm(true);
    try {
      const form = await dispatch(
        createForm({
          title: tf("blankFormTitle"),
          schema: [],
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
            <section className="hero-aurora mb-10 pt-2">
              <div className="pointer-events-none absolute inset-x-[-8%] top-[-64px] z-0 h-[260px] overflow-hidden">
                <motion.div
                  className="aurora-orb aurora-orb--primary"
                  animate={{ x: [0, 26, -12, 0], y: [0, 8, -6, 0], opacity: [0.42, 0.58, 0.48, 0.42] }}
                  transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="aurora-orb aurora-orb--secondary"
                  animate={{ x: [0, -20, 12, 0], y: [0, -8, 6, 0], opacity: [0.32, 0.44, 0.36, 0.32] }}
                  transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                  className="aurora-orb aurora-orb--accent"
                  animate={{ x: [0, 18, -10, 0], y: [0, 6, -5, 0], opacity: [0.24, 0.36, 0.28, 0.24] }}
                  transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                <div className="min-w-0">
                  <h1 className="text-[28px] sm:text-[30px] leading-[1.15] font-semibold tracking-tight text-[var(--foreground)] mb-1.5">
                    {t("welcome", { name: user.name || "empty" })}
                  </h1>
                  <p className="text-[14px] text-[var(--muted)]">{t("subtitle")}</p>
                </div>
                <div className="flex w-full flex-col items-stretch gap-1.5 sm:w-auto sm:items-end shrink-0">
                  {/* Primary first on mobile (column); secondary stays visually subordinate everywhere */}
                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2.5">
                    <Link
                      href="/dashboard/forms/new"
                      className="cta-gradient order-1 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-semibold text-white sm:order-2 sm:w-auto sm:px-5"
                    >
                      <SparkleIcon className="h-[18px] w-[18px] shrink-0" />
                      {t("createWithAi")}
                    </Link>
                    <button
                      type="button"
                      onClick={() => void handleNewBlankForm()}
                      disabled={creatingBlankForm}
                      className="order-2 inline-flex min-h-[40px] w-full items-center justify-center gap-1.5 rounded-xl border border-transparent bg-transparent px-3 py-2 text-[13px] font-normal text-[var(--muted)] transition-all duration-150 hover:border-[var(--border)]/80 hover:bg-[var(--surface)]/50 hover:text-[var(--foreground)] disabled:cursor-not-allowed disabled:opacity-50 sm:order-1 sm:w-auto sm:justify-center"
                    >
                      {creatingBlankForm ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                        </svg>
                      )}
                      {tf("newForm")}
                    </button>
                  </div>
                  {blankFormError && (
                    <p className="text-xs text-red-600 dark:text-red-400 max-w-[280px] text-right">{blankFormError}</p>
                  )}
                </div>
              </div>

              {/* AI Command Center */}
              <div ref={commandPanelRef} className="relative">
                <AnimatePresence>
                  {commandOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className="pointer-events-none absolute inset-0 z-10 rounded-[20px] bg-[var(--background)]/15 backdrop-blur-[2px]"
                    />
                  )}
                </AnimatePresence>

                <div className="relative z-20">
                  <form onSubmit={handleAiSubmit} className="min-w-0">
                    <motion.div
                      layout
                      transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
                      className={`command-center ${
                        commandOpen ? "command-center--open" : ""
                      }`}
                    >
                      <div className="command-center-row">
                        <motion.div
                          animate={commandOpen ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                          className="shrink-0"
                        >
                          <SparkleIcon className="h-5 w-5 text-[var(--primary)]" />
                        </motion.div>
                        <input
                          ref={commandInputRef}
                          type="text"
                          value={aiPrompt}
                          onFocus={() => setCommandOpen(true)}
                          onChange={(e) => {
                            setAiPrompt(e.target.value);
                            setCommandNavigated(false);
                          }}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") {
                              setCommandOpen(false);
                              return;
                            }
                            if (!commandItems.length) return;
                            if (event.key === "ArrowDown") {
                              event.preventDefault();
                              setCommandOpen(true);
                              setCommandNavigated(true);
                              setCommandActiveIndex((prev) => (prev + 1) % commandItems.length);
                            } else if (event.key === "ArrowUp") {
                              event.preventDefault();
                              setCommandOpen(true);
                              setCommandNavigated(true);
                              setCommandActiveIndex(
                                (prev) => (prev - 1 + commandItems.length) % commandItems.length,
                              );
                            } else if (event.key === "Enter" && commandOpen && commandNavigated) {
                              event.preventDefault();
                              const selected = commandItems[commandActiveIndex];
                              if (!selected) return;
                              selected.onSelect();
                              setCommandOpen(false);
                            }
                          }}
                          placeholder={t("commandPlaceholder")}
                          className="min-w-0 flex-1 bg-transparent py-1.5 text-[14px] outline-none placeholder:text-[var(--muted)]"
                        />
                        <div className="hidden items-center gap-1.5 text-[11px] text-[var(--muted)] md:flex">
                          <span className="command-kbd"><Command className="h-3 w-3" />K</span>
                          <span className="command-kbd">/</span>
                        </div>
                        <button
                          type="submit"
                          aria-label={t("createWithAi")}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[var(--primary)] transition-colors hover:bg-[var(--primary)]/10"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                          </svg>
                        </button>
                      </div>

                      <div className="mx-3 mb-3 mt-1.5 flex flex-wrap items-center gap-2 border-t border-[var(--border)]/65 px-1 pt-2.5">
                        {suggestionChips.map((chip) => (
                          <motion.button
                            key={chip}
                            type="button"
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              setAiPrompt(chip);
                              setCommandOpen(true);
                              commandInputRef.current?.focus();
                            }}
                            className="inline-flex min-h-7 items-center gap-1 rounded-full border border-[var(--border)]/85 bg-[var(--card)]/80 px-2.5 py-1 text-[11px] font-medium leading-none text-[var(--muted)] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset] transition-all duration-150 hover:-translate-y-px hover:border-[var(--primary)]/35 hover:bg-[var(--surface)]/70 hover:text-[var(--foreground)]"
                          >
                            <Sparkles className="h-3 w-3" />
                            {chip}
                          </motion.button>
                        ))}
                      </div>

                      <AnimatePresence>
                        {commandOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 8, scale: 0.99 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 6, scale: 0.99 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="command-dropdown mt-3"
                          >
                            {commandItems.length === 0 ? (
                              <div className="px-3 py-4 text-sm text-[var(--muted)]">
                                {t("noSearchResults")}
                              </div>
                            ) : (
                              <>
                                <div className="space-y-1">
                                  <p className="command-section-title">{t("commandQuickActions")}</p>
                                  {commandItems
                                    .filter((item) => item.section === "actions")
                                    .map((item) => {
                                      const index = commandItems.findIndex((candidate) => candidate.id === item.id);
                                      const Icon = item.icon;
                                      const active = index === commandActiveIndex;
                                      return (
                                        <motion.button
                                          key={item.id}
                                          type="button"
                                          initial={{ opacity: 0, y: 4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.18, delay: index * 0.02 }}
                                          onMouseEnter={() => {
                                            setCommandActiveIndex(index);
                                            setCommandNavigated(true);
                                          }}
                                          onClick={() => {
                                            item.onSelect();
                                            setCommandOpen(false);
                                          }}
                                          className={`command-item ${active ? "command-item--active" : ""}`}
                                        >
                                          <span className="command-item-icon"><Icon className="h-4 w-4" /></span>
                                          <span className="min-w-0 text-left">
                                            <span className="block truncate text-sm font-medium text-[var(--foreground)]">{item.title}</span>
                                            <span className="block truncate text-xs text-[var(--muted)]">{item.description}</span>
                                          </span>
                                        </motion.button>
                                      );
                                    })}
                                </div>

                                {commandItems.some((item) => item.section === "recent") && (
                                  <div className="mt-3 space-y-1">
                                    <p className="command-section-title">{t("commandRecentForms")}</p>
                                    {commandItems
                                      .filter((item) => item.section === "recent")
                                      .map((item) => {
                                        const index = commandItems.findIndex((candidate) => candidate.id === item.id);
                                        const Icon = item.icon;
                                        const active = index === commandActiveIndex;
                                        return (
                                          <motion.button
                                            key={item.id}
                                            type="button"
                                            initial={{ opacity: 0, y: 4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.18, delay: index * 0.02 }}
                                            onMouseEnter={() => {
                                              setCommandActiveIndex(index);
                                              setCommandNavigated(true);
                                            }}
                                            onClick={() => {
                                              item.onSelect();
                                              setCommandOpen(false);
                                            }}
                                            className={`command-item ${active ? "command-item--active" : ""}`}
                                          >
                                            <span className="command-item-icon"><Icon className="h-4 w-4" /></span>
                                            <span className="min-w-0 text-left">
                                              <span className="flex items-center gap-2 truncate text-sm font-medium text-[var(--foreground)]">
                                                <span className="truncate">{item.title}</span>
                                                {item.badge && (
                                                  <span className="rounded-full border border-[var(--border)] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-[var(--muted)]">
                                                    {item.badge}
                                                  </span>
                                                )}
                                              </span>
                                              <span className="block truncate text-xs text-[var(--muted)]">{item.description}</span>
                                            </span>
                                          </motion.button>
                                        );
                                      })}
                                  </div>
                                )}

                                <div className="mt-3 space-y-1">
                                  <p className="command-section-title">{t("commandAiSuggestions")}</p>
                                  {commandItems
                                    .filter((item) => item.section === "ai")
                                    .map((item) => {
                                      const index = commandItems.findIndex((candidate) => candidate.id === item.id);
                                      const Icon = item.icon;
                                      const active = index === commandActiveIndex;
                                      return (
                                        <motion.button
                                          key={item.id}
                                          type="button"
                                          initial={{ opacity: 0, y: 4 }}
                                          animate={{ opacity: 1, y: 0 }}
                                          transition={{ duration: 0.18, delay: index * 0.02 }}
                                          onMouseEnter={() => {
                                            setCommandActiveIndex(index);
                                            setCommandNavigated(true);
                                          }}
                                          onClick={() => {
                                            item.onSelect();
                                            setCommandOpen(false);
                                          }}
                                          className={`command-item ${active ? "command-item--active" : ""}`}
                                        >
                                          <span className="command-item-icon"><Icon className="h-4 w-4" /></span>
                                          <span className="min-w-0 text-left">
                                            <span className="block truncate text-sm font-medium text-[var(--foreground)]">{item.title}</span>
                                            <span className="block truncate text-xs text-[var(--muted)]">{item.description}</span>
                                          </span>
                                        </motion.button>
                                      );
                                    })}
                                </div>

                                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--border)]/80 px-1 pt-2 text-[11px] text-[var(--muted)]">
                                  <span className="command-kbd"><ArrowUpDown className="h-3 w-3" /></span>
                                  <span>{t("shortcutNavigate")}</span>
                                  <span className="command-kbd"><CornerDownLeft className="h-3 w-3" /></span>
                                  <span>{t("shortcutSelect")}</span>
                                  <span className="command-kbd">/</span>
                                  <span>{t("shortcutCommands")}</span>
                                </div>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </form>
                </div>
              </div>
            </section>

            {!user.isEmailVerified && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/40 text-yellow-700 dark:text-yellow-400 text-sm">
                {t("emailNotVerified")}
              </div>
            )}

            <section className="mb-6 grid grid-cols-1 gap-3 lg:grid-cols-2">
              <div className="premium-card p-4">
                <p className="text-xs text-[var(--muted)]">{t("metricResponsesThisMonth")}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--foreground)]">
                  {responsesThisMonth != null ? responsesThisMonth : t("noData")}
                </p>
              </div>
              <div className="premium-card p-4">
                <p className="text-xs text-[var(--muted)]">{t("metricBestCompletion")}</p>
                <p className="mt-1 text-xl font-semibold tabular-nums text-[var(--foreground)]">
                  {bestWorkspaceCompletionRate != null
                    ? `${bestWorkspaceCompletionRate}%`
                    : t("noData")}
                </p>
              </div>
            </section>

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
                  {forms.map((form, index) => {
                    const stats = form.listStats ?? defaultFormListStats();
                    const responseCount = form._count?.responses ?? 0;
                    return (
                    <div
                      key={form.id}
                      className="premium-card card-enter group p-5"
                      style={{ animationDelay: `${index * 40}ms` }}
                    >
                      {/* Row 1: Title + badge */}
                      <div className="relative flex items-start justify-between gap-3 mb-4">
                        <Link href={`/dashboard/forms/${form.id}`} className="min-w-0 flex-1 pr-2">
                          <h3 className="text-[16px] font-semibold leading-snug tracking-tight text-[var(--foreground)] truncate group-hover:text-[var(--primary)] transition-colors">
                            {form.title}
                          </h3>
                        </Link>
                        <span
                          className={`premium-card-badge shrink-0 ${
                            form.status === "published" ? "premium-card-badge--published" : "premium-card-badge--draft"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                              form.status === "published" ? "bg-[var(--primary)]" : "bg-emerald-500 dark:bg-emerald-400"
                            }`}
                          />
                          {form.status === "published" ? tf("published") : tf("draft")}
                        </span>
                      </div>

                      {/* Metrics: primary row (strong) + secondary row (muted) */}
                      <div className="relative mb-4 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
                          <span className="inline-flex items-center gap-1.5 text-[var(--foreground)]">
                            <svg className="h-4 w-4 shrink-0 text-[var(--primary)]/80" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5V6.75A2.25 2.25 0 0 1 4.5 4.5h15a2.25 2.25 0 0 1 2.25 2.25v6.75m-19.5 0v4.5A2.25 2.25 0 0 0 4.5 20.25h15a2.25 2.25 0 0 0 2.25-2.25v-4.5" />
                            </svg>
                            <span className="font-semibold tabular-nums">{tf("responses", { count: responseCount })}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5 text-[var(--foreground)]">
                            <BarChart3 className="h-4 w-4 shrink-0 text-[var(--primary)]/75" />
                            <span className="font-semibold tabular-nums">
                              {stats.completionRate != null ? `${stats.completionRate}%` : t("noData")}
                            </span>
                            <span className="text-[12px] font-normal text-[var(--muted)]">{t("metricCompletion")}</span>
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] leading-relaxed text-[var(--muted)]">
                          <span className="inline-flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 shrink-0 opacity-90" />
                            <span className="tabular-nums">{stats.viewCount}</span>
                            <span>{t("metricSessions")}</span>
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <svg className="h-3.5 w-3.5 shrink-0 opacity-90" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                            {tf("edited")} {format.relativeTime(new Date(form.updatedAt), now)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CircleDashed className="h-3.5 w-3.5 shrink-0 opacity-90" />
                            {stats.lastResponseAt ? (
                              <>
                                {t("lastResponseLabel")}{" "}
                                {format.relativeTime(new Date(stats.lastResponseAt), now)}
                              </>
                            ) : (
                              tf("responsesPage.noResponses")
                            )}
                          </span>
                        </div>
                      </div>

                      <div className="soft-divider mb-3" />

                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        {form.planSession?.id && (
                          <span className="premium-card-chip premium-card-chip--ai">
                            <Sparkles className="h-3 w-3 shrink-0" />
                            AI generated
                          </span>
                        )}
                        {stats.integrationsActive && (
                          <span className="premium-card-chip premium-card-chip--cyan">{t("integrationsActive")}</span>
                        )}
                      </div>

                      {/* Row 3: Actions */}
                      <div className="relative flex items-center justify-end gap-0.5 border-t border-[var(--border)]/50 pt-3 opacity-90 transition-opacity group-hover:opacity-100 dark:border-[var(--border)]/40">
                        <div className="relative group/action">
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] opacity-0 shadow-sm transition-opacity group-hover/action:opacity-100 z-10">
                            {form.planSession?.id ? tResume("continueChat") : tResume("startChat")}
                          </span>
                          <Link
                            href={
                              form.planSession?.id
                                ? `/dashboard/forms/new?sessionId=${form.planSession.id}&formId=${form.id}`
                                : `/dashboard/forms/new?formId=${form.id}`
                            }
                            aria-label={form.planSession?.id ? tResume("continueChat") : tResume("startChat")}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--primary)] hover:bg-[var(--primary)]/10 transition-colors"
                          >
                            <SparkleIcon className="w-4 h-4" />
                          </Link>
                        </div>

                        <div className="relative group/action">
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] opacity-0 shadow-sm transition-opacity group-hover/action:opacity-100 z-10">
                            {tf("editor.title")}
                          </span>
                          <Link
                            href={`/dashboard/forms/${form.id}`}
                            aria-label={tf("editor.title")}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125" />
                            </svg>
                          </Link>
                        </div>

                        <div className="relative group/action">
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] opacity-0 shadow-sm transition-opacity group-hover/action:opacity-100 z-10">
                            {tf("responsesPage.title")}
                          </span>
                          <Link
                            href={`/dashboard/forms/${form.id}/responses`}
                            aria-label={tf("responsesPage.title")}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                            </svg>
                          </Link>
                        </div>

                        <div className="relative group/action">
                          <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1 text-[11px] text-[var(--foreground)] opacity-0 shadow-sm transition-opacity group-hover/action:opacity-100 z-10">
                            {tf("editor.deleteForm")}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(form.id, form.title)}
                            aria-label={tf("editor.deleteForm")}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[var(--muted)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  )})}
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
