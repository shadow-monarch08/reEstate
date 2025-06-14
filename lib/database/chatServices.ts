import { ChatOverviewReturnType, File, propertyReturnType } from "../supabase";
import { getRealm } from "./realm";

interface Message {
  conversation_id: string;
  receiver_id: string;
  sender_id: string;
  message: string;
  file: File;
  property_ref: propertyReturnType;
  created_at: string;
}

interface Conversation {
  conversation_id: string;
  agent_id: string;
  agent_name: string;
  agent_avatar: string;
  avatar_last_update: string;
  unread_count: number;
}

export const getAllChatOverviews = async ({
  range,
}: {
  range: Array<number | number>;
}): Promise<Array<ChatOverviewReturnType & { avatar_last_update: string }>> => {
  const realm = await getRealm();

  // Get paginated conversations
  const allConversations = realm.objects<Conversation>("Conversation");
  const paginatedConversations = allConversations.slice(range[0], range[1]);

  const overviews: ChatOverviewReturnType[] = [];

  for (const conv of paginatedConversations) {
    const messages = realm
      .objects<Message>("Message")
      .filtered("conversation_id == $0", conv.conversation_id);

    const latestMessage = messages.sorted("created_at", true)[0];

    overviews.push({
      conversation_id: conv.conversation_id,
      agent_id: conv.agent_id,
      agent_name: conv.agent_name,
      agent_avatar: conv.agent_avatar,
      avatar_last_update: conv.avatar_last_update,
      last_message: latestMessage?.message ?? null,
      last_file: latestMessage?.file ?? null,
      last_property_ref: latestMessage?.property_ref ?? null,
      last_message_time: latestMessage?.created_at ?? null,
      unread_count: conv?.unread_count ?? 0,
    });
  }

  return overviews;
};

export const insertMessage = async (msg: Array<Message>) => {
  try {
    const realm = await getRealm();
    realm.write(() => {
      msg.forEach((obj) => {
        realm.create("Message", obj);
      });
    });
  } catch (error) {
    console.error("Failed to insert message:", error);
  }
};

export const insertConversation = async (conv: Conversation) => {
  try {
    const realm = await getRealm();
    realm.write(() => {
      realm.create("Conversation", conv);
    });
  } catch (error) {
    console.error("Failed to insert conversation:", error);
  }
};

export const updateConversation = async (
  conversationId: string,
  updates: Partial<any>
) => {
  try {
    const realm = await getRealm();
    realm.write(() => {
      const conversation = realm
        .objects("Conversation")
        .filtered("conversation_id == $0", conversationId)[0];

      if (conversation) {
        Object.assign(conversation, updates);
      }
    });
  } catch (error) {
    console.error("Failed to update conversation:", error);
  }
};

export const getMessagesByConversation = async (
  conversationId: string,
  range: Array<number | number>
) => {
  try {
    const realm = await getRealm();
    const pagedMessage = realm
      .objects("Message")
      .filtered("conversation_id == $0", conversationId)
      .sorted("created_at", true)
      .slice(range[0], range[1]);

    return Promise.resolve([...pagedMessage].reverse());
  } catch (error) {
    console.error("Failed to get messages:", error);
    return [];
  }
};

export const deleteMessage = async (messageId: string) => {
  try {
    const realm = await getRealm();
    realm.write(() => {
      const msg = realm.objectForPrimaryKey("Message", messageId);
      if (msg) realm.delete(msg);
    });
  } catch (error) {
    console.error("Failed to delete message:", error);
  }
};
