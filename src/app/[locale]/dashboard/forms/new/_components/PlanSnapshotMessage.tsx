import { useTranslations } from "next-intl";
import type { RenderKitDocument } from "@/lib/types";
import { AssistantAvatar } from "./icons/AssistantAvatar";
import { ReadyPlanCard } from "./plan/ReadyPlanCard";

type Props = {
  document: RenderKitDocument;
};

export function PlanSnapshotMessage({ document }: Props) {
  const t = useTranslations("forms.generate");

  return (
    <div className="flex items-start gap-4">
      <AssistantAvatar />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium text-[var(--muted)] mb-1.5">
          {t("conversation.assistant")}
        </div>
        <ReadyPlanCard document={document} variant="snapshot" />
      </div>
    </div>
  );
}
