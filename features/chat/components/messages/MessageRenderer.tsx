// src/features/chat/components/messages/MessageRenderer.tsx
import { RawMessage } from "@/types/domain/chat";
import React from "react";
import { UserMessagerRenderer } from "./user";
import { AgentMessagerRenderer } from "./agent";

type Props = {
  message: RawMessage; // you can expand to a union of user/agent messages
};

export default function MessageRenderer({ message }: Props) {
  switch (message.sender_role) {
    case "user":
      return <UserMessagerRenderer message={message as any} />; // TS narrow via union
    case "agent":
      return <AgentMessagerRenderer message={message as any} />;
    default:
      return <UserMessagerRenderer message={message as any} />;
  }
}
