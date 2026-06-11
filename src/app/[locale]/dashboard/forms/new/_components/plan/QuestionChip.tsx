type Props = {
  label: string;
  selected: boolean;
  onClick: () => void;
};

export function QuestionChip({ label, selected, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`px-3 py-1.5 rounded-full text-[13px] transition-all ${
        selected
          ? "bg-[var(--primary)] text-white shadow-[0_4px_12px_-4px_color-mix(in_srgb,var(--primary)_40%,transparent)]"
          : "bg-[var(--surface)]/60 text-[var(--foreground)] hover:bg-[var(--surface)]"
      }`}
    >
      {label}
    </button>
  );
}
