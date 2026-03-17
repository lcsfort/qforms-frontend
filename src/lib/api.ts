import type { Form, FormResponse, GeneratedFormSchema } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

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
  const res = await fetch(`${API_URL}${endpoint}`, {
    ...restOptions,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": locale,
      "X-Locale": locale,
      ...(optionsHeaders as Record<string, string>),
    },
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

  return data as T;
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
      user: {
        id: string;
        email: string;
        name: string | null;
        isEmailVerified: boolean;
      };
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
    request<{
      id: string;
      email: string;
      name: string | null;
      isEmailVerified: boolean;
      authProvider?: "local" | "google";
    }>("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateName: (token: string, data: { name: string }) =>
    request<{
      id: string;
      email: string;
      name: string | null;
      isEmailVerified: boolean;
      authProvider?: "local" | "google";
    }>("/auth/profile/name", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  changePassword: (
    token: string,
    data: { currentPassword: string; newPassword: string },
  ) =>
    request<{ message: string }>("/auth/profile/change-password", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  // --- Forms ---

  listForms: (token: string) =>
    request<Form[]>("/forms", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getForm: (token: string, id: string) =>
    request<Form>(`/forms/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  createForm: (
    token: string,
    data: {
      title: string;
      description?: string;
      schema: unknown[];
      settings?: Record<string, unknown>;
    },
  ) =>
    request<Form>("/forms", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  updateForm: (
    token: string,
    id: string,
    data: {
      title?: string;
      description?: string;
      schema?: unknown[];
      settings?: Record<string, unknown>;
    },
  ) =>
    request<Form>(`/forms/${id}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  deleteForm: (token: string, id: string) =>
    request<{ message: string }>(`/forms/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }),

  publishForm: (token: string, id: string) =>
    request<Form>(`/forms/${id}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),

  unpublishForm: (token: string, id: string) =>
    request<Form>(`/forms/${id}/unpublish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),

  stepFormVersionBack: (token: string, id: string) =>
    request<Form>(`/forms/${id}/version/back`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),

  stepFormVersionForward: (token: string, id: string) =>
    request<Form>(`/forms/${id}/version/forward`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    }),

  generateFormSchema: (token: string, prompt: string) =>
    request<GeneratedFormSchema>("/forms/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ prompt }),
    }),

  getPublicForm: (slug: string) =>
    request<{
      id: string;
      title: string;
      description: string | null;
      slug: string;
      schema: unknown[];
      settings: Record<string, unknown>;
    }>(`/forms/public/${slug}`),

  submitFormResponse: (slug: string, data: Record<string, unknown>) =>
    request<{ id: string }>(`/forms/public/${slug}/responses`, {
      method: "POST",
      body: JSON.stringify({ data }),
    }),

  getFormResponses: (token: string, formId: string) =>
    request<FormResponse[]>(`/forms/${formId}/responses`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getAiSettings: (token: string) =>
    request<{
      provider: string | null;
      model: string | null;
      hasApiKey: boolean;
    }>("/auth/profile/ai-settings", {
      headers: { Authorization: `Bearer ${token}` },
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
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    }),

  uploadFile: async (token: string, file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_URL}/uploads`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
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
        Authorization: `Bearer ${token}`,
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
