const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

function getLocale(): string {
  if (typeof document === "undefined") return "en";
  const lang = document.documentElement.lang;
  return lang === "pt" ? "pt" : "en";
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const locale = getLocale();
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": locale,
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message;
    throw new Error(message ?? "Something went wrong");
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

  getProfile: (token: string) =>
    request<{
      id: string;
      email: string;
      name: string | null;
      isEmailVerified: boolean;
    }>("/auth/profile", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};
