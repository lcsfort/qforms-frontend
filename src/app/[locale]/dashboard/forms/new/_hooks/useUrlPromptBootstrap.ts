import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useAppSelector } from "@/lib/redux/hooks";
import { URL_PROMPT_LOCK_KEY } from "../_lib/plan";

type Consumer = (prompt: string) => void;

/**
 * Consumes a `?prompt=...` query param exactly once per unique value (de-duped
 * via sessionStorage to survive Strict Mode remounts), then clears the URL.
 */
export function useUrlPromptBootstrap(onConsume: Consumer): void {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { token, hydrated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (!hydrated || !token) return;
    const raw = searchParams.get("prompt");
    if (raw == null) return;
    const trimmed = raw.trim();
    if (!trimmed) return;

    const now = Date.now();
    try {
      const prev = sessionStorage.getItem(URL_PROMPT_LOCK_KEY);
      if (prev) {
        const parsed = JSON.parse(prev) as { p: string; t: number };
        if (parsed.p === trimmed && now - parsed.t < 2000) return;
      }
    } catch {
      sessionStorage.removeItem(URL_PROMPT_LOCK_KEY);
    }
    sessionStorage.setItem(URL_PROMPT_LOCK_KEY, JSON.stringify({ p: trimmed, t: now }));

    router.replace("/dashboard/forms/new");
    onConsume(trimmed);
  }, [hydrated, token, searchParams, router, onConsume]);
}
