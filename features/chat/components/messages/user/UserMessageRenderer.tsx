// src/features/chat/components/messages/MessageRenderer.tsx
import React from "react";
import type { UserMessage } from "./types";
import UserTextMessage from "./UserTextMessage";
import UserDocumentMessage from "./UserDocumentMessage";
import UserImageMessage from "./UserImageMessage";

type Props = {
  message: UserMessage; // you can expand to a union of user/User messages
};

export default function UserMessageRenderer({ message }: Props) {
  switch (message.content_type) {
    case "text":
      return <UserTextMessage msg={message as any} />; // TS narrow via union
    case "doc":
      return <UserDocumentMessage msg={message as any} />;
    case "image":
      return <UserImageMessage msg={message as any} />;
    default:
      return <UserTextMessage msg={message as any} />;
  }
}
