import { useEffect, useRef } from "react";
import { useAppDispatch } from "@/lib/redux/hooks";
import { updatePlanSession } from "@/lib/redux/formsSlice";
import type { GeneratedFormSchema, StoredChatMessage } from "@/lib/types";
import type { ChatMessage } from "../_lib/chat";

interface Args {
  sessionId: string | null;
  chatMessages: ChatMessage[];
  readySchema: GeneratedFormSchema | null;
  title: string;
  /** Skip saving while the UI is still hydrating from the server. */
  paused?: boolean;
  /** Debounce window in ms. Defaults to 800ms. */
  delayMs?: number;
}

function serializeChat(messages: ChatMessage[]): StoredChatMessage[] {
  return messages.map((m) => {
    if (m.kind === "snapshot") {
      return { id: m.id, role: m.role, kind: "snapshot", schema: m.schema };
    }
    return { id: m.id, role: m.role, kind: "text", content: m.content };
  });
}

export function useSessionAutosave({
  sessionId,
  chatMessages,
  readySchema,
  title,
  paused = false,
  delayMs = 800,
}: Args): void {
  const dispatch = useAppDispatch();
  const lastSavedRef = useRef<string>("");
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sessionId || paused) return;
    const payload = {
      chatMessages: serializeChat(chatMessages),
      readySchema,
      title: title.trim().slice(0, 200) || undefined,
    };
    const serialized = JSON.stringify(payload);
    if (serialized === lastSavedRef.current) return;

    if (pendingTimer.current) {
      clearTimeout(pendingTimer.current);
    }
    pendingTimer.current = setTimeout(() => {
      lastSavedRef.current = serialized;
      void dispatch(
        updatePlanSession({
          sessionId,
          data: payload,
        }),
      );
    }, delayMs);

    return () => {
      if (pendingTimer.current) {
        clearTimeout(pendingTimer.current);
        pendingTimer.current = null;
      }
    };
  }, [sessionId, paused, chatMessages, readySchema, title, delayMs, dispatch]);
}
