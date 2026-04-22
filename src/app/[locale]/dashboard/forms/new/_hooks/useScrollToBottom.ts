import { useEffect, type DependencyList, type RefObject } from "react";

export function useScrollToBottom(
  ref: RefObject<HTMLElement | null>,
  deps: DependencyList,
): void {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
