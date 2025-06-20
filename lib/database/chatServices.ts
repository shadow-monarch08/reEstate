import { ChatOverviewReturnType, Conversation, Message } from "../supabase";
import { getRealm } from "./realm";

export const getAllChatOverviews = async ({
  range,
}: {
  range: Array<number | number>;
}): Promise<Array<ChatOverviewReturnType & { avatar_last_update: string }>> => {
  const realm = await getRealm();

  // Get paginated conversations
  const allConversations = realm
    .objects<Conversation>("Conversation")
    .sorted("last_message", true);
  const paginatedConversations = allConversations.slice(range[0], range[1]);

  const overviews: Array<ChatOverviewReturnType> = [];

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
  return Promise.resolve(overviews);
};

export const getChatOverviews = async (
  conversationId: string
): Promise<Array<ChatOverviewReturnType>> => {
  const realm = await getRealm();

  // Get paginated conversations
  const Conversations = realm
    .objects<Conversation>("Conversation")
    .filtered("conversation_id == $0", conversationId);

  const overviews: Array<ChatOverviewReturnType> = [];

  const messages = realm
    .objects<Message>("Message")
    .filtered("conversation_id == $0", conversationId);

  const latestMessage = messages.sorted("created_at", true)[0];

  overviews.push({
    conversation_id: Conversations[0].conversation_id,
    agent_id: Conversations[0].agent_id,
    agent_name: Conversations[0].agent_name,
    agent_avatar: Conversations[0].agent_avatar,
    avatar_last_update: Conversations[0].avatar_last_update,
    last_message: latestMessage?.message ?? null,
    last_file: latestMessage?.file ?? null,
    last_property_ref: latestMessage?.property_ref ?? null,
    last_message_time: latestMessage?.created_at ?? null,
    unread_count: Conversations[0]?.unread_count ?? 0,
  });

  return Promise.resolve(overviews);
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

export const updateMessage = async (msg: Partial<any>, messageId: string) => {
  try {
    const realm = await getRealm();
    realm.write(() => {
      const message = realm.objects("Message").filtered("id = $0", messageId);
      if (message) {
        Object.assign(message, msg);
      }
    });
  } catch (error) {
    console.error(error);
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

export const getMessagesByConversation = async ({
  conversationId,
  range,
}: {
  conversationId: string | undefined;
  range: Array<number | number>;
}): Promise<Array<Message>> => {
  try {
    const realm = await getRealm();
    const pagedMessage = realm
      .objects<Message>("Message")
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
