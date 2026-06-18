import { useTranslations } from "next-intl";
import type { RenderKitDocument } from "@/lib/types";
import type { CapturedDetail } from "../../_lib/types";
import { PreviewEmptyState } from "./PreviewEmptyState";
import { PreviewRequest } from "./PreviewRequest";
import { PreviewCapturedDetails } from "./PreviewCapturedDetails";
import { PreviewReadyCard } from "./PreviewReadyCard";
import { PreviewGeneratingCard } from "./PreviewGeneratingCard";

export type PreviewView =
  | { kind: "empty" }
  | {
      kind: "active";
      prompt: string;
      capturedDetails: CapturedDetail[];
      readyDocument: RenderKitDocument | null;
      finalizing: boolean;
    };

type Props = {
  view: PreviewView;
};

export function PreviewSidebar({ view }: Props) {
  const t = useTranslations("forms.generate");

  return (
    <aside className="hidden xl:flex flex-col w-[380px] shrink-0 border-l border-[var(--border)]/50 bg-[var(--surface)]/20 overflow-y-auto dashboard-main-scroll">
      <div className="px-7 py-10 space-y-7">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--muted)] mb-2">
            {t("preview.eyebrow")}
          </div>
          <h3 className="text-[17px] font-semibold tracking-tight text-[var(--foreground)]">
            {t("preview.title")}
          </h3>
        </div>

        {view.kind === "empty" && <PreviewEmptyState />}

        {view.kind === "active" && (
          <>
            {view.prompt && <PreviewRequest prompt={view.prompt} />}
            <PreviewCapturedDetails details={view.capturedDetails} />
            {view.readyDocument && !view.finalizing && (
              <PreviewReadyCard document={view.readyDocument} />
            )}
            {view.finalizing && view.prompt && <PreviewGeneratingCard />}
          </>
        )}
      </div>
    </aside>
  );
}
