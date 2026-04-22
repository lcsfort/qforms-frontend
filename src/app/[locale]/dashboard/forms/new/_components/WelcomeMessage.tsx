import { useTranslations } from "next-intl";
import { AssistantAvatar } from "./icons/AssistantAvatar";

export function WelcomeMessage() {
  const t = useTranslations("forms.generate");

  return (
    <div className="flex items-start gap-4 mb-2">
      <AssistantAvatar />
      <div className="flex-1 min-w-0 pt-0.5">
        <div className="text-[12px] font-medium text-[var(--muted)] mb-1.5">
          {t("conversation.assistant")}
        </div>
        <div className="text-[15px] leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">
          {t("welcome")}
        </div>
      </div>
    </div>
  );
}
