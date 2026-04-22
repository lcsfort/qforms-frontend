import type {
  Form,
  GeneratedFormSchema,
  StoredPlanSessionLinkedForm,
} from "./types";

type FormLike = Pick<
  Form | StoredPlanSessionLinkedForm,
  "title" | "description" | "schema" | "settings"
>;

export function formToGeneratedSchema(form: FormLike): GeneratedFormSchema {
  return {
    title: form.title ?? "",
    description: form.description ?? "",
    fields: Array.isArray(form.schema) ? form.schema : [],
    settings: (form.settings ?? {}) as GeneratedFormSchema["settings"],
  };
}
