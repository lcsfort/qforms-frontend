import { useTranslations } from "next-intl";

type Props = {
  allSelected: boolean;
  onToggle: () => void;
};

export function SelectAllChip({ allSelected, onToggle }: Props) {
  const t = useTranslations("forms.generate");

  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12.5px] text-[var(--muted)] border border-dashed border-[var(--border)]/70 hover:text-[var(--foreground)] hover:border-[var(--border)] transition-colors"
    >
      {allSelected ? (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
        </svg>
      )}
      {allSelected ? t("planning.clearAll") : t("planning.selectAll")}
    </button>
  );
}
