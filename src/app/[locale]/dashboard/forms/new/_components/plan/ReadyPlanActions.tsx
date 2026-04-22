import { useTranslations } from "next-intl";
import { SparkleIcon } from "@/components/icons/SparkleIcon";

type Props = {
  finalizing: boolean;
  onFinalize: () => void;
  onAddMore: () => void;
  onStartOver: () => void;
};

export function ReadyPlanActions({ finalizing, onFinalize, onAddMore, onStartOver }: Props) {
  const t = useTranslations("forms.generate");

  return (
    <>
      <button
        type="button"
        onClick={onFinalize}
        disabled={finalizing}
        className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] text-white px-5 py-2.5 text-[13.5px] font-medium transition-all hover:bg-[var(--primary-dark)] disabled:opacity-60 disabled:cursor-not-allowed shadow-[0_10px_26px_-10px_rgba(139,92,246,0.55)]"
      >
        {finalizing ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            {t("generating")}
          </>
        ) : (
          <>
            <SparkleIcon className="w-4 h-4" />
            {t("ready.generate")}
          </>
        )}
      </button>
      <button
        type="button"
        onClick={onAddMore}
        disabled={finalizing}
        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[13px] font-medium text-[var(--foreground)] hover:bg-[var(--surface)]/60 transition-colors disabled:opacity-50"
      >
        {t("ready.addMore")}
      </button>
      <button
        type="button"
        onClick={onStartOver}
        disabled={finalizing}
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2.5 text-[12.5px] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors disabled:opacity-50"
      >
        {t("ready.startOver")}
      </button>
    </>
  );
}
