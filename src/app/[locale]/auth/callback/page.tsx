"use client";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useAppDispatch } from "@/lib/redux/hooks";
import { fetchProfile, setToken } from "@/lib/redux/authSlice";

export default function AuthCallbackPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = typeof window !== "undefined" ? window.location.hash : "";
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get("token");

    if (!token) {
      queueMicrotask(() => setError("No token received"));
      return;
    }

    if (typeof window !== "undefined") {
      localStorage.setItem("token", token);
    }
    dispatch(setToken(token));
    dispatch(fetchProfile())
      .unwrap()
      .then(() => {
        router.replace("/dashboard");
      })
      .catch(() => {
        setError("Failed to load profile");
      });
  }, [dispatch, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Link
            href="/signin"
            className="text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}
