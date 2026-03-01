const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message ?? "Something went wrong");
  }

  return data as T;
}

export const api = {
  signup: (data: { email: string; password: string; name?: string }) =>
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
