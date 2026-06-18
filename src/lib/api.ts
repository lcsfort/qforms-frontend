import type {
  DashboardInsightsParams,
  DashboardInsightsResponse,
  FormBehaviorAnalytics,
  Form,
  FormPipelineConfig,
  ListFormsParams,
  ListFormsResponse,
  FormPlanResponse,
  FormPlanReadyResponse,
  FormResponse,
  ListPlanSessionsParams,
  ListPlanSessionsResponse,
  PipelineBoardPayload,
  StoredPlanSession,
  UpdatePlanSessionPayload,
  AuditLogResponse,
  WorkspaceInvite,
  WorkspaceMemberRow,
  WorkspaceSummary,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const ACTIVE_WORKSPACE_KEY = "activeWorkspaceId";

/** Active workspace id persisted for API `X-Workspace-Id` header. */
export function getActiveWorkspaceId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_WORKSPACE_KEY);
}

export function setActiveWorkspaceIdStorage(id: string | null) {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  else localStorage.removeItem(ACTIVE_WORKSPACE_KEY);
}

function bearer(token: string): Record<string, string> {
  const ws = getActiveWorkspaceId();
  return {
    Authorization: `Bearer ${token}`,
    ...(ws ? { "X-Workspace-Id": ws } : {}),
  };
}

function getLocale(): string {
  try {
    if (typeof window === "undefined" || typeof document === "undefined")
      return "en";
    const w = window as Window & { location?: { pathname?: string } };
    if (!w.location || typeof w.location.pathname !== "string") return "en";
    const pathname = w.location.pathname;
    if (pathname.startsWith("/pt")) return "pt";
    if (pathname.startsWith("/en")) return "en";
    const lang = document.documentElement?.lang;
    return lang === "pt" ? "pt" : "en";
  } catch {
    return "en";
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const locale = getLocale();
  const { headers: optionsHeaders, ...restOptions } = options;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      ...restOptions,
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
        "X-Locale": locale,
        ...(optionsHeaders as Record<string, string>),
      },
    });
  } catch (err: unknown) {
    const isFailedFetch =
      err instanceof TypeError &&
      (err.message === "Failed to fetch" ||
        err.message.includes("fetch") ||
        err.message.includes("NetworkError"));
    const hint = isFailedFetch
      ? ` Cannot reach ${API_URL}. Start the backend (e.g. npm run start:dev in backend), set NEXT_PUBLIC_API_URL if needed, and ensure FRONTEND_URL on the API matches this origin (CORS).`
      : "";
    throw new Error(
      `${err instanceof Error ? err.message : "Network error"}.${hint}`,
    );
  }

  const data = await res.json();

  if (!res.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;
    const err = new Error(message ?? "Something went wrong") as Error & {
      status?: number;
      response?: Record<string, unknown>;
    };
    err.status = res.status;
    err.response = data as Record<string, unknown>;
    throw err;
  }

  return data as T;
}

type AuthProvider = "local" | "google";

interface AuthProfile {
  id: string;
  email: string;
  name: string | null;
  isEmailVerified: boolean;
  createdAt: string;
  authProvider?: AuthProvider;
  avatarUrl?: string | null;
  googleAvatarUrl?: string | null;
}

export const api = {
  signup: (data: {
    email: string;
    password: string;
    name?: string;
    locale?: string;
  }) =>
    request<{ message: string }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  signin: (data: { email: string; password: string }) =>
    request<{
      accessToken: string;
      user: AuthProfile;
    }>("/auth/signin", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyEmail: (token: string) =>
    request<{ message: string }>(`/auth/verify-email?token=${token}`),

  requestPasswordReset: (data: { email: string; locale?: string }) =>
    request<{ message: string }>("/auth/request-password-reset", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  resetPassword: (data: { token: string; newPassword: string }) =>
    request<{ message: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getProfile: (token: string) =>
    request<AuthProfile>("/auth/profile", {
      headers: bearer(token),
    }),

  updateName: (token: string, data: { name: string }) =>
    request<AuthProfile>("/auth/profile/name", {
      method: "PATCH",
      headers: bearer(token),
      body: JSON.stringify(data),
    }),

  updateAvatar: (token: string, data: { avatarUrl: string | null }) =>
    request<AuthProfile>("/auth/profile/avatar", {
      method: "PATCH",
      headers: bearer(token),
      body: JSON.stringify(data),
    }),

  changePassword: (
    token: string,
    data: { currentPassword: string; newPassword: string },
  ) =>
    request<{ message: string }>("/auth/profile/change-password", {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify(data),
    }),

  // --- Forms ---

  listForms: (token: string, params?: ListFormsParams) => {
    const searchParams = new URLSearchParams();
    if (typeof params?.cursor === "number") searchParams.set("cursor", String(params.cursor));
    if (typeof params?.limit === "number") searchParams.set("limit", String(params.limit));
    if (params?.sort) searchParams.set("sort", params.sort);
    if (params?.status) searchParams.set("status", params.status);
    if (params?.query && params.query.trim()) searchParams.set("query", params.query.trim());
    const query = searchParams.toString();
    return request<ListFormsResponse>(`/forms${query ? `?${query}` : ""}`, {
      headers: bearer(token),
    });
  },

  getDashboardInsights: (token: string, params: DashboardInsightsParams) => {
    const searchParams = new URLSearchParams();
    // Booleans must be explicit "true"/"false" strings — the backend coerces them per value.
    searchParams.set("lowCompletionEnabled", String(params.lowCompletionEnabled));
    searchParams.set("lowCompletionThreshold", String(params.lowCompletionThreshold));
    searchParams.set("minSessions", String(params.minSessions));
    searchParams.set("noResponsesEnabled", String(params.noResponsesEnabled));
    searchParams.set("minViews", String(params.minViews));
    searchParams.set("draftIdleEnabled", String(params.draftIdleEnabled));
    searchParams.set("draftIdleDays", String(params.draftIdleDays));
    if (typeof params.attentionLimit === "number") {
      searchParams.set("attentionLimit", String(params.attentionLimit));
    }
    if (params.full) searchParams.set("full", "true");
    return request<DashboardInsightsResponse>(
      `/forms/dashboard-insights?${searchParams.toString()}`,
      { headers: bearer(token) },
    );
  },

  getForm: (token: string, id: string) =>
    request<Form>(`/forms/${id}`, {
      headers: bearer(token),
    }),

  createForm: (
    token: string,
    data: {
      title?: string;
      description?: string;
      schema: Record<string, unknown>;
      settings?: Record<string, unknown>;
      planSessionId?: string;
    },
  ) =>
    request<Form>("/forms", {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify(data),
    }),

  updateForm: (
    token: string,
    id: string,
    data: {
      title?: string;
      description?: string;
      schema?: Record<string, unknown>;
      settings?: Record<string, unknown>;
      planSessionId?: string;
    },
  ) =>
    request<Form>(`/forms/${id}`, {
      method: "PATCH",
      headers: bearer(token),
      body: JSON.stringify(data),
    }),

  deleteForm: (token: string, id: string) =>
    request<{ message: string }>(`/forms/${id}`, {
      method: "DELETE",
      headers: bearer(token),
    }),

  publishForm: (token: string, id: string) =>
    request<Form>(`/forms/${id}/publish`, {
      method: "POST",
      headers: bearer(token),
    }),

  unpublishForm: (token: string, id: string) =>
    request<Form>(`/forms/${id}/unpublish`, {
      method: "POST",
      headers: bearer(token),
    }),

  sendFormByEmail: (token: string, id: string, emails: string[]) =>
    request<{ sent: number; invalid: string[]; failed: string[] }>(
      `/forms/${id}/send-email`,
      {
        method: "POST",
        headers: bearer(token),
        body: JSON.stringify({ emails }),
      },
    ),

  stepFormVersionBack: (token: string, id: string) =>
    request<Form>(`/forms/${id}/version/back`, {
      method: "POST",
      headers: bearer(token),
    }),

  stepFormVersionForward: (token: string, id: string) =>
    request<Form>(`/forms/${id}/version/forward`, {
      method: "POST",
      headers: bearer(token),
    }),

  generateFormSchema: (token: string, prompt: string) =>
    request<FormPlanReadyResponse>("/forms/generate", {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify({ prompt }),
    }),

  startFormPlan: (token: string, prompt: string) =>
    request<FormPlanResponse>("/forms/generate/plan", {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify({ prompt }),
    }),

  submitFormPlanAnswers: (
    token: string,
    sessionId: string,
    answers: Record<string, string>,
  ) =>
    request<FormPlanResponse>(`/forms/generate/plan/${sessionId}/answers`, {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify({ answers }),
    }),

  refineFormPlan: (token: string, sessionId: string, refinement: string) =>
    request<FormPlanResponse>(`/forms/generate/plan/${sessionId}/refine`, {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify({ refinement }),
    }),

  listPlanSessions: (token: string, params?: ListPlanSessionsParams) => {
    const searchParams = new URLSearchParams();
    if (typeof params?.cursor === "number") searchParams.set("cursor", String(params.cursor));
    if (typeof params?.limit === "number") searchParams.set("limit", String(params.limit));
    const query = searchParams.toString();
    return request<ListPlanSessionsResponse>(
      `/forms/generate/plan${query ? `?${query}` : ""}`,
      {
        headers: bearer(token),
      },
    );
  },

  getPlanSession: (token: string, sessionId: string) =>
    request<StoredPlanSession>(`/forms/generate/plan/${sessionId}`, {
      headers: bearer(token),
    }),

  updatePlanSession: (
    token: string,
    sessionId: string,
    data: UpdatePlanSessionPayload,
  ) =>
    request<StoredPlanSession>(`/forms/generate/plan/${sessionId}`, {
      method: "PATCH",
      headers: bearer(token),
      body: JSON.stringify(data),
    }),

  getPublicForm: (slug: string) =>
    request<{
      id: string;
      title: string;
      description: string | null;
      slug: string;
      schema: Record<string, unknown>;
      settings: Record<string, unknown>;
    }>(`/forms/public/${slug}`),

  submitFormResponse: (slug: string, data: Record<string, unknown>) =>
    request<{ id: string }>(`/forms/public/${slug}/responses`, {
      method: "POST",
      body: JSON.stringify({ data }),
    }),

  getFormResponses: (token: string, formId: string) =>
    request<FormResponse[]>(`/forms/${formId}/responses`, {
      headers: bearer(token),
    }),

  getFormBehaviorAnalytics: (token: string, formId: string) =>
    request<FormBehaviorAnalytics>(`/forms/${formId}/behavior-analytics`, {
      headers: bearer(token),
    }),

  // --- Workspaces ---

  listWorkspaces: (token: string) =>
    request<WorkspaceSummary[]>("/workspaces", {
      headers: bearer(token),
    }),

  createWorkspace: (token: string, name: string) =>
    request<{ id: string; name: string; slug: string }>("/workspaces", {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify({ name }),
    }),

  listWorkspaceMembers: (token: string, workspaceId: string) =>
    request<WorkspaceMemberRow[]>(`/workspaces/${workspaceId}/members`, {
      headers: bearer(token),
    }),

  updateWorkspaceMemberRole: (
    token: string,
    workspaceId: string,
    userId: string,
    role: string,
  ) =>
    request<unknown>(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      headers: bearer(token),
      body: JSON.stringify({ role }),
    }),

  removeWorkspaceMember: (
    token: string,
    workspaceId: string,
    userId: string,
  ) =>
    request<{ ok: boolean }>(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
      headers: bearer(token),
    }),

  createWorkspaceInvite: (
    token: string,
    workspaceId: string,
    email: string,
    role: string,
  ) =>
    request<WorkspaceInvite>(`/workspaces/${workspaceId}/invites`, {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify({ email, role }),
    }),

  listWorkspaceInvites: (token: string, workspaceId: string) =>
    request<WorkspaceInvite[]>(`/workspaces/${workspaceId}/invites`, {
      headers: bearer(token),
    }),

  cancelWorkspaceInvite: (
    token: string,
    workspaceId: string,
    inviteId: string,
  ) =>
    request<{ ok: boolean }>(
      `/workspaces/${workspaceId}/invites/${inviteId}`,
      {
        method: "DELETE",
        headers: bearer(token),
      },
    ),

  acceptWorkspaceInvite: (token: string, inviteToken: string) =>
    request<{ id: string; name: string }>("/workspaces/invites/accept", {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify({ token: inviteToken }),
    }),

  listWorkspaceAuditLog: (
    token: string,
    workspaceId: string,
    params?: { cursor?: number; limit?: number; action?: string; actorId?: string },
  ) => {
    const sp = new URLSearchParams();
    if (typeof params?.cursor === "number") sp.set("cursor", String(params.cursor));
    if (typeof params?.limit === "number") sp.set("limit", String(params.limit));
    if (params?.action) sp.set("action", params.action);
    if (params?.actorId) sp.set("actorId", params.actorId);
    const q = sp.toString();
    return request<AuditLogResponse>(
      `/workspaces/${workspaceId}/audit${q ? `?${q}` : ""}`,
      { headers: bearer(token) },
    );
  },

  // --- Response pipeline ---

  getFormPipeline: (token: string, formId: string) =>
    request<FormPipelineConfig | null>(`/forms/${formId}/pipeline`, {
      headers: bearer(token),
    }),

  patchFormPipeline: (token: string, formId: string, isEnabled: boolean) =>
    request<FormPipelineConfig>(`/forms/${formId}/pipeline`, {
      method: "PATCH",
      headers: bearer(token),
      body: JSON.stringify({ isEnabled }),
    }),

  getPipelineBoard: (token: string, formId: string) =>
    request<PipelineBoardPayload>(`/forms/${formId}/pipeline/board`, {
      headers: bearer(token),
    }),

  movePipelineResponse: (
    token: string,
    formId: string,
    responseId: string,
    stageId: string,
  ) =>
    request<unknown>(`/forms/${formId}/pipeline/responses/${responseId}/move`, {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify({ stageId }),
    }),

  assignPipelineResponse: (
    token: string,
    formId: string,
    responseId: string,
    assigneeUserId: string | null,
  ) =>
    request<unknown>(
      `/forms/${formId}/pipeline/responses/${responseId}/assign`,
      {
        method: "POST",
        headers: bearer(token),
        body: JSON.stringify({ assigneeUserId }),
      },
    ),

  getPipelineResponseDetail: (token: string, formId: string, responseId: string) =>
    request<Record<string, unknown>>(
      `/forms/${formId}/pipeline/responses/${responseId}/detail`,
      { headers: bearer(token) },
    ),

  listPipelineNotes: (token: string, formId: string, responseId: string) =>
    request<unknown[]>(
      `/forms/${formId}/pipeline/responses/${responseId}/notes`,
      { headers: bearer(token) },
    ),

  addPipelineNote: (
    token: string,
    formId: string,
    responseId: string,
    body: string,
  ) =>
    request<unknown>(
      `/forms/${formId}/pipeline/responses/${responseId}/notes`,
      {
        method: "POST",
        headers: bearer(token),
        body: JSON.stringify({ body }),
      },
    ),

  deletePipelineNote: (
    token: string,
    formId: string,
    responseId: string,
    noteId: string,
  ) =>
    request<{ ok: boolean }>(
      `/forms/${formId}/pipeline/responses/${responseId}/notes/${noteId}`,
      { method: "DELETE", headers: bearer(token) },
    ),

  listPipelineActivities: (
    token: string,
    formId: string,
    responseId: string,
  ) =>
    request<unknown[]>(
      `/forms/${formId}/pipeline/responses/${responseId}/activities`,
      { headers: bearer(token) },
    ),

  createPipelineStage: (
    token: string,
    formId: string,
    data: { name: string; color?: string | null; isTerminal?: boolean },
  ) =>
    request<unknown>(`/forms/${formId}/pipeline/stages`, {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify(data),
    }),

  updatePipelineStage: (
    token: string,
    formId: string,
    stageId: string,
    data: Partial<{
      name: string;
      color: string | null;
      isDefault: boolean;
      isTerminal: boolean;
    }>,
  ) =>
    request<unknown>(`/forms/${formId}/pipeline/stages/${stageId}`, {
      method: "PATCH",
      headers: bearer(token),
      body: JSON.stringify(data),
    }),

  deletePipelineStage: (token: string, formId: string, stageId: string) =>
    request<{ ok: boolean }>(
      `/forms/${formId}/pipeline/stages/${stageId}`,
      { method: "DELETE", headers: bearer(token) },
    ),

  reorderPipelineStages: (token: string, formId: string, stageIds: string[]) =>
    request<unknown[]>(`/forms/${formId}/pipeline/stages/reorder`, {
      method: "POST",
      headers: bearer(token),
      body: JSON.stringify({ stageIds }),
    }),

  trackPublicFormBehavior: (
    slug: string,
    data: {
      sessionId: string;
      eventType:
        | "form_open"
        | "form_start"
        | "field_focus"
        | "field_blur"
        | "field_change"
        | "submit_attempt"
        | "submit_success"
        | "submit_error"
        | "form_abandon";
      fieldId?: string;
      payload?: Record<string, unknown>;
      locale?: string;
      referer?: string;
      viewport?: string;
      deviceType?: string;
    },
  ) =>
    request<{ id: string }>(`/forms/public/${slug}/behavior`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  requestEmailChange: (
    token: string,
    data: { newEmail: string; currentPassword: string },
  ) =>
    request<{ message: string; pendingEmail: string }>(
      "/auth/profile/email-change",
      {
        method: "POST",
        headers: bearer(token),
        body: JSON.stringify(data),
      },
    ),

  confirmEmailChange: (token: string) =>
    request<{ message: string; email: string }>(
      `/auth/confirm-email-change?token=${encodeURIComponent(token)}`,
    ),

  cancelEmailChange: (token: string) =>
    request<{ message: string }>("/auth/profile/email-change", {
      method: "DELETE",
      headers: bearer(token),
    }),

  requestAccountDeletion: (
    token: string,
    data: { currentPassword?: string; confirmEmail?: string },
  ) =>
    request<{ message: string; expiresInMinutes: number; retentionDays: number }>(
      "/auth/profile/delete-account",
      {
        method: "POST",
        headers: bearer(token),
        body: JSON.stringify(data),
      },
    ),

  confirmAccountDeletion: (token: string, data: { code: string }) =>
    request<{ message: string; purgeAt: string; retentionDays: number }>(
      "/auth/profile/delete-account/confirm",
      {
        method: "POST",
        headers: bearer(token),
        body: JSON.stringify(data),
      },
    ),

  getPreferences: (token: string) =>
    request<{ preferences: Record<string, unknown> | null }>(
      "/auth/profile/preferences",
      { headers: bearer(token) },
    ),

  updatePreferences: (token: string, preferences: Record<string, unknown>) =>
    request<{ preferences: Record<string, unknown> | null }>(
      "/auth/profile/preferences",
      {
        method: "PUT",
        headers: bearer(token),
        body: JSON.stringify({ preferences }),
      },
    ),

  getAiSettings: (token: string) =>
    request<{
      provider: string | null;
      model: string | null;
      hasApiKey: boolean;
    }>("/auth/profile/ai-settings", {
      headers: bearer(token),
    }),

  updateAiSettings: (
    token: string,
    data: {
      provider?: string | null;
      model?: string | null;
      apiKey?: string | null;
    },
  ) =>
    request<{
      provider: string | null;
      model: string | null;
      hasApiKey: boolean;
    }>("/auth/profile/ai-settings", {
      method: "PUT",
      headers: bearer(token),
      body: JSON.stringify(data),
    }),

  uploadFile: async (
    token: string,
    file: File,
    purpose: "avatar" | "header" = "header"
  ): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/uploads?purpose=${purpose}`, {
      method: "POST",
      headers: bearer(token),
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message;
      const err = new Error(message ?? "Upload failed") as Error & {
        status?: number;
      };
      err.status = res.status;
      throw err;
    }
    return data as { url: string };
  },

  resendVerificationEmail: async (token: string, locale?: string) => {
    const loc = locale ?? getLocale();
    const body = JSON.stringify({ locale: loc });
    const res = await fetch(`${API_URL}/auth/resend-verification-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...bearer(token),
        "Accept-Language": loc,
        "X-Locale": loc,
      },
      body,
    });
    const data = await res.json();
    if (!res.ok) {
      const message = Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message;
      const err = new Error(message ?? "Something went wrong") as Error & {
        status?: number;
        response?: Record<string, unknown>;
      };
      err.status = res.status;
      err.response = data as Record<string, unknown>;
      throw err;
    }
    return data as { message: string };
  },
};
