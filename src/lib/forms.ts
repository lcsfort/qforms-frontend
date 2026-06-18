import { collectFieldNodes } from "@renderkit/core";
import type { RenderKitDocument } from "@renderkit/schema";

export interface ResponseFieldMeta {
  id: string;
  label: string;
  type: string;
}

/**
 * A minimal, valid, premium starter RenderKit document for a "blank" form. The
 * user refines it further via the AI chat. Passes `validateDocument`.
 */
export function blankFormDocument(title: string): RenderKitDocument {
  return {
    version: "0.1.0",
    kind: "renderkit.document",
    metadata: { name: title },
    theme: {
      mode: "light",
      radius: "large",
      spacing: "comfortable",
      font: "system",
      colors: {
        primary: "#1F6F66",
        primaryForeground: "#FFFFFF",
        background: "#F7F4ED",
        surface: "#FFFFFF",
        text: "#23201B",
        mutedText: "#6B6358",
        border: "#EFEAE0",
      },
      effects: { shadow: "soft" },
    },
    root: {
      id: "page",
      type: "page",
      props: { maxWidth: "640px" },
      appearance: { padding: "lg" },
      children: [
        { id: "heading", type: "heading", props: { text: title, level: 1 } },
        {
          id: "field_1",
          type: "textInput",
          props: { label: "Your answer", placeholder: "Type here…" },
          validation: { required: true },
        },
        {
          id: "submit",
          type: "button",
          props: { label: "Submit", variant: "primary", size: "lg", fullWidth: true },
          interactions: { hover: "lift", focus: "ring", cursor: "pointer" },
          actions: { onClick: { type: "submit", target: "page" } },
        },
      ],
    },
  };
}

/**
 * Walk a stored RenderKit document and return the value-bearing field nodes as
 * `{ id, label, type }`, in document order. `id` is the key used in
 * `FormResponse.data`; `label` falls back to the id when a node has no label.
 * Used to render response tables/columns and behaviour analytics labels.
 */
export function documentResponseFields(
  document: RenderKitDocument | undefined | null,
): ResponseFieldMeta[] {
  if (!document || typeof document !== "object") return [];
  let nodes;
  try {
    nodes = collectFieldNodes(document);
  } catch {
    return [];
  }
  return nodes.map((node) => {
    const label = node.props?.label;
    return {
      id: node.id,
      label: typeof label === "string" && label.trim() ? label : node.id,
      type: node.type,
    };
  });
}
