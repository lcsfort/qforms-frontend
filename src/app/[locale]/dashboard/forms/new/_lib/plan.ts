import type { FormField, FormPlanQuestion, GeneratedFormSchema } from "@/lib/types";

export function getQuestionOptions(question: FormPlanQuestion): string[] {
  const fromBackend = Array.isArray(question.options)
    ? question.options
        .map((opt) => opt.trim())
        .filter((opt) => opt.length > 0)
        .slice(0, 6)
    : [];
  if (fromBackend.length > 0) return fromBackend;

  const exampleMatch = question.question.match(/\((?:Ex|ex)\s*:\s*([^)]+)\)/);
  if (!exampleMatch) return [];
  const parsed = exampleMatch[1]
    .split(",")
    .map((opt) => opt.trim())
    .filter((opt) => opt.length > 1 && opt.toLowerCase() !== "etc.");
  return Array.from(new Set(parsed)).slice(0, 6);
}

export function resolveAnswer(
  question: FormPlanQuestion,
  selected: string[],
  other: string,
): string {
  const trimmedOther = other.trim();
  if (question.multi_select) {
    const combined = trimmedOther.length > 0 ? [...selected, trimmedOther] : selected;
    return combined
      .map((value) => value.trim())
      .filter((value) => value.length > 0)
      .join(", ");
  }
  if (trimmedOther.length > 0) return trimmedOther;
  return (selected[0] ?? "").trim();
}

export const URL_PROMPT_LOCK_KEY = "qforms_url_prompt_lock";

/**
 * Builds a bootstrap prompt used to seed a plan session from an existing
 * (typically direct-mode) draft schema plus a user-provided refinement.
 *
 * The backend only iterates on forms through plan sessions; when the user
 * clicks "Add more details" on a direct-mode ready schema we don't have a
 * sessionId yet, so we start one with a prompt that makes the planner treat
 * the next request as an edit to the existing draft rather than a brand-new
 * form generated from just the refinement text.
 */
export function buildRefinementBootstrapPrompt(
  originalPrompt: string,
  schema: GeneratedFormSchema,
  refinement: string,
): string {
  const title = schema.title?.trim() || "Untitled form";
  const description = schema.description?.trim() ?? "";

  const fieldLines = [...schema.fields]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((field, index) => describeFieldForPrompt(field as FormField, index));

  const sections: string[] = [];

  if (originalPrompt.trim().length > 0) {
    sections.push(`Original request from the user:\n"""${originalPrompt.trim()}"""`);
  }

  const draftLines = [
    `Title: ${title}`,
    description ? `Description: ${description}` : null,
    "Fields:",
    ...fieldLines.map((line) => `  ${line}`),
  ].filter(Boolean) as string[];
  sections.push(`Draft we already agreed on:\n${draftLines.join("\n")}`);

  sections.push(
    [
      "The user now wants to iterate on this draft with the following adjustment:",
      `"""${refinement.trim()}"""`,
      "Apply the adjustment while preserving every other field, setting, label, and ordering from the draft above unless the adjustment explicitly implies otherwise. Do not start over.",
    ].join("\n"),
  );

  return sections.join("\n\n");
}

function describeFieldForPrompt(field: FormField, index: number): string {
  const label = field.label?.trim() || `Field ${index + 1}`;
  const required = field.required === true ? "required" : "optional";
  const parts = [`${index + 1}. ${label} — ${field.type}, ${required}`];

  const rawOptions = Array.isArray(field.options) ? field.options : [];
  const options = rawOptions
    .map((opt) => (opt?.label ?? opt?.value ?? "").trim())
    .filter((opt) => opt.length > 0);

  if (options.length > 0) {
    parts.push(`options: ${options.join(", ")}`);
  }
  if (field.help_text && field.help_text.trim().length > 0) {
    parts.push(`help: ${field.help_text.trim()}`);
  }
  return parts.join(" | ");
}
