// src/features/chat/components/messages/MessageRenderer.tsx
import React from "react";
import type { AgentMessage } from "./types";
import AgentTextMessage from "./AgentTextMessage";
import AgentDocumentMessage from "./AgentDocumentMessage";
import AgentImageMessage from "./AgentImageMessage";

type Props = {
  message: AgentMessage; // you can expand to a union of user/agent messages
};

export default function AgentMessageRenderer({ message }: Props) {
  switch (message.content_type) {
    case "text":
      return <AgentTextMessage msg={message as any} />; // TS narrow via union
    case "doc":
      return <AgentDocumentMessage msg={message as any} />;
    case "image":
      return <AgentImageMessage msg={message as any} />;
    default:
      return <AgentTextMessage msg={message as any} />;
  }
}
