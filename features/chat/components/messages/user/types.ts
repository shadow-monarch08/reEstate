export type BaseUserMessageType = {
  local_id: string;
  server_id: string | null;
  conversation_id: string;
  status: "pending" | "sent" | "received" | "read";
  created_at: string;
};

export type UserTextMessageType = BaseUserMessageType & {
  body: string;
  content_type: "text";
};

export type UserDocumentMessageType = BaseUserMessageType & {
  body: string | null;
  content_type: "doc";
  file_name: string;
  file_size: number;
  mime_type: string;
  device_path: string | null;
  storage_path: string | null;
  upload_status: string;
};

export type UserImageMessageType = BaseUserMessageType & {
  body: string | null;
  content_type: "image";
  file_name: string;
  file_size: number;
  mime_type: string;
  device_path: string | null;
  storage_path: string | null;
  upload_status: string;
  img_height: number | null;
  img_width: number | null;
  type?: string;
};

export type UserMessage =
  | UserDocumentMessageType
  | UserImageMessageType
  | UserTextMessageType;
