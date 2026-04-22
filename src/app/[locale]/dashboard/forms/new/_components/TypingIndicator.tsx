import { AssistantAvatar } from "./icons/AssistantAvatar";

export function TypingIndicator() {
  return (
    <div className="flex items-start gap-4">
      <AssistantAvatar />
      <div className="flex-1 min-w-0 pt-2 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]/70 animate-bounce [animation-delay:-0.3s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]/70 animate-bounce [animation-delay:-0.15s]" />
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--muted)]/70 animate-bounce" />
      </div>
    </div>
  );
}
