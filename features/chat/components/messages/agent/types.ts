export type BaseAgentMessageType = {
  local_id: string;
  server_id: string | null;
  conversation_id: string;
  status: "pending" | "sent" | "received" | "read";
  created_at: string;
};

export type AgentTextMessageType = BaseAgentMessageType & {
  body: string;
  content_type: "text";
};

export type AgentDocumentMessageType = BaseAgentMessageType & {
  body: string | null;
  content_type: "doc";
  file_name: string;
  file_size: number;
  mime_type: string;
  device_path: string | null;
  storage_path: string | null;
  upload_status: string;
};

export type AgentImageMessageType = BaseAgentMessageType & {
  body: string | null;
  content_type: "image";
  file_name: string;
  file_size: number;
  mime_type: string;
  device_path: string | null;
  storage_path: string | null;
  upload_status: string;
  height: number | null;
  width: number | null;
  type?: string;
};

export type AgentMessage =
  | AgentDocumentMessageType
  | AgentImageMessageType
  | AgentTextMessageType;
