"use client";

import { useRef, useState, useEffect, type DragEvent, type ChangeEvent } from "react";
import { api } from "@/lib/api";
import type { FormSettings, FormMaxWidth } from "@/lib/types";

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
        <svg className="w-4 h-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
        </svg>
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
