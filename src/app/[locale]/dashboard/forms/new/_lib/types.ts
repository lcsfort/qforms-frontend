import type { FormBuildMode, GeneratedFormSchema } from "@/lib/types";

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
      baseSchema: GeneratedFormSchema;
      originalPrompt: string;
    }
  | { kind: "continue"; answers: Record<string, string> }
  | { kind: "finalize"; schema: GeneratedFormSchema };
