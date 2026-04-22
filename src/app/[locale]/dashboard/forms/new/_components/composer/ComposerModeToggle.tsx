import { useTranslations } from "next-intl";
import type { FormBuildMode } from "@/lib/types";

type Props = {
  mode: FormBuildMode;
  onChange: (mode: FormBuildMode) => void;
};

export function ComposerModeToggle({ mode, onChange }: Props) {
  const t = useTranslations("forms.generate");

  return (
    <div className="flex items-center gap-0.5 rounded-full bg-[var(--surface)]/40 p-0.5">
      <button
        type="button"
        onClick={() => onChange("planning")}
        aria-pressed={mode === "planning"}
        title={t("composer.planHint")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-all ${
          mode === "planning"
            ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm font-medium"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.77 9.77 0 0 1-2.625-.356c-.79.317-1.56.618-2.223.842a.75.75 0 0 1-.972-.879c.165-.601.328-1.207.491-1.813A8.023 8.023 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
        </svg>
        {t("composer.planMode")}
      </button>
      <button
        type="button"
        onClick={() => onChange("straight")}
        aria-pressed={mode === "straight"}
        title={t("composer.directHint")}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] transition-all ${
          mode === "straight"
            ? "bg-[var(--card)] text-[var(--foreground)] shadow-sm font-medium"
            : "text-[var(--muted)] hover:text-[var(--foreground)]"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
        </svg>
        {t("composer.directMode")}
      </button>
    </div>
  );
}
