import { BSON, ObjectSchema } from "realm";

export const MessageSchema: ObjectSchema = {
  name: "Message",
  primaryKey: "id",
  properties: {
    id: {
      type: "uuid",
      default: () => new BSON.UUID(),
    },
    conversation_id: { type: "string" },
    sender_id: { type: "string" },
    receiver_id: { type: "string" },
    file: { type: "File", optional: true },
    property_ref: { type: "Property", optional: true },
    message: { type: "string" },
    created_at: { type: "date" },
    status: { type: "string" }, // e.g., 'sent', 'delivered', 'read'
  },
};
