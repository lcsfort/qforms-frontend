import { collectFieldNodes } from "@renderkit/core";
import type { RenderKitDocument } from "@renderkit/schema";
import {
  type FieldType,
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

/* A premium, paper-on-ivory theme so template documents render with the same
   warm teal/ivory identity as the rest of the product the moment they're used. */
const TEMPLATE_THEME = {
  mode: "light",
  radius: "large",
  spacing: "comfortable",
  colors: {
    primary: "#1F6F66",
    primaryForeground: "#FFFFFF",
    background: "#F7F4ED",
    surface: "#FFFFFF",
    text: "#23201B",
    mutedText: "#6B6358",
    border: "#EFEAE0",
  },
} as const satisfies NonNullable<RenderKitDocument["theme"]>;

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

/* Maps the legacy localized field type onto a renderkit field node type. */
const NODE_TYPE_BY_FIELD: Record<FieldType, string> = {
  text: "textInput",
  textarea: "textarea",
  email: "emailInput",
  number: "numberInput",
  select: "select",
  radio: "radio",
  checkbox: "checkboxGroup",
  date: "dateInput",
  file: "fileUpload",
  rating: "rating",
  scale: "linearScale",
};

type RawTemplateField = {
  type: FieldType;
  label: string;
  placeholder?: string;
  help_text?: string;
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

/* Renderkit node, kept loose so authoring stays terse — the document is
   validated by the runtime (and our template test) before use. */
type TemplateNode = {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  validation?: Record<string, unknown>;
  actions?: Record<string, unknown>;
  children?: TemplateNode[];
};

/* Builds the props for one field node from a localized template field. */
function fieldToNode(id: string, field: RawTemplateField): TemplateNode {
  const nodeType = NODE_TYPE_BY_FIELD[field.type];
  const props: Record<string, unknown> = { label: field.label };
  if (field.placeholder) props.placeholder = field.placeholder;
  if (field.help_text) props.helpText = field.help_text;

  const options = parseOptions(field.options);
  if (options && (field.type === "select" || field.type === "radio" || field.type === "checkbox")) {
    props.options = options.map((o) => ({ label: o.label, value: o.value }));
  }
  if (field.type === "rating") props.max = 5;
  if (field.type === "scale") {
    props.min = 1;
    props.max = 5;
  }

  const node: TemplateNode = { id, type: nodeType, props };
  const validation: Record<string, unknown> = {};
  if (field.required) validation.required = true;
  if (field.type === "email") validation.email = true;
  if (Object.keys(validation).length > 0) node.validation = validation;
  return node;
}

/**
 * Builds a valid RenderKit document from the localized field definitions stored
 * in the messages files (read with t.raw, so labels and options follow the
 * locale). The document's `root` is a page holding the mapped field nodes plus
 * a submit button, themed with the product's ivory/teal identity.
 */
export function buildTemplateSchema(id: TemplateId, rawFields: unknown): RenderKitDocument {
  const fields = Array.isArray(rawFields) ? rawFields.filter(isRawTemplateField) : [];
  const pageId = `${id}-page`;
  const fieldNodes = fields.map((field, index) => fieldToNode(`${id}-f${index + 1}`, field));

  const submitNode: TemplateNode = {
    id: `${id}-submit`,
    type: "button",
    props: { label: "Submit" },
    actions: { onClick: { type: "submit", target: pageId } },
  };

  const document = {
    version: "0.1.0",
    kind: "renderkit.document",
    metadata: { name: id },
    theme: TEMPLATE_THEME,
    root: {
      id: pageId,
      type: "page",
      children: [...fieldNodes, submitNode],
    },
  } as unknown as RenderKitDocument;

  return document;
}

/** Number of value-bearing fields in a template document (excludes the submit button). */
export function templateFieldCount(document: RenderKitDocument): number {
  try {
    return collectFieldNodes(document).length;
  } catch {
    return 0;
  }
}
