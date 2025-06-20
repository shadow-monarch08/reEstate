import { BSON, ObjectSchema } from "realm";

export const ConversationSchema: ObjectSchema = {
  name: "Conversation",
  primaryKey: "id",
  properties: {
    id: {
      type: "uuid",
      default: () => new BSON.UUID(), // ✅ Default UUID
    },
    conversation_id: {
      type: "string",
    },
    agent_id: {
      type: "string",
    },
    agent_name: {
      type: "string",
    },
    agent_avatar: {
      type: "string",
    },
    avatar_last_update: {
      type: "string",
    },
    last_message_time: {
      type: "string",
    },
    unread_count: {
      type: "int",
    },
  },
};
