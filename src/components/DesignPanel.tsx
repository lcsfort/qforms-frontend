"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaintbrush } from "@fortawesome/free-solid-svg-icons";
import { useRef, useState, useEffect, type DragEvent, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import type { FormSettings, FormMaxWidth } from "@/lib/types";

const FONTS_TO_PRELOAD = 60;

function FontFamilyDropdown({
  options,
  value,
  onChange,
  disabled,
  defaultLabel,
  id,
}: {
  options: string[];
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  disabled: boolean;
  defaultLabel: string;
  id: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const displayValue = value && value.trim() ? value : defaultLabel;
  const isDefault = !value || !value.trim();

  return (
    <div ref={containerRef} className="relative flex-1 min-w-0">
      <button
        type="button"
        id={id}
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className="w-full h-8 pl-2.5 pr-8 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs outline-none cursor-pointer disabled:opacity-50 text-left flex items-center truncate"
      >
        <span
          className="truncate"
          style={isDefault ? undefined : { fontFamily: value ?? undefined }}
        >
          {displayValue}
        </span>
      </button>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400">
        <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-0.5 z-50 max-h-56 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 shadow-lg py-1">
          {options.map((name, idx) => {
            const isDefaultOption = idx === 0;
            const selected = (isDefaultOption && isDefault) || (!isDefaultOption && value === name);
            return (
              <button
                key={name}
                type="button"
                onClick={() => {
                  onChange(isDefaultOption ? undefined : name);
                  setOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 text-left text-xs transition-colors flex items-center ${
                  selected ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300" : "hover:bg-gray-100 dark:hover:bg-gray-600"
                }`}
                style={isDefaultOption ? undefined : { fontFamily: name }}
              >
                {name}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const WIDTH_OPTIONS: { value: FormMaxWidth; label: string; icon: string }[] = [
  { value: "sm", label: "widthNarrow", icon: "S" },
  { value: "md", label: "widthMedium", icon: "M" },
  { value: "lg", label: "widthLarge", icon: "L" },
  { value: "xl", label: "widthWide", icon: "XL" },
  { value: "2xl", label: "widthExtraWide", icon: "2X" },
  { value: "full", label: "widthFull", icon: "W" },
];

const COLUMN_OPTIONS: { value: 1 | 2 | 3; label: string }[] = [
  { value: 1, label: "columnsOne" },
  { value: 2, label: "columnsTwo" },
  { value: 3, label: "columnsThree" },
];

const FONT_SIZE_OPTIONS = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

const FALLBACK_FONT_FAMILIES = ["Inter", "Roboto", "Open Sans", "Lexend", "Montserrat", "Lato", "Poppins"];

const GOOGLE_FONTS_API_URL = "https://www.googleapis.com/webfonts/v1/webfonts";
const FONT_LIST_CACHE_KEY = "qforms_google_fonts_families";

const PRESET_COLORS = [
  "#ffffff",
  "#f9fafb",
  "#f3f4f6",
  "#e5e7eb",
  "#fef9c3",
  "#dcfce7",
  "#dbeafe",
  "#fce7f3",
  "#e0e7ff",
  "#fee2e2",
];

function isValidHex(s: string): boolean {
  return /^#([0-9A-Fa-f]{3}){1,2}$/.test(s);
}

function ColorPicker({
  label,
  value,
  onChange,
  t,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  t: (key: string) => string;
}) {
  const [hexInput, setHexInput] = useState(value ?? "");

  useEffect(() => {
    setHexInput(value ?? "");
  }, [value]);

  const commitHex = () => {
    const trimmed = hexInput.trim();
    if (!trimmed) {
      onChange(undefined);
      return;
    }
    const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    if (isValidHex(withHash)) {
      onChange(withHash);
      setHexInput(withHash);
    } else {
      setHexInput(value ?? "");
    }
  };

  return (
    <div>
      <span className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {/* Default / transparent swatch */}
        <button
          type="button"
          onClick={() => { onChange(undefined); setHexInput(""); }}
          title={t("defaultColor")}
          className={`h-6 w-6 rounded-full border-2 flex-shrink-0 transition-all ${
            !value
              ? "border-indigo-500 ring-2 ring-indigo-500/30"
              : "border-gray-200 dark:border-gray-600 hover:border-gray-400"
          }`}
          style={{
            background: "repeating-conic-gradient(#d1d5db 0% 25%, transparent 0% 50%) 50% / 8px 8px",
          }}
        />
        {PRESET_COLORS.map((hex) => (
          <button
            key={hex}
            type="button"
            onClick={() => { onChange(hex); setHexInput(hex); }}
            className={`h-6 w-6 rounded-full border-2 flex-shrink-0 transition-all ${
              value === hex
                ? "border-indigo-500 ring-2 ring-indigo-500/30"
                : "border-gray-200 dark:border-gray-600 hover:border-gray-400"
            }`}
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
      <div className="flex items-center gap-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-hidden h-8">
        <span className="pl-2.5 pr-1 text-xs text-[var(--muted)] font-mono select-none">#</span>
        <input
          type="text"
          value={hexInput.replace(/^#/, "")}
          onChange={(e) => setHexInput(`#${e.target.value}`)}
          onBlur={commitHex}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
          placeholder="hex"
          className="flex-1 min-w-0 pr-2.5 py-1 bg-transparent text-xs font-mono outline-none"
        />
        {value && (
          <div
            className="h-5 w-5 rounded mr-1.5 flex-shrink-0 border border-gray-200 dark:border-gray-500"
            style={{ backgroundColor: value }}
          />
        )}
      </div>
    </div>
  );
}

function Divider() {
  return <div className="border-t border-[var(--border)]" />;
}

export function DesignPanel({
  settings,
  setSettings,
  token,
  t,
}: {
  settings: FormSettings;
  setSettings: (s: FormSettings) => void;
  token: string;
  t: (key: string) => string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const [fontFamilies, setFontFamilies] = useState<string[]>([]);
  const [fontFamiliesLoading, setFontFamiliesLoading] = useState(true);
  const [fontFamiliesError, setFontFamiliesError] = useState(false);
  const fontPreloadRef = useRef(false);

  useEffect(() => {
    if (fontFamilies.length <= 1 || fontPreloadRef.current) return;
    fontPreloadRef.current = true;
    const toLoad = fontFamilies.slice(1, FONTS_TO_PRELOAD + 1);
    const params = toLoad.map((f) => `family=${encodeURIComponent(f).replace(/ /g, "+")}`).join("&");
    const href = `https://fonts.googleapis.com/css2?${params}&display=swap`;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.id = "qforms-design-panel-fonts";
    document.head.appendChild(link);
  }, [fontFamilies]);

  useEffect(() => {
    const defaultLabel = t("fontDefault");
    const key = process.env.NEXT_PUBLIC_GOOGLE_FONTS_API_KEY;
    try {
      const cached = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(FONT_LIST_CACHE_KEY) : null;
      if (cached) {
        const parsed = JSON.parse(cached) as string[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          setFontFamilies([defaultLabel, ...parsed]);
          setFontFamiliesLoading(false);
          return;
        }
      }
    } catch {
      /* ignore */
    }
    if (!key) {
      setFontFamilies([defaultLabel, ...FALLBACK_FONT_FAMILIES]);
      setFontFamiliesLoading(false);
      return;
    }
    setFontFamiliesLoading(true);
    setFontFamiliesError(false);
    fetch(`${GOOGLE_FONTS_API_URL}?key=${encodeURIComponent(key)}`)
      .then((res) => res.json())
      .then((data: { items?: { family: string }[] }) => {
        const list = Array.isArray(data?.items)
          ? data.items.map((item) => item.family).filter(Boolean).sort((a, b) => a.localeCompare(b))
          : FALLBACK_FONT_FAMILIES;
        setFontFamilies([defaultLabel, ...list]);
        try {
          sessionStorage.setItem(FONT_LIST_CACHE_KEY, JSON.stringify(list));
        } catch {
          /* ignore */
        }
      })
      .catch(() => {
        setFontFamiliesError(true);
        setFontFamilies([defaultLabel, ...FALLBACK_FONT_FAMILIES]);
      })
      .finally(() => setFontFamiliesLoading(false));
  }, [t]);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setUploading(true);
    try {
      const { url } = await api.uploadFile(token, file);
      setSettings({ ...settings, header_image_url: url });
    } catch {
      /* silent */
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div className="p-4 space-y-0">
      {/* Title */}
      <div className="flex items-center gap-2 mb-5">
        <FontAwesomeIcon icon={faPaintbrush} className="h-4 w-4 text-[var(--muted)]" />
        <span className="text-sm font-semibold">{t("designSection")}</span>
      </div>

      {/* Width */}
      <div className="pb-4">
        <span className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">{t("formWidth")}</span>
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          {WIDTH_OPTIONS.map((opt) => {
            const active = (settings.max_width ?? "lg") === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSettings({ ...settings, max_width: opt.value })}
                title={t(opt.label)}
                className={`px-2.5 py-1.5 text-xs font-semibold transition-colors border-r border-gray-200 dark:border-gray-600 last:border-r-0 ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-transparent text-[var(--muted)] hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {opt.icon}
              </button>
            );
          })}
        </div>
      </div>

      <Divider />

      {/* Columns */}
      <div className="py-4">
        <span className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">{t("columns")}</span>
        <div className="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
          {COLUMN_OPTIONS.map((opt) => {
            const active = (settings.columns ?? 1) === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSettings({ ...settings, columns: opt.value })}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors border-r border-gray-200 dark:border-gray-600 last:border-r-0 ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "bg-transparent text-[var(--muted)] hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <span className="flex gap-px">
                  {Array.from({ length: opt.value }).map((_, i) => (
                    <span
                      key={i}
                      className={`block rounded-sm ${active ? "bg-white/80" : "bg-gray-400"}`}
                      style={{ width: `${12 / opt.value}px`, height: "12px" }}
                    />
                  ))}
                </span>
                {opt.value}
              </button>
            );
          })}
        </div>
      </div>

      <Divider />

      {/* Min height */}
      <div className="py-4">
        <span className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">{t("minHeight")}</span>
        <div className="flex items-center gap-0 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 overflow-hidden h-8">
          <input
            type="number"
            min={0}
            step={50}
            value={settings.min_height ?? 0}
            onChange={(e) => setSettings({ ...settings, min_height: parseInt(e.target.value) || 0 })}
            placeholder={t("minHeightPlaceholder")}
            className="flex-1 min-w-0 px-2.5 py-1 bg-transparent text-xs font-mono outline-none"
          />
          <span className="pr-2.5 text-[10px] text-[var(--muted)] font-mono select-none">px</span>
        </div>
      </div>

      <Divider />

      {/* Text style */}
      <div className="py-4">
        <span className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">{t("textStyle")}</span>
        {[
          { key: "header" as const, labelKey: "textStyleHeader", family: settings.header_font_family, size: settings.header_font_size, setFamily: (v: string | undefined) => setSettings({ ...settings, header_font_family: v || undefined }), setSize: (v: number | undefined) => setSettings({ ...settings, header_font_size: v }) },
          { key: "question" as const, labelKey: "textStyleQuestion", family: settings.question_font_family, size: settings.question_font_size, setFamily: (v: string | undefined) => setSettings({ ...settings, question_font_family: v || undefined }), setSize: (v: number | undefined) => setSettings({ ...settings, question_font_size: v }) },
          { key: "text" as const, labelKey: "textStyleText", family: settings.text_font_family, size: settings.text_font_size, setFamily: (v: string | undefined) => setSettings({ ...settings, text_font_family: v || undefined }), setSize: (v: number | undefined) => setSettings({ ...settings, text_font_size: v }) },
        ].map((row) => (
          <div key={row.key} className="mb-3 last:mb-0">
            <span className="block text-[10px] font-medium text-[var(--muted)] mb-1.5">{t(row.labelKey)}</span>
            <div className="flex gap-2">
              <FontFamilyDropdown
                id={`font-family-${row.key}`}
                options={fontFamiliesLoading ? [t("fontLoading")] : fontFamilies}
                value={row.family ?? undefined}
                onChange={row.setFamily}
                disabled={fontFamiliesLoading}
                defaultLabel={fontFamiliesLoading ? t("fontLoading") : t("fontDefault")}
              />
              <select
                value={row.size !== undefined ? row.size : ""}
                onChange={(e) => { const v = e.target.value; row.setSize(v === "" ? undefined : parseInt(v, 10)); }}
                className="w-16 h-8 pl-2 pr-6 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-xs outline-none appearance-none cursor-pointer"
              >
                <option value="">—</option>
                {FONT_SIZE_OPTIONS.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              <span className="flex items-center text-[10px] text-[var(--muted)] font-mono self-center">px</span>
            </div>
          </div>
        ))}
        {fontFamiliesError && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">{t("fontListError")}</p>
        )}
      </div>

      <Divider />

      {/* Page background */}
      <div className="py-4">
        <ColorPicker
          label={t("pageBackground")}
          value={settings.page_background_color}
          onChange={(v) => setSettings({ ...settings, page_background_color: v })}
          t={t}
        />
      </div>

      <Divider />

      {/* Form background */}
      <div className="py-4">
        <ColorPicker
          label={t("formBackground")}
          value={settings.form_background_color}
          onChange={(v) => setSettings({ ...settings, form_background_color: v })}
          t={t}
        />
      </div>

      <Divider />

      {/* Header image */}
      <div className="py-4">
        <span className="block text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-2">{t("headerSection")}</span>
        {settings.header_image_url ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-[var(--border)]">
              <div
                className="w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${settings.header_image_url})`,
                  height: "80px",
                }}
              />
              <button
                type="button"
                onClick={() => setSettings({ ...settings, header_image_url: undefined })}
                className="absolute top-1 right-1 p-1 rounded-md bg-black/50 hover:bg-black/70 text-white transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={100}
                  max={500}
                  step={10}
                  value={settings.header_height ?? 200}
                  onChange={(e) => setSettings({ ...settings, header_height: parseInt(e.target.value) })}
                  className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-[10px] font-mono text-[var(--muted)] w-10 text-right">{settings.header_height ?? 200}px</span>
              </div>
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-1.5 py-5 rounded-lg border border-dashed cursor-pointer transition-colors ${
              dragOver
                ? "border-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10"
                : "border-gray-200 dark:border-gray-600 hover:border-gray-400"
            }`}
          >
            {uploading ? (
              <div className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            ) : (
              <>
                <svg className="w-6 h-6 text-gray-300 dark:text-gray-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                </svg>
                <span className="text-[11px] text-[var(--muted)]">{t("headerImageUpload")}</span>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={onFileChange}
              className="hidden"
            />
          </div>
        )}
      </div>
    </div>
  );
}
