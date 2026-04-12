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
  | "rating"
  | "scale";

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

export type FormMaxWidth = "mobile" | "tablet" | "desktop";

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
  page_background_color?: string;
  form_background_color?: string;

  header_font_family?: string;
  header_font_size?: number;
  question_font_family?: string;
  question_font_size?: number;
  text_font_family?: string;
  text_font_size?: number;
}

export interface FormVersionSnapshot {
  title: string;
  description: string | null;
  schema: FormField[];
  settings: FormSettings;
  savedAt: string;
}

export interface Form {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: "draft" | "published";
  schema: FormField[];
  settings: FormSettings;
  versions?: FormVersionSnapshot[];
  version_cursor?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: { responses: number };
}

export type FormListSort = "recent" | "oldest" | "title";
export type FormListStatus = "all" | "draft" | "published";

export interface ListFormsParams {
  cursor?: number;
  limit?: number;
  sort?: FormListSort;
  status?: FormListStatus;
  query?: string;
}

export interface ListFormsResponse {
  items: Form[];
  nextCursor: number | null;
  hasMore: boolean;
  totalCount: number;
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

export type FormBuildMode = "planning" | "straight";

export interface FormPlanQuestion {
  id: string;
  question: string;
  placeholder?: string;
  options?: string[];
}

export interface FormPlanQuestionsResponse {
  status: "questions_needed";
  sessionId: string;
  summary: string;
  questions: FormPlanQuestion[];
}

export interface FormPlanReadyResponse {
  status: "ready";
  sessionId: string;
  schema: GeneratedFormSchema;
}

export type FormPlanResponse = FormPlanQuestionsResponse | FormPlanReadyResponse;

export interface BehaviorFunnelStep {
  step: "open" | "start" | "submit";
  count: number;
}

export interface BehaviorFieldStat {
  fieldId: string;
  averageTimeMs: number;
  medianTimeMs: number;
  edits: number;
  dropOffs: number;
}

export interface BehaviorBreakdownItem {
  label: string;
  count: number;
}

export interface FormBehaviorAnalytics {
  overview: {
    totalSessions: number;
    startedSessions: number;
    submittedSessions: number;
    completionRate: number;
    averageCompletionMs: number;
    medianCompletionMs: number;
  };
  funnel: BehaviorFunnelStep[];
  fields: BehaviorFieldStat[];
  deviceBreakdown: BehaviorBreakdownItem[];
  localeBreakdown: BehaviorBreakdownItem[];
}
