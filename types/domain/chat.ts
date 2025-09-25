export type RawMessage = {
  server_id?: string | null;
  local_id: string;
  conversation_id: string;
  sender_role: "user" | "agent";
  sender_id: string;
  receiver_id: string;
  body: string | null;
  content_type: "doc" | "image" | "text";
  created_at: string;
  pending: 0 | 1;
  status: string;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  device_path: string | null;
  storage_path: string | null;
  upload_status: string | null;
  progress?: number;
};

export type Conversation = {
  conversation_id: string;
  user_id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  avatar_last_update: string;
};

export type ConversationOverview = {
  agent_avatar: string;
  agent_id: string;
  agent_name: string;
  avatar_last_update: string;
  conversation_id: string;
  last_message: string | null;
  last_message_content_type: string;
  last_message_time: string; // ISO timestamp (can use Date if parsed)
  last_message_status: string;
  last_message_sender_role: string;
  last_message_file_name: string | null;
  last_message_mime_type: string | null;
  unread_count: number;
};
