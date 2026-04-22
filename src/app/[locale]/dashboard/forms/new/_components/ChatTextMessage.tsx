import { useTranslations } from "next-intl";
import { AssistantAvatar } from "./icons/AssistantAvatar";
import { UserAvatar } from "./UserAvatar";

type Props = {
  role: "user" | "assistant";
  content: string;
  avatarUrl: string | null;
  initials: string;
};

export function ChatTextMessage({ role, content, avatarUrl, initials }: Props) {
  const t = useTranslations("forms.generate");

  if (role === "assistant") {
    return (
      <div className="flex items-start gap-4">
        <AssistantAvatar />
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="text-[12px] font-medium text-[var(--muted)] mb-1.5">
            {t("conversation.assistant")}
          </div>
          <div className="text-[15px] leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start justify-end gap-3">
      <div className="flex flex-col items-end max-w-[82%] min-w-0">
        <div className="text-[12px] font-medium text-[var(--muted)] mb-1.5 pr-1">
          {t("conversation.you")}
        </div>
        <div className="rounded-2xl rounded-tr-md bg-[var(--primary)]/12 border border-[var(--primary)]/15 px-4 py-2.5 text-[15px] leading-relaxed text-[var(--foreground)] whitespace-pre-wrap">
          {content}
        </div>
      </div>
      <UserAvatar avatarUrl={avatarUrl} initials={initials} />
    </div>
  );
}
