import type { FormBuildMode, RenderKitDocument } from "@/lib/types";

export type CapturedDetail = {
  question: string;
  answer: string;
};

export type RetryTask =
  | { kind: "generate"; text: string; mode: FormBuildMode }
  | { kind: "refine"; text: string }
  | {
      kind: "bootstrapRefine";
      text: string;
      baseDocument: RenderKitDocument;
      originalPrompt: string;
    }
  | { kind: "continue"; answers: Record<string, string> }
  | { kind: "finalize"; document: RenderKitDocument };
