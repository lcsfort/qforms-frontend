"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createForm } from "@/lib/redux/formsSlice";
import { useAppDispatch } from "@/lib/redux/hooks";
import { type FormSettings, type RenderKitDocument } from "@/lib/types";
import { type TemplateId } from "./templates";

export type TemplatePayload = {
  title: string;
  description: string;
  schema: RenderKitDocument;
  settings: FormSettings;
};

/** Creates a real form from a template definition and opens it in the editor. */
export function useTemplateCreator() {
  const t = useTranslations("dashboard.templates");
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [creatingId, setCreatingId] = useState<TemplateId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const createFromTemplate = async (id: TemplateId, payload: TemplatePayload) => {
    if (creatingId) return;
    setError(null);
    setCreatingId(id);
    try {
      const form = await dispatch(
        createForm({
          title: payload.title,
          description: payload.description,
          schema: payload.schema as unknown as Record<string, unknown>,
          settings: payload.settings as unknown as Record<string, unknown>,
        }),
      ).unwrap();
      router.push(`/dashboard/forms/${form.id}`);
    } catch {
      setError(t("createError"));
    } finally {
      setCreatingId(null);
    }
  };

  return { creatingId, error, createFromTemplate };
}
