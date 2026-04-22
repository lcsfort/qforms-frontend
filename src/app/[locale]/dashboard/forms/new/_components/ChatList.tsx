import type { ReactNode } from "react";
import type { ChatMessage } from "../_lib/chat";
import { ChatTextMessage } from "./ChatTextMessage";
import { PlanSnapshotMessage } from "./PlanSnapshotMessage";
import { TypingIndicator } from "./TypingIndicator";

type Props = {
  messages: ChatMessage[];
  showTyping: boolean;
  avatarUrl: string | null;
  initials: string;
  children?: ReactNode;
};

export function ChatList({ messages, showTyping, avatarUrl, initials, children }: Props) {
  return (
    <div className="mt-8 space-y-7">
      {messages.map((message) => {
        if (message.kind === "snapshot") {
          return <PlanSnapshotMessage key={message.id} schema={message.schema} />;
        }
        return (
          <ChatTextMessage
            key={message.id}
            role={message.role}
            content={message.content}
            avatarUrl={avatarUrl}
            initials={initials}
          />
        );
      })}
      {showTyping && <TypingIndicator />}
      {children}
    </div>
  );
}
