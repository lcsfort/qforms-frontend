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
    }>("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  updateName: (token: string, data: { name: string }) =>
    request<{
      id: string;
      email: string;
      name: string | null;
      isEmailVerified: boolean;
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
