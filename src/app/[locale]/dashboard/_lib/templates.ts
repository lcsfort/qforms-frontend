import {
  type FieldType,
  type FormField,
  type FormFieldOption,
  type FormSettings,
} from "@/lib/types";

export const TEMPLATE_IDS = [
  "lead",
  "feedback",
  "event",
  "booking",
  "job",
  "contact",
  "survey",
  "onboarding",
] as const;

export type TemplateId = (typeof TEMPLATE_IDS)[number];

/** Templates shown on the dashboard home strip. */
export const FEATURED_TEMPLATE_IDS: TemplateId[] = ["lead", "feedback", "event", "booking"];

/* Each template ships with a soft, distinct page tint so previews are
   recognizable at a glance and new forms start with a styled canvas. */
export const TEMPLATE_SETTINGS: Record<TemplateId, FormSettings> = {
  lead: { page_background_color: "#EFF3EC", form_background_color: "#FFFDF8" },
  feedback: { page_background_color: "#F6EFE7", form_background_color: "#FFFDF8" },
  event: { page_background_color: "#EDF1F2", form_background_color: "#FFFDF8" },
  booking: { page_background_color: "#F6F1E2", form_background_color: "#FFFDF8" },
  job: { page_background_color: "#F1EFEA", form_background_color: "#FFFDF8" },
  contact: { page_background_color: "#F7F4ED", form_background_color: "#FFFDF8" },
  survey: { page_background_color: "#EFF0EB", form_background_color: "#FFFDF8" },
  onboarding: { page_background_color: "#F6EEEA", form_background_color: "#FFFDF8" },
};

const FIELD_TYPES: ReadonlySet<string> = new Set([
  "text",
  "textarea",
  "email",
  "number",
  "select",
  "radio",
  "checkbox",
  "date",
  "file",
  "rating",
  "scale",
] satisfies FieldType[]);

type RawTemplateField = {
  type: FieldType;
  label: string;
  required?: boolean;
  options?: FormFieldOption[];
};

function parseOptions(value: unknown): FormFieldOption[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const options = value.filter(
    (option): option is FormFieldOption =>
      typeof option === "object" &&
      option !== null &&
      typeof (option as FormFieldOption).label === "string" &&
      typeof (option as FormFieldOption).value === "string",
  );
  return options.length > 0 ? options : undefined;
}

function isRawTemplateField(value: unknown): value is RawTemplateField {
  if (typeof value !== "object" || value === null) return false;
  const field = value as Record<string, unknown>;
  return typeof field.type === "string" && FIELD_TYPES.has(field.type) && typeof field.label === "string";
}

/**
 * Builds a real form schema from the localized field definitions stored in the
 * messages files (read with t.raw, so labels and options follow the locale).
 */
export function buildTemplateSchema(id: TemplateId, rawFields: unknown): FormField[] {
  if (!Array.isArray(rawFields)) return [];
  return rawFields.filter(isRawTemplateField).map((field, index) => ({
    id: `${id}-f${index + 1}`,
    type: field.type,
    label: field.label,
    required: Boolean(field.required),
    order: index + 1,
    options: parseOptions(field.options),
  }));
}
