"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import { SectionCard } from "./SectionCard";
import { SoftInput, SoftTextarea } from "./primitives/SoftInput";

type ShareT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

interface ShareDistributionSectionProps {
  shareUrl: string;
  formId: string;
  status: "draft" | "published";
  token: string | null;
  t: ShareT;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type SendState =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "success"; sent: number; invalid: number; failed: number }
  | { kind: "error"; message: string };

function parseEmails(raw: string): { valid: string[]; invalid: string[] } {
  const tokens = raw
    .split(/[\s,;\n\r\t]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const seen = new Set<string>();
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const token of tokens) {
    const normalized = token.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    if (EMAIL_REGEX.test(normalized) && normalized.length <= 254) {
      valid.push(normalized);
    } else {
      invalid.push(token);
    }
  }
  return { valid, invalid };
}

export function ShareDistributionSection({
  shareUrl,
  formId,
  status,
  token,
  t,
}: ShareDistributionSectionProps) {
  const [copied, setCopied] = useState(false);
  const [raw, setRaw] = useState("");
  const [sendState, setSendState] = useState<SendState>({ kind: "idle" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsed = useMemo(() => parseEmails(raw), [raw]);

  const handleCopy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  const handleCsvUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setRaw((prev) => (prev.trim() ? `${prev.trim()}\n${text}` : text));
    } catch {
      setSendState({ kind: "error", message: t("share.csvReadError") });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSend = async () => {
    if (!token) return;
    if (parsed.valid.length === 0) return;
    setSendState({ kind: "sending" });
    try {
      const res = await api.sendFormByEmail(token, formId, parsed.valid);
      setSendState({
        kind: "success",
        sent: res.sent,
        invalid: parsed.invalid.length,
        failed: res.failed.length,
      });
      setRaw("");
      setTimeout(() => setSendState({ kind: "idle" }), 4000);
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message?: string }).message)
          : t("share.sendError");
      setSendState({ kind: "error", message });
    }
  };

  const sendDisabled =
    !token ||
    status !== "published" ||
    parsed.valid.length === 0 ||
    sendState.kind === "sending";

  return (
    <SectionCard
      title={t("share.title")}
      description={t("share.description")}
      eyebrow={<span>{t("share.eyebrow")}</span>}
    >
      <div className="space-y-6">
        <div>
          <span className="mb-2 block text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
            {t("share.linkLabel")}
          </span>
          <div className="flex gap-2">
            <SoftInput
              type="text"
              readOnly
              value={shareUrl}
              className="flex-1 font-mono text-xs"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              disabled={!shareUrl}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                copied
                  ? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400"
                  : "border-[var(--border)] bg-[var(--background)]/40 hover:border-[var(--primary)]/40 hover:text-[var(--primary)] hover:-translate-y-px"
              }`}
            >
              {copied ? (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  {t("share.copied")}
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                  </svg>
                  {t("share.copy")}
                </>
              )}
            </button>
          </div>
          {status !== "published" && (
            <p className="mt-2 text-xs text-[var(--muted)]">
              {t("share.draftNotice")}
            </p>
          )}
        </div>

        <div className="h-px bg-[var(--border)]/70" aria-hidden />

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="block text-[11px] font-medium uppercase tracking-wide text-[var(--muted)]">
              {t("share.sendLabel")}
            </span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,text/plain"
              className="hidden"
              onChange={handleCsvUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/40 transition-colors"
            >
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3 3m3-3l3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
              {t("share.uploadCsv")}
            </button>
          </div>
          <SoftTextarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={4}
            placeholder={t("share.placeholder")}
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3 text-[var(--muted)]">
              <span>
                {t("share.recipientCount", { count: parsed.valid.length })}
              </span>
              {parsed.invalid.length > 0 && (
                <span className="text-amber-500">
                  {t("share.invalidCount", { count: parsed.invalid.length })}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleSend}
              disabled={sendDisabled}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-all duration-150 hover:-translate-y-px hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              {sendState.kind === "sending" ? (
                <>
                  <span className="h-3 w-3 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                  {t("share.sending")}
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                  {t("share.send")}
                </>
              )}
            </button>
          </div>

          {sendState.kind === "success" && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              {t("share.successMessage", { sent: sendState.sent })}
            </p>
          )}
          {sendState.kind === "error" && (
            <p className="mt-3 text-xs text-red-500">{sendState.message}</p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
