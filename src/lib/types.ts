export interface FormFieldOption {
  label: string;
  value: string;
}

export interface FormFieldValidation {
  min_length?: number;
  max_length?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export type FieldType =
  | "text"
  | "textarea"
  | "email"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "file"
  | "rating";

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  placeholder?: string;
  help_text?: string;
  required?: boolean;
  order: number;
  validation?: FormFieldValidation;
  options?: FormFieldOption[];
}

export type FormMaxWidth = "sm" | "md" | "lg" | "xl" | "2xl" | "full";

export interface FormSettings {
  submit_message?: string;
  allow_multiple_submissions?: boolean;
  require_login?: boolean;
  collect_ip?: boolean;
  redirect_url?: string;

  max_width?: FormMaxWidth;
  min_height?: number;
  columns?: 1 | 2 | 3;
  header_image_url?: string;
  header_height?: number;
}

export interface Form {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: "draft" | "published";
  schema: FormField[];
  settings: FormSettings;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: { responses: number };
}

export interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  ip: string | null;
  submittedAt: string;
}

export interface GeneratedFormSchema {
  title: string;
  description: string;
  fields: FormField[];
  settings: FormSettings;
}
