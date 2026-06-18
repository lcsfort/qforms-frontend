import type { RenderKitDocument, StoredChatMessage } from "@/lib/types";

export type ChatMessage =
  | {
      id: string;
      role: "user" | "assistant";
      kind: "text";
      content: string;
    }
  | {
      id: string;
      role: "assistant";
      kind: "snapshot";
      document: RenderKitDocument;
    };

export function textMessage(
  role: "user" | "assistant",
  content: string,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    kind: "text",
    content,
  };
}

export function snapshotMessage(document: RenderKitDocument): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role: "assistant",
    kind: "snapshot",
    document,
  };
}

function randomId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

export function hydrateChatMessages(stored: unknown): ChatMessage[] {
  if (!Array.isArray(stored)) return [];
  const out: ChatMessage[] = [];
  for (const raw of stored as StoredChatMessage[]) {
    if (!raw || typeof raw !== "object") continue;
    const id = typeof raw.id === "string" && raw.id.length > 0 ? raw.id : randomId();
    if (raw.kind === "snapshot") {
      if (!raw.document || typeof raw.document !== "object") continue;
      out.push({
        id,
        role: "assistant",
        kind: "snapshot",
        document: raw.document,
      });
      continue;
    }
    if (raw.kind === "text") {
      if (typeof raw.content !== "string") continue;
      if (raw.role !== "user" && raw.role !== "assistant") continue;
      out.push({
        id,
        role: raw.role,
        kind: "text",
        content: raw.content,
      });
    }
  }
  return out;
}
