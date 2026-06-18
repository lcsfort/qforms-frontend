"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FocusEvent } from "react";
import { collectFieldNodes } from "@renderkit/core";
import type { RenderKitDocument } from "@renderkit/schema";
import { api } from "@/lib/api";

type BehaviorEventType =
  | "form_open"
  | "form_start"
  | "field_focus"
  | "field_blur"
  | "field_change"
  | "submit_attempt"
  | "submit_success"
  | "submit_error"
  | "form_abandon";

interface Options {
  slug: string;
  locale: string;
  document: RenderKitDocument | null;
  /** When false (e.g. after submit), abandon tracking is suppressed. */
  enabled: boolean;
}

/**
 * Reconstructs qforms' behaviour-analytics events from RenderKit's renderer
 * callbacks. RenderKit exposes only `onChange`/`onAction`/`onSubmit`, so:
 *  - form_open: on mount
 *  - form_start: first interaction (focus or change)
 *  - field_change: diff successive onChange states
 *  - field_focus / field_blur: DOM focus capture on the container (ui-default
 *    inputs render `id={node.id}` and `data-rk-field-focus`)
 *  - submit_attempt: onAction type==="submit"; submit_success/error: host-driven
 *  - form_abandon: visibilitychange / beforeunload
 */
export function useRenderkitAnalytics({ slug, locale, document, enabled }: Options) {
  const [sessionId, setSessionId] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const pageOpenAt = useMemo(() => Date.now(), []);
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const pendingSubmitRef = useRef(false);
  const lastFieldIdRef = useRef("");
  const prevStateRef = useRef<Record<string, unknown>>({});
  const focusedAtRef = useRef<Record<string, number>>({});

  const fieldIdSet = useMemo(() => {
    if (!document) return new Set<string>();
    try {
      return new Set(collectFieldNodes(document).map((n) => n.id));
    } catch {
      return new Set<string>();
    }
  }, [document]);

  // Bootstrap a stable per-slug behaviour session id.
  useEffect(() => {
    const key = `qforms_behavior_session_${slug}`;
    const existing =
      typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
    const id = existing || (typeof crypto !== "undefined" ? crypto.randomUUID() : `${Date.now()}`);
    if (!existing && typeof window !== "undefined") {
      window.localStorage.setItem(key, id);
    }
    setSessionId(id);
  }, [slug]);

  const send = useCallback(
    (eventType: BehaviorEventType, fieldId?: string, payload?: Record<string, unknown>) => {
      if (!sessionId) return;
      const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
      const deviceType = /Mobi|Android/i.test(userAgent)
        ? "mobile"
        : /iPad|Tablet/i.test(userAgent)
          ? "tablet"
          : "desktop";
      const viewport =
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : undefined;
      void api
        .trackPublicFormBehavior(slug, {
          sessionId,
          eventType,
          fieldId,
          payload,
          locale,
          referer: typeof globalThis.document !== "undefined" ? globalThis.document.referrer : "",
          viewport,
          deviceType,
        })
        .catch(() => {
          /* telemetry is best-effort */
        });
    },
    [sessionId, slug, locale],
  );

  const markStarted = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    send("form_start");
  }, [send]);

  // form_open + abandon listeners.
  useEffect(() => {
    if (!sessionId) return;
    send("form_open");
    const onAbandon = () => {
      if (submittedRef.current || !enabled) return;
      send("form_abandon", undefined, { lastFieldId: lastFieldIdRef.current });
    };
    const onVisibility = () => {
      if (globalThis.document.visibilityState === "hidden") onAbandon();
    };
    globalThis.document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("beforeunload", onAbandon);
    return () => {
      globalThis.document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onAbandon);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, enabled]);

  const onChange = useCallback(
    (state: Record<string, unknown>) => {
      markStarted();
      const prev = prevStateRef.current;
      for (const key of Object.keys(state)) {
        if (key === "currentStep") continue;
        if (prev[key] !== state[key]) {
          lastFieldIdRef.current = key;
          if (fieldIdSet.size === 0 || fieldIdSet.has(key)) {
            send("field_change", key);
          }
        }
      }
      prevStateRef.current = { ...state };
    },
    [markStarted, send, fieldIdSet],
  );

  const onAction = useCallback(
    (action: { type?: string }) => {
      if (action?.type !== "submit") return;
      send("submit_attempt");
      pendingSubmitRef.current = true;
      // onSubmit (if valid) runs synchronously right after onAction inside the
      // renderer; the host clears the flag in onSubmitSuccess. If still pending
      // after the microtask, validation blocked the submit.
      queueMicrotask(() => {
        if (pendingSubmitRef.current) {
          pendingSubmitRef.current = false;
          send("submit_error", undefined, { reason: "validation" });
        }
      });
    },
    [send],
  );

  const resolveFieldId = useCallback(
    (el: EventTarget | null): string | undefined => {
      const node = el as HTMLElement | null;
      if (!node || typeof node.closest !== "function") return undefined;
      const host = node.closest<HTMLElement>("[data-rk-field-focus]") ?? node;
      const id = host.id || (host as HTMLInputElement).name;
      if (!id) return undefined;
      return fieldIdSet.size === 0 || fieldIdSet.has(id) ? id : undefined;
    },
    [fieldIdSet],
  );

  const onFocusCapture = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      const id = resolveFieldId(e.target);
      if (!id) return;
      markStarted();
      focusedAtRef.current[id] = Date.now();
      lastFieldIdRef.current = id;
      send("field_focus", id);
    },
    [resolveFieldId, markStarted, send],
  );

  const onBlurCapture = useCallback(
    (e: FocusEvent<HTMLDivElement>) => {
      const id = resolveFieldId(e.target);
      if (!id) return;
      const startedAt = focusedAtRef.current[id];
      if (startedAt == null) return;
      delete focusedAtRef.current[id];
      send("field_blur", id, { durationMs: Math.max(0, Date.now() - startedAt) });
    },
    [resolveFieldId, send],
  );

  const onSubmitSuccess = useCallback(() => {
    pendingSubmitRef.current = false;
    submittedRef.current = true;
    send("submit_success", undefined, {
      completionMs: Math.max(0, Date.now() - pageOpenAt),
    });
  }, [send, pageOpenAt]);

  const onSubmitError = useCallback(
    (message: string) => {
      pendingSubmitRef.current = false;
      send("submit_error", undefined, { message });
    },
    [send],
  );

  return {
    sessionId,
    containerRef,
    onChange,
    onAction,
    onFocusCapture,
    onBlurCapture,
    onSubmitSuccess,
    onSubmitError,
  };
}
