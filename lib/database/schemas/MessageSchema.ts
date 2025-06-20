import { BSON, ObjectSchema } from "realm";

export const MessageSchema: ObjectSchema = {
  name: "Message",
  primaryKey: "id",
  properties: {
    id: { type: "string" },
    conversation_id: { type: "string" },
    sender_id: { type: "string" },
    receiver_id: { type: "string" },
    file: { type: "object", objectType: "File", optional: true },
    property_ref: { type: "object", objectType: "Property", optional: true },
    message: { type: "string", optional: true },
    created_at: { type: "date" },
    status: { type: "string" }, // e.g., 'sent', 'delivered', 'read'
  },
};
