"use client";

import { useRef, useState, type KeyboardEvent } from "react";

const DOMAIN_REGEX = /^([a-z0-9-]+\.)+[a-z]{2,}$/i;

export function isValidDomain(value: string): boolean {
  return DOMAIN_REGEX.test(value.trim().toLowerCase()) && value.length <= 253;
}

interface DomainChipInputProps {
  domains: string[];
  onChange: (domains: string[]) => void;
  placeholder?: string;
  invalidHint?: string;
  suggestion?: string | null;
  suggestionLabel?: string;
}

export function DomainChipInput({
  domains,
  onChange,
  placeholder = "add domain…",
  invalidHint,
  suggestion,
  suggestionLabel,
}: DomainChipInputProps) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const commitDraft = (value: string) => {
    const cleaned = value.trim().toLowerCase().replace(/^@/, "");
    if (!cleaned) return;
    if (!isValidDomain(cleaned)) {
      setError(invalidHint ?? "Invalid domain");
      return;
    }
    if (domains.includes(cleaned)) {
      setDraft("");
      setError(null);
      return;
    }
    onChange([...domains, cleaned]);
    setDraft("");
    setError(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      commitDraft(draft);
    } else if (e.key === "Backspace" && draft.length === 0 && domains.length > 0) {
      onChange(domains.slice(0, -1));
    }
  };

  const removeDomain = (value: string) => {
    onChange(domains.filter((d) => d !== value));
  };

  const canSuggest =
    suggestion &&
    !domains.includes(suggestion) &&
    isValidDomain(suggestion);

  return (
    <div className="space-y-2">
      <div
        className={`flex flex-wrap items-center gap-1.5 rounded-xl border bg-[var(--background)]/40 px-2.5 py-2 transition-all duration-150 focus-within:ring-2 ${
          error
            ? "border-red-400/60 focus-within:border-red-500 focus-within:ring-red-400/30"
            : "border-[var(--border)] focus-within:border-[var(--primary)]/60 focus-within:ring-[var(--primary)]/25"
        }`}
        onClick={() => inputRef.current?.focus()}
      >
        {domains.map((d) => (
          <span
            key={d}
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-xs font-medium text-[var(--primary)]"
          >
            {d}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeDomain(d);
              }}
              className="rounded-full p-0.5 hover:bg-[var(--primary)]/20 transition-colors"
              aria-label={`Remove ${d}`}
            >
              <svg
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) commitDraft(draft);
          }}
          placeholder={domains.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[8ch] bg-transparent px-1.5 py-1 text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70 outline-none"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
      {canSuggest && suggestionLabel && (
        <button
          type="button"
          onClick={() => commitDraft(suggestion!)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--primary)]/40 transition-colors"
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {suggestionLabel.replace("{domain}", suggestion!)}
        </button>
      )}
    </div>
  );
}
