import { useTranslations } from "next-intl";
import { isNetworkErrorMessage } from "../_lib/errors";

type Props = {
  error: string;
  canRetry: boolean;
  retryDisabled: boolean;
  onRetry: () => void;
  onDismiss: () => void;
};

export function ErrorBanner({ error, canRetry, retryDisabled, onRetry, onDismiss }: Props) {
  const t = useTranslations("forms.generate");

  return (
    <div className="mt-8 flex items-start gap-4">
      <div className="h-8 w-8 shrink-0 rounded-full bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 flex items-center justify-center">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008ZM21.75 12a9.75 9.75 0 1 1-19.5 0 9.75 9.75 0 0 1 19.5 0Z" />
        </svg>
      </div>
      <div className="flex-1 min-w-0 rounded-2xl border border-red-500/25 bg-red-500/[0.06] px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[14px] font-medium text-[var(--foreground)]">
              {t("errorBox.title")}
            </div>
            <div className="mt-1 text-[13px] text-[var(--muted)] leading-relaxed">
              {isNetworkErrorMessage(error)
                ? t("errorBox.descriptionNetwork")
                : t("errorBox.description")}
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={retryDisabled}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--primary)] text-white px-4 py-2 text-[13px] font-medium transition-all hover:bg-[var(--primary-dark)] disabled:bg-[var(--surface)] disabled:text-[var(--muted)] disabled:cursor-not-allowed shadow-[0_8px_22px_-10px_color-mix(in_srgb,var(--primary)_40%,transparent)]"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
              {t("errorBox.retry")}
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-medium text-[var(--foreground)] hover:bg-[var(--surface)]/60 transition-colors"
          >
            {t("errorBox.dismiss")}
          </button>
        </div>
        <details className="mt-3 text-[11.5px] text-[var(--muted)]/80">
          <summary className="cursor-pointer select-none hover:text-[var(--muted)]">
            {t("errorBox.details")}
          </summary>
          <div className="mt-1.5 break-words text-red-500/90 dark:text-red-400/90 font-mono">
            {error}
          </div>
        </details>
      </div>
    </div>
  );
}
