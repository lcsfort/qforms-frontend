import { useTranslations } from "next-intl";
import type { GeneratedFormSchema } from "@/lib/types";
import { AssistantAvatar } from "./icons/AssistantAvatar";
import { ReadyPlanCard } from "./plan/ReadyPlanCard";

type Props = {
  schema: GeneratedFormSchema;
};

export function PlanSnapshotMessage({ schema }: Props) {
  const t = useTranslations("forms.generate");

  return (
    <div className="flex items-start gap-4">
      <AssistantAvatar />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-[var(--muted)] mb-1.5">
          {t("conversation.assistant")}
        </div>
        <ReadyPlanCard schema={schema} variant="snapshot" />
      </div>
    </div>
  );
}
