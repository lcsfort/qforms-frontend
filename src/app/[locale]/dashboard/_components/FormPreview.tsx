"use client";

import Image from "next/image";
import { collectFieldNodes } from "@renderkit/core";
import type { RenderKitDocument } from "@renderkit/schema";
import { type FormSettings } from "@/lib/types";

/* The preview mirrors the real form: its page/paper colors, header image, and
   field layout. Ink tones are fixed (not theme vars) because the paper keeps
   the form's own light colors even when the app is in dark mode. */
const PREVIEW_ACCENT = "#1F6F66";

/* A field node distilled to what the thumbnail needs. */
type PreviewFieldData = { id: string; type: string };

function PreviewField({ field }: { field: PreviewFieldData }) {
  const label = <span className="block h-[3px] w-2/5 rounded-full bg-[#23201B]/15" />;

  switch (field.type) {
    case "textarea":
      return (
        <div className="space-y-1">
          {label}
          <span className="block h-6 w-full rounded-[4px] border border-[#23201B]/10 bg-[#23201B]/[0.025]" />
        </div>
      );
    case "select":
    case "multiSelect":
    case "combobox":
    case "dateInput":
    case "dateTimeInput":
    case "timeInput":
      return (
        <div className="space-y-1">
          {label}
          <span className="flex h-3.5 items-center justify-end rounded-[4px] border border-[#23201B]/10 bg-[#23201B]/[0.025] pr-1.5">
            {field.type === "select" || field.type === "multiSelect" || field.type === "combobox" ? (
              <span className="mb-0.5 h-1 w-1 rotate-45 border-b border-r border-[#23201B]/40" />
            ) : (
              <span className="h-1.5 w-1.5 rounded-[2px] border border-[#23201B]/30" />
            )}
          </span>
        </div>
      );
    case "radio":
    case "checkbox":
    case "checkboxGroup":
    case "yesNo": {
      const shape = field.type === "radio" || field.type === "yesNo" ? "rounded-full" : "rounded-[2px]";
      return (
        <div className="space-y-1">
          {label}
          {[0, 1].map((i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className={`h-2 w-2 shrink-0 border border-[#23201B]/30 ${shape}`} />
              <span className={`block h-[3px] rounded-full bg-[#23201B]/12 ${i ? "w-1/3" : "w-1/2"}`} />
            </span>
          ))}
        </div>
      );
    }
    case "rating":
    case "nps":
      return (
        <div className="space-y-1.5">
          {label}
          <span className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <span key={i} className="h-2 w-2 rounded-full bg-[#B5862F]/45" />
            ))}
          </span>
        </div>
      );
    case "linearScale":
    case "slider":
      return (
        <div className="space-y-1.5">
          {label}
          <span className="flex gap-[3px]">
            {Array.from({ length: 7 }).map((_, i) => (
              <span key={i} className="h-2.5 w-3 rounded-[3px] border border-[#23201B]/15 bg-[#23201B]/[0.03]" />
            ))}
          </span>
        </div>
      );
    case "fileUpload":
    case "imageUpload":
    case "signaturePad":
      return (
        <div className="space-y-1">
          {label}
          <span className="block h-5 w-full rounded-[4px] border border-dashed border-[#23201B]/20" />
        </div>
      );
    default: // textInput, emailInput, numberInput, phoneInput, urlInput, etc.
      return (
        <div className="space-y-1">
          {label}
          <span className="block h-3.5 w-full rounded-[4px] border border-[#23201B]/10 bg-[#23201B]/[0.025]" />
        </div>
      );
  }
}

type FormPreviewProps = {
  title: string;
  description?: string | null;
  schema: RenderKitDocument;
  settings?: FormSettings;
  className?: string;
};

/** Reads the value-bearing field nodes from a document for the thumbnail. */
function previewFields(schema: RenderKitDocument | undefined | null): PreviewFieldData[] {
  if (!schema || typeof schema !== "object") return [];
  try {
    return collectFieldNodes(schema).map((node) => ({ id: node.id, type: node.type }));
  } catch {
    return [];
  }
}

export function FormPreview({ title, description, schema, settings, className = "h-36" }: FormPreviewProps) {
  const pageBg = settings?.page_background_color ?? "#F7F4ED";
  const paperBg = settings?.form_background_color ?? "#FFFDF8";
  const twoColumns = (settings?.columns ?? 1) > 1;
  const fields = previewFields(schema).slice(0, twoColumns ? 6 : 4);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden rounded-[14px] border border-[var(--border)]/70 ${className}`}
      style={{ backgroundColor: pageBg }}
    >
      <div
        className="mx-auto mt-3.5 min-h-[150px] w-[76%] rounded-t-[7px] border border-b-0 border-[#23201B]/10 px-3 pb-3 pt-2.5 shadow-[0_1px_10px_rgba(35,32,27,0.08)]"
        style={{ backgroundColor: paperBg }}
      >
        {settings?.header_image_url && (
          <span className="relative mb-2 block h-7 w-full overflow-hidden rounded-[4px]">
            <Image src={settings.header_image_url} alt="" fill unoptimized className="object-cover" />
          </span>
        )}
        <p className="truncate text-[8.5px] font-semibold leading-tight text-[#23201B]/85">{title}</p>
        {description ? <span className="mt-1 block h-[3px] w-3/5 rounded-full bg-[#23201B]/12" /> : null}
        {fields.length > 0 ? (
          <div className={twoColumns ? "mt-2.5 grid grid-cols-2 gap-x-2.5 gap-y-2" : "mt-2.5 space-y-2"}>
            {fields.map((field) => (
              <PreviewField key={field.id} field={field} />
            ))}
          </div>
        ) : (
          <div className="mt-2.5 space-y-2">
            <span className="block h-3.5 w-full rounded-[4px] border border-dashed border-[#23201B]/15" />
            <span className="block h-3.5 w-full rounded-[4px] border border-dashed border-[#23201B]/10" />
          </div>
        )}
        <span className="mt-2.5 block h-3.5 w-12 rounded-[5px]" style={{ backgroundColor: PREVIEW_ACCENT }} />
      </div>
    </div>
  );
}
