"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  CornerDownLeft,
  FilePlus,
  FileText,
  House,
  LayoutTemplate,
  Loader2,
  Search,
  Settings,
  Users,
  X,
} from "lucide-react";
import { api } from "@/lib/api";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { createForm } from "@/lib/redux/formsSlice";
import { SparkleIcon } from "@/components/icons/SparkleIcon";
import type { Form } from "@/lib/types";

type CommandPaletteProps = {
  open: boolean;
  onClose: () => void;
};

/** A single keyboard-navigable row. `id` doubles as its DOM id for aria-activedescendant. */
type Command = {
  id: string;
  icon: ReactNode;
  label: string;
  meta?: ReactNode;
  /** Teal-tinted icon tile for AI / brand actions. */
  accent?: boolean;
  onSelect: () => void;
};

const RECENT_LIMIT = 6;
const SEARCH_LIMIT = 8;
const SEARCH_DEBOUNCE_MS = 180;

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const t = useTranslations("commandPalette");
  const tShell = useTranslations("shell");
  const tForms = useTranslations("forms");
  const router = useRouter();
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth.token);

  const [query, setQuery] = useState("");
  const [recentForms, setRecentForms] = useState<Form[]>([]);
  const [results, setResults] = useState<Form[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const recentReqRef = useRef(0);
  const searchReqRef = useRef(0);

  const trimmed = query.trim();

  // ── Navigate + close helpers ───────────────────────────────────────────────
  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const openForm = useCallback((id: string) => go(`/dashboard/forms/${id}`), [go]);

  const createWithAI = useCallback(() => {
    const prompt = trimmed;
    go(prompt ? `/dashboard/forms/new?prompt=${encodeURIComponent(prompt)}` : "/dashboard/forms/new");
  }, [go, trimmed]);

  const createBlank = useCallback(async () => {
    if (!token || creating) return;
    setCreating(true);
    try {
      const form = await dispatch(
        createForm({ title: tForms("blankFormTitle"), schema: [], settings: {} }),
      ).unwrap();
      onClose();
      router.push(`/dashboard/forms/${form.id}`);
    } catch {
      // Surface nothing here — the dashboard owns blank-form error messaging.
    } finally {
      setCreating(false);
    }
  }, [token, creating, dispatch, tForms, onClose, router]);

  // ── Recent forms (shown when the query is empty) ────────────────────────────
  useEffect(() => {
    if (!open || !token) return;
    const reqId = ++recentReqRef.current;
    api
      .listForms(token, { limit: RECENT_LIMIT })
      .then((res) => {
        if (reqId === recentReqRef.current) setRecentForms(res.items);
      })
      .catch(() => {
        if (reqId === recentReqRef.current) setRecentForms([]);
      });
  }, [open, token]);

  // ── Live form search (debounced) ────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    if (!trimmed || !token) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const reqId = ++searchReqRef.current;
    const handle = window.setTimeout(() => {
      api
        .listForms(token, { query: trimmed, limit: SEARCH_LIMIT })
        .then((res) => {
          if (reqId === searchReqRef.current) setResults(res.items);
        })
        .catch(() => {
          if (reqId === searchReqRef.current) setResults([]);
        })
        .finally(() => {
          if (reqId === searchReqRef.current) setSearching(false);
        });
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [open, trimmed, token]);

  // ── Lock scroll, focus the input, restore focus on close ────────────────────
  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const raf = requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = prevOverflow;
      cancelAnimationFrame(raf);
      // Only restore focus if the element is still in the document.
      if (previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus?.();
      }
    };
  }, [open]);

  // ── Reset transient state once closed ───────────────────────────────────────
  useEffect(() => {
    if (open) return;
    setQuery("");
    setResults([]);
    setSearching(false);
    setCreating(false);
    setActiveIndex(0);
  }, [open]);

  const statusPill = useCallback(
    (form: Form) => (
      <span
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${
          form.status === "published"
            ? "bg-[var(--primary)]/10 text-[var(--primary)]"
            : "bg-[var(--surface)] text-[var(--muted)]"
        }`}
      >
        {form.status === "published" ? t("statusPublished") : t("statusDraft")}
      </span>
    ),
    [t],
  );

  const toFormCommand = useCallback(
    (form: Form): Command => ({
      id: `palette-form-${form.id}`,
      icon: <FileText className="h-[18px] w-[18px]" strokeWidth={1.8} />,
      label: form.title?.trim() || tForms("blankFormTitle"),
      meta: statusPill(form),
      onSelect: () => openForm(form.id),
    }),
    [openForm, statusPill, tForms],
  );

  // ── Build the command lists for the current query ───────────────────────────
  const { formItems, actionItems, navItems, flat } = useMemo(() => {
    const q = trimmed.toLowerCase();
    const forms = (trimmed ? results : recentForms).map(toFormCommand);

    const actionDefs: Array<Command & { keywords: string[]; always?: boolean }> = [
      {
        id: "palette-action-ai",
        icon: <SparkleIcon className="h-[18px] w-[18px]" />,
        accent: true,
        label: trimmed ? t("actionCreateWithQuery", { query: trimmed }) : t("actionCreateWithAI"),
        keywords: ["ai", "create", "generate", "new", "form"],
        always: true,
        onSelect: createWithAI,
      },
      {
        id: "palette-action-blank",
        icon: creating ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={1.8} />
        ) : (
          <FilePlus className="h-[18px] w-[18px]" strokeWidth={1.8} />
        ),
        label: creating ? t("creating") : t("actionBlankForm"),
        keywords: ["blank", "empty", "scratch", "new", "form"],
        onSelect: createBlank,
      },
      {
        id: "palette-action-templates",
        icon: <LayoutTemplate className="h-[18px] w-[18px]" strokeWidth={1.8} />,
        label: t("actionBrowseTemplates"),
        keywords: ["template", "templates", "browse", "library"],
        onSelect: () => go("/dashboard/templates"),
      },
    ];
    const actions = actionDefs.filter(
      (a) => !trimmed || a.always || a.label.toLowerCase().includes(q) || a.keywords.some((k) => k.includes(q)),
    );

    const navDefs: Array<Command & { keywords: string[] }> = [
      {
        id: "palette-nav-home",
        icon: <House className="h-[18px] w-[18px]" strokeWidth={1.8} />,
        label: tShell("navHome"),
        keywords: ["home", "dashboard"],
        onSelect: () => go("/dashboard"),
      },
      {
        id: "palette-nav-templates",
        icon: <LayoutTemplate className="h-[18px] w-[18px]" strokeWidth={1.8} />,
        label: tShell("navTemplates"),
        keywords: ["templates"],
        onSelect: () => go("/dashboard/templates"),
      },
      {
        id: "palette-nav-workspace",
        icon: <Users className="h-[18px] w-[18px]" strokeWidth={1.8} />,
        label: tShell("navWorkspace"),
        keywords: ["workspace", "team", "members"],
        onSelect: () => go("/dashboard/workspace"),
      },
      {
        id: "palette-nav-settings",
        icon: <Settings className="h-[18px] w-[18px]" strokeWidth={1.8} />,
        label: tShell("navSettings"),
        keywords: ["settings", "profile", "account", "preferences"],
        onSelect: () => go("/profile"),
      },
    ];
    const nav = navDefs.filter(
      (n) => !trimmed || n.label.toLowerCase().includes(q) || n.keywords.some((k) => k.includes(q)),
    );

    return { formItems: forms, actionItems: actions, navItems: nav, flat: [...forms, ...actions, ...nav] };
  }, [trimmed, results, recentForms, toFormCommand, creating, t, tShell, createWithAI, createBlank, go]);

  const indexById = useMemo(() => new Map(flat.map((item, i) => [item.id, i])), [flat]);
  const activeId = flat[activeIndex]?.id;

  // Typing always re-highlights the first row; never let the cursor fall off the end.
  useEffect(() => {
    setActiveIndex(0);
  }, [trimmed]);
  useEffect(() => {
    setActiveIndex((i) => (flat.length === 0 ? 0 : Math.min(i, flat.length - 1)));
  }, [flat.length]);

  // Keep the highlighted row in view as the cursor moves.
  useEffect(() => {
    if (!open || !activeId) return;
    document.getElementById(activeId)?.scrollIntoView({ block: "nearest" });
  }, [open, activeId]);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    switch (event.key) {
      case "Escape":
        event.preventDefault();
        onClose();
        return;
      case "ArrowDown":
        event.preventDefault();
        if (flat.length) setActiveIndex((i) => (i + 1) % flat.length);
        return;
      case "ArrowUp":
        event.preventDefault();
        if (flat.length) setActiveIndex((i) => (i - 1 + flat.length) % flat.length);
        return;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        return;
      case "End":
        event.preventDefault();
        if (flat.length) setActiveIndex(flat.length - 1);
        return;
      case "Enter":
        event.preventDefault();
        flat[activeIndex]?.onSelect();
        return;
      case "Tab": {
        // Keep focus inside the dialog (only the input and the clear button are focusable).
        const panel = panelRef.current;
        if (!panel) return;
        const focusables = Array.from(
          panel.querySelectorAll<HTMLElement>(
            'input, button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
          ),
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const current = document.activeElement;
        if (event.shiftKey && (current === first || !panel.contains(current))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (current === last || !panel.contains(current))) {
          event.preventDefault();
          first.focus();
        }
        return;
      }
      default:
        return;
    }
  };

  if (!open) return null;

  const renderRow = (item: Command) => {
    const idx = indexById.get(item.id) ?? -1;
    const isActive = idx === activeIndex;
    return (
      <div
        key={item.id}
        id={item.id}
        role="option"
        aria-selected={isActive}
        onMouseMove={() => {
          if (idx >= 0 && idx !== activeIndex) setActiveIndex(idx);
        }}
        onClick={item.onSelect}
        className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-100 ${
          isActive ? "bg-[var(--surface)]" : ""
        }`}
      >
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${
            item.accent
              ? "border-[var(--primary)]/30 bg-[var(--primary)]/10 text-[var(--primary)]"
              : "border-[var(--border)] bg-[var(--background)] text-[var(--muted)]"
          }`}
        >
          {item.icon}
        </span>
        <span className="min-w-0 flex-1 truncate text-[14px] text-[var(--foreground)]">{item.label}</span>
        {item.meta}
        <CornerDownLeft
          className={`h-4 w-4 shrink-0 text-[var(--muted)] transition-opacity ${
            isActive ? "opacity-100" : "opacity-0"
          }`}
          strokeWidth={1.8}
          aria-hidden
        />
      </div>
    );
  };

  const showFormsSection = Boolean(trimmed) || recentForms.length > 0;
  const formsBusy = Boolean(trimmed) && searching && results.length === 0;
  const formsEmpty = Boolean(trimmed) && !searching && results.length === 0;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center px-4 pt-[14vh] sm:pt-[16vh]"
      role="dialog"
      aria-modal="true"
      aria-label={t("ariaLabel")}
      onKeyDown={handleKeyDown}
    >
      <div
        className="palette-scrim-enter absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      <div
        ref={panelRef}
        className="palette-panel-enter palette-panel glass-panel relative flex w-full max-w-[640px] flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--card)]/95"
      >
        {/* ── Search row ── */}
        <div className="flex items-center gap-3 px-4">
          <Search className="h-[18px] w-[18px] shrink-0 text-[var(--muted)]" strokeWidth={2} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("inputPlaceholder")}
            aria-label={t("inputPlaceholder")}
            role="combobox"
            aria-expanded
            aria-controls="palette-listbox"
            aria-activedescendant={activeId}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            className="h-14 min-w-0 flex-1 bg-transparent text-[15px] text-[var(--foreground)] outline-none placeholder:text-[var(--muted)]"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label={t("clear")}
              className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--foreground)] cursor-pointer"
            >
              <X className="h-4 w-4" strokeWidth={2} />
            </button>
          ) : (
            <kbd className="hidden shrink-0 rounded border border-[var(--border)] bg-[var(--background)] px-1.5 py-0.5 font-mono text-[10px] leading-none text-[var(--muted)] sm:inline-block">
              esc
            </kbd>
          )}
        </div>

        <div className="h-px bg-[var(--border)]/70" />

        {/* ── Results ── */}
        <div
          id="palette-listbox"
          role="listbox"
          aria-busy={formsBusy}
          className="palette-scroll max-h-[min(56vh,420px)] py-2"
        >
          {showFormsSection && (
            <div className="px-2 pb-1.5">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {trimmed ? t("groupForms") : t("groupRecent")}
              </p>
              {formsBusy ? (
                <div className="flex items-center gap-2.5 px-3 py-3 text-[13px] text-[var(--muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} />
                  {t("searching")}
                </div>
              ) : formsEmpty ? (
                <div className="px-3 py-3 text-[13px] text-[var(--muted)]">
                  {t("noForms", { query: trimmed })}
                </div>
              ) : (
                formItems.map(renderRow)
              )}
            </div>
          )}

          {actionItems.length > 0 && (
            <div className="px-2 pb-1.5">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {t("groupActions")}
              </p>
              {actionItems.map(renderRow)}
            </div>
          )}

          {navItems.length > 0 && (
            <div className="px-2 pb-1.5">
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">
                {t("groupGo")}
              </p>
              {navItems.map(renderRow)}
            </div>
          )}
        </div>

        {/* Politely announce async state changes to assistive tech. */}
        <div className="sr-only" role="status" aria-live="polite">
          {creating
            ? t("creating")
            : formsBusy
              ? t("searching")
              : formsEmpty
                ? t("noForms", { query: trimmed })
                : ""}
        </div>

        {/* ── Footer hints ── */}
        <div className="flex items-center justify-between gap-3 border-t border-[var(--border)]/60 px-4 py-2.5">
          <div className="flex items-center gap-3.5 text-[11px] text-[var(--muted)]">
            <span className="flex items-center gap-1.5">
              <span className="flex gap-0.5">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
              </span>
              {t("hintNavigate")}
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Kbd>↵</Kbd>
              {t("hintOpen")}
            </span>
            <span className="hidden items-center gap-1.5 sm:flex">
              <Kbd>esc</Kbd>
              {t("hintClose")}
            </span>
          </div>
          <span className="hidden items-center gap-1.5 text-[11px] font-medium text-[var(--muted)] sm:inline-flex">
            <SparkleIcon className="h-3.5 w-3.5 text-[var(--primary)]" />
            QForms
          </span>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-[18px] min-w-[18px] items-center justify-center rounded border border-[var(--border)] bg-[var(--background)] px-1 font-mono text-[10px] leading-none text-[var(--muted)]">
      {children}
    </kbd>
  );
}
