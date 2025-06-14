import Realm from "realm";
import { MessageSchema } from "./schemas/MessageSchema";
import { ConversationSchema } from "./schemas/ConversationSchema";
import { getRealmEncryptionKey } from "../security/encryptionKey";
import { PropertySchema } from "./schemas/PropertySchema";
import { FileSchema } from "./schemas/FileSchema";

export const getRealm = async () => {
  const key = await getRealmEncryptionKey();

  return Realm.open({
    schema: [MessageSchema, ConversationSchema, PropertySchema, FileSchema],
    schemaVersion: 1,
    path: "chat.realm",
    encryptionKey: key,
  });
};
