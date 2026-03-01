"use client";

import { useState, type FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks";
import { signin, clearError } from "@/lib/redux/authSlice";

export default function SigninPage() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { loading, error, token } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (token) {
      router.push("/dashboard");
    }
  }, [token, router]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(signin({ email, password }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            <span className="text-indigo-600">Q</span>Forms
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-6">
            Sign in to your QForms account
          </p>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-shadow text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-6">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
