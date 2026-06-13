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

export type FormPublishingMode = "now" | "scheduled";

export interface FormPublishingSettings {
  mode?: FormPublishingMode;
  scheduledPublishAt?: string | null;
  timezone?: string;
}

export type FormAccessMode = "public" | "domains";

export interface FormAccessSettings {
  mode?: FormAccessMode;
  allowedDomains?: string[];
}

export interface FormNotificationSettings {
  emailOnResponse?: boolean;
}

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

  publishing?: FormPublishingSettings;
  access?: FormAccessSettings;
  notifications?: FormNotificationSettings;
}

export interface FormVersionSnapshot {
  title: string;
  description: string | null;
  schema: FormField[];
  settings: FormSettings;
  savedAt: string;
}

export interface FormPlanSessionRef {
  id: string;
  updatedAt: string;
}

/** Real aggregates returned with GET /forms list items only. */
export interface FormListStats {
  lastResponseAt: string | null;
  /** Distinct behavior sessions (approx. form opens / visits). */
  viewCount: number;
  /** % of sessions that reached submit_success after form_start; null if no starts. */
  completionRate: number | null;
  startedSessions: number;
  submittedSessions: number;
  integrationsActive: boolean;
}

export function defaultFormListStats(): FormListStats {
  return {
    lastResponseAt: null,
    viewCount: 0,
    completionRate: null,
    startedSessions: 0,
    submittedSessions: 0,
    integrationsActive: false,
  };
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
  scheduledPublishAt?: string | null;
  createdBy: string;
  /** Present on API forms for tenancy (optional for older cached payloads). */
  workspaceId?: string;
  createdAt: string;
  updatedAt: string;
  _count?: { responses: number };
  planSession?: FormPlanSessionRef | null;
  listStats?: FormListStats;
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
  responsesThisMonth: number;
  bestCompletionRate: number | null;
}

export interface FormResponse {
  id: string;
  formId: string;
  data: Record<string, unknown>;
  ip: string | null;
  submittedAt: string;
}

// --- Dashboard insights (needs attention + latest responses, computed across all forms) ---

export type AttentionKind = "lowCompletion" | "noResponses" | "draftIdle";

/** Slim form projection returned with the dashboard rails. */
export interface DashboardFormRef {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published";
}

export interface DashboardAttentionApiItem {
  form: DashboardFormRef;
  kind: AttentionKind;
  /** lowCompletion → completion %, noResponses → view count, draftIdle → idle days. */
  metric: number | null;
}

export interface DashboardLatestApiItem {
  form: Omit<DashboardFormRef, "status">;
  lastResponseAt: string;
}

export interface DashboardInsightsResponse {
  attention: {
    items: DashboardAttentionApiItem[];
    totalCount: number;
  };
  latest: DashboardLatestApiItem[];
}

/** Attention thresholds + paging passed to GET /forms/dashboard-insights. */
export interface DashboardInsightsParams {
  lowCompletionEnabled: boolean;
  lowCompletionThreshold: number;
  minSessions: number;
  noResponsesEnabled: boolean;
  minViews: number;
  draftIdleEnabled: boolean;
  draftIdleDays: number;
  attentionLimit?: number;
  full?: boolean;
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
  multi_select?: boolean;
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

export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant";
  kind: "text" | "snapshot";
  content?: string;
  schema?: GeneratedFormSchema;
}

export interface StoredPlanSessionLinkedForm {
  id: string;
  title: string;
  description: string | null;
  schema: FormField[];
  settings: FormSettings;
  slug: string;
  status: "draft" | "published";
  updatedAt: string;
}

export interface StoredPlanQaEntry {
  questionId: string;
  question: string;
  answer: string | null;
}

export interface StoredPlanSession {
  id: string;
  userId: string;
  originalPrompt: string;
  qaHistory: StoredPlanQaEntry[];
  status: "active" | "completed";
  title: string | null;
  chatMessages: StoredChatMessage[];
  readySchema: GeneratedFormSchema | null;
  formId: string | null;
  lastSyncedFormUpdatedAt: string | null;
  createdAt: string;
  updatedAt: string;
  form?: StoredPlanSessionLinkedForm | null;
}

export interface PlanSessionSummary {
  id: string;
  title: string | null;
  originalPrompt: string;
  status: "active" | "completed";
  formId: string | null;
  updatedAt: string;
  createdAt: string;
  form: { id: string; title: string; slug: string } | null;
}

export interface ListPlanSessionsResponse {
  items: PlanSessionSummary[];
  nextCursor: number | null;
  hasMore: boolean;
  totalCount: number;
}

export interface ListPlanSessionsParams {
  cursor?: number;
  limit?: number;
}

export interface UpdatePlanSessionPayload {
  chatMessages?: StoredChatMessage[];
  readySchema?: GeneratedFormSchema | null;
  title?: string;
}

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

// --- Workspaces & pipeline ---

export type WorkspaceRole = "owner" | "admin" | "member";

export interface WorkspaceSummary {
  id: string;
  name: string;
  slug: string;
  role: WorkspaceRole;
  createdAt: string;
}

export interface WorkspaceMemberRow {
  id: string;
  userId: string;
  role: WorkspaceRole;
  user: {
    id: string;
    email: string;
    name: string | null;
    avatarUrl?: string | null;
    googleAvatarUrl?: string | null;
  };
}

export interface WorkspaceInvite {
  id: string;
  workspaceId: string;
  email: string;
  token: string;
  role: WorkspaceRole;
  expiresAt: string;
  createdAt: string;
}

export type AuditAction =
  | "WORKSPACE_CREATED"
  | "MEMBER_ROLE_UPDATED"
  | "MEMBER_REMOVED"
  | "INVITE_CREATED"
  | "INVITE_CANCELLED"
  | "INVITE_ACCEPTED"
  | "FORM_CREATED"
  | "FORM_UPDATED"
  | "FORM_PUBLISHED"
  | "FORM_UNPUBLISHED"
  | "FORM_DELETED";

export interface AuditLogActor {
  id: string;
  name: string | null;
  email: string;
  avatarUrl?: string | null;
  googleAvatarUrl?: string | null;
}

export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  actorId: string | null;
  action: AuditAction | string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor: AuditLogActor | null;
}

export interface AuditLogResponse {
  items: AuditLogEntry[];
  nextCursor: number | null;
  hasMore: boolean;
  totalCount: number;
}

export interface PipelineStage {
  id: string;
  formPipelineId: string;
  name: string;
  slug: string;
  color: string | null;
  position: number;
  isDefault: boolean;
  isTerminal: boolean;
}

export interface FormPipelineConfig {
  id?: string;
  formId?: string;
  isEnabled: boolean;
  stages: PipelineStage[];
}

export interface PipelineBoardPayload {
  pipeline: FormPipelineConfig | null;
  stages: Array<
    PipelineStage & {
      responses: FormResponse[];
    }
  >;
  members: Array<{
    userId: string;
    user: WorkspaceMemberRow["user"];
  }>;
}

