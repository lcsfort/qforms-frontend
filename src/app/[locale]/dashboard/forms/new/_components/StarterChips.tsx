import { useTranslations } from "next-intl";
import { SparkleIcon } from "@/components/icons/SparkleIcon";

type Props = {
  onPick: (text: string) => void;
};

const STARTER_IDS = ["csat", "event", "lead", "job", "booking"] as const;

export function StarterChips({ onPick }: Props) {
  const t = useTranslations("forms.generate");
  const starters = STARTER_IDS.map((id) => ({ id, label: t(`starters.${id}`) }));

  return (
    <div className="mt-8 ml-12">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-[var(--muted)] mb-3">
        {t("starters.label")}
      </div>
      <div className="flex flex-wrap gap-2">
        {starters.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onPick(s.label)}
            className="group inline-flex items-center gap-2 rounded-full border border-[var(--border)]/70 bg-[var(--card)]/60 px-3.5 py-1.5 text-[13px] text-[var(--foreground)] transition-all hover:border-[var(--primary)]/40 hover:bg-[var(--card)] hover:shadow-[0_4px_16px_-8px_color-mix(in_srgb,var(--primary)_40%,transparent)]"
          >
            <SparkleIcon className="w-3 h-3 text-[var(--primary)] opacity-70 group-hover:opacity-100" />
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
