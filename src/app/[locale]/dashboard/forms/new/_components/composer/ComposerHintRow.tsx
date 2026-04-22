import { useTranslations } from "next-intl";
import type { FormBuildMode } from "@/lib/types";

type Props = {
  mode: FormBuildMode;
  readySchemaPresent: boolean;
  hasPendingQuestions: boolean;
  planSessionActive: boolean;
};

export function ComposerHintRow({
  mode,
  readySchemaPresent,
  hasPendingQuestions,
  planSessionActive,
}: Props) {
  const t = useTranslations("forms.generate");

  const statusText = readySchemaPresent
    ? t("ready.description")
    : hasPendingQuestions
      ? t("conversation.continueIncomplete")
      : planSessionActive && mode === "planning"
        ? t("composer.refineHint")
        : mode === "planning"
          ? t("composer.planHint")
          : t("composer.directHint");

  return (
    <div className="mt-2.5 flex items-center justify-between text-[11px] text-[var(--muted)]/80 px-1">
      <span>{statusText}</span>
      <span className="hidden md:inline">{t("composer.shortcutHint")}</span>
    </div>
  );
}
