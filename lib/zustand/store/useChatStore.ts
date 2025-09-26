import {
  BroadcastAckPayload,
  chatBus,
  ChatBus,
  PostgrestChangesMessagePayload,
} from "@/lib/chat-bus";
import {
  getAllConversationOverviews,
  getConversationOverview,
  getMessagesByConversation,
  upsertConversation,
} from "@/lib/database/localStore";
import { create } from "zustand";
import { ConversationOverview, RawMessage } from "@/types/domain/chat";
import { LocalMessage } from "@/types/api/localDatabase";

export type ActiveConversationData = {
  agent_avatar: string;
  conversation_id: string;
  agent_name: string;
  agent_id: string;
  avatar_last_update: string;
  newConversation?: boolean;
};

interface ChatState {
  conversationOverview: Map<string, ConversationOverview>;
  conversationDisplayOrder: Array<string>;
  conversationtLoading: boolean;
  messages: Map<string, LocalMessage>;
  loadingMessages: boolean;
  loadingMoreMessages: boolean;
  activeConversationId: string | null;
  started: boolean;
  bus: ChatBus;
  activeConversationData: ActiveConversationData;
}

interface ConversatioUpdateHandler {
  addConversationOverview: (overview: ConversationOverview) => void;
  deleteConversationOverview: (conversationId: string) => void;
  updateWithoutOrderChange: (
    updateOverview: Partial<ConversationOverview>
  ) => void;
  updateWithOrderChange: (
    updateOverview: Partial<ConversationOverview>
  ) => void;
}

interface ConversationFetchHandler {
  fetchConversationOverview: ({
    range,
    userId,
  }: {
    range: Array<number | number>;
    userId: string;
  }) => Promise<void>;
  fetchNewConversation: (
    conversationId: string,
    userId: string
  ) => Promise<void>;
}

interface MessageHandlers {
  addMessage: (msg: LocalMessage) => void;
  initaiteMessages: (conversationId: string) => Promise<void>;
  fetchMoreMessages: (
    conversationId: string,
    range: [number, number]
  ) => Promise<void>;
  updateMessage: (localId: string, update: Partial<RawMessage>) => void;
  setActiveConversationId: (conversationId: string | null) => void;
  emptyMessages: () => void;
}

interface ChatHandler {
  start: (userId: string, activeConversationId: string | null) => Promise<void>;
  stop: () => void;
  setActiveConversationData: (data: ActiveConversationData) => void;
  updateActiveConversationData: (
    update: Partial<ActiveConversationData>
  ) => void;
  changeChatBusConversationId: (conversation_id: string | null) => void;
}

const initialState: ChatState = {
  conversationOverview: new Map<string, ConversationOverview>(),
  conversationDisplayOrder: [],
  conversationtLoading: false,
  messages: new Map<string, LocalMessage>(),
  loadingMessages: false,
  loadingMoreMessages: false,
  activeConversationId: null,
  started: false,
  bus: chatBus,
  activeConversationData: {
    agent_avatar: "",
    avatar_last_update: "",
    conversation_id: "",
    agent_name: "",
    agent_id: "",
  },
};

export const useChatStore = create<
  ChatState &
    ConversatioUpdateHandler &
    ConversationFetchHandler &
    MessageHandlers &
    ChatHandler
>((set, get) => {
  const bus = chatBus;

  const uploadProgress = (data: {
    local_id: string;
    upload_progress: number;
  }) => {
    if (data.upload_progress === 0)
      get().updateMessage(data.local_id, {
        upload_status: "uploading",
      });
    else if (data.upload_progress === -1)
      get().updateMessage(data.local_id, {
        upload_status: "failed",
      });
    else if (data.upload_progress === 100)
      get().updateMessage(data.local_id, {
        upload_status: "uploaded",
      });
  };

  const cancelUploading = ({ local_id }: { local_id: string }) => {
    get().updateMessage(local_id, {
      upload_status: "failed",
    });
    bus.cancelUpload({ local_id });
  };

  const newDownloadFile = (downloadedFile: {
    localId: string;
    body: string;
    upload_status: string;
  }) => {
    get().updateMessage(downloadedFile.localId, {
      body: downloadedFile.body,
      upload_status: downloadedFile.upload_status,
    });
  };

  const outgoingMessage = async (
    msg: RawMessage & { sender_id: string; receiver_id: string }
  ) => {
    const activeConversationData = get().activeConversationData;
    const conversationOverview = get().conversationOverview.get(
      msg.conversation_id
    );
    get().addMessage(msg);
    if (!conversationOverview) {
      if (activeConversationData.newConversation) {
        await upsertConversation({
          user_id: msg.sender_id,
          agent_avatar: activeConversationData.agent_avatar,
          agent_id: activeConversationData.agent_id,
          agent_name: activeConversationData.agent_name,
          avatar_last_update: activeConversationData.avatar_last_update,
          conversation_id: msg.conversation_id,
        });
        get().updateActiveConversationData({
          newConversation: false,
        });
      }
      await get().fetchNewConversation(msg.conversation_id, msg.sender_id);
    }
    get().updateWithOrderChange({
      conversation_id: msg.conversation_id,
      last_message: msg.body,
      last_message_time: msg.created_at,
      last_message_status: msg.status,
      last_message_content_type: msg.content_type,
      last_message_sender_role: msg.sender_role,
      unread_count: 0,
    });
  };

  const incomingMessage = (msg: LocalMessage) => {
    const activeConversation = get().activeConversationId;
    const conversationOverview = get().conversationOverview.get(
      msg.conversation_id
    );

    if (msg.conversation_id === activeConversation) {
      get().addMessage(msg);
    }

    if (conversationOverview) {
      get().updateWithOrderChange({
        conversation_id: msg.conversation_id,
        last_message: msg.body,
        last_message_time: msg.created_at,
        last_message_status: msg.status,
        last_message_content_type: msg.content_type,
        last_message_sender_role: msg.sender_role,
        unread_count:
          activeConversation === msg.conversation_id ||
          msg.sender_role === "user"
            ? 0
            : conversationOverview.unread_count + 1,
      });
    } else {
      get().fetchNewConversation(msg.conversation_id, msg.sender_id);
    }
  };

  const incomingAck = (msgAck: BroadcastAckPayload) => {
    get().updateWithoutOrderChange({
      conversation_id: msgAck.conversation_id,
      last_message_status: msgAck.status,
    });

    get().updateMessage(msgAck.local_id, {
      status: msgAck.status,
    });
  };

  const statusSync = (statusSync: {
    conversation_id: string;
    status: string;
    messageIds: Array<{ local_id: string }>;
  }) => {
    if (get().activeConversationId === statusSync.conversation_id) {
      for (const message of statusSync.messageIds) {
        get().updateMessage(message.local_id, {
          status: statusSync.status,
        });
      }
    }
    get().updateWithoutOrderChange({
      conversation_id: statusSync.conversation_id,
      last_message_status: statusSync.status,
    });
  };

  bus
    .off("message:incoming", incomingMessage)
    .off("message:outgoing", outgoingMessage)
    .off("message:ack", incomingAck)
    .off("status:sync", statusSync)
    .off("upload:progress", uploadProgress)
    .off("upload:cancel", cancelUploading)
    .off("file:download", newDownloadFile)
    .on("message:incoming", incomingMessage)
    .on("message:outgoing", outgoingMessage)
    .on("message:ack", incomingAck)
    .on("status:sync", statusSync)
    .on("upload:progress", uploadProgress)
    .on("upload:cancel", cancelUploading)
    .on("file:download", newDownloadFile);

  return {
    ...initialState,
    bus,
    addConversationOverview: (overview: ConversationOverview) =>
      set((state) => {
        const newOverview = new Map(state.conversationOverview);
        const newOrder = state.conversationDisplayOrder;
        newOverview.set(overview.conversation_id, overview);
        newOrder.unshift(overview.conversation_id);
        return {
          ...state,
          conversationOverview: newOverview,
          conversationDisplayOrder: newOrder,
        };
      }),
    deleteConversationOverview: (conversationId: string) =>
      set((state) => {
        const newOverview = new Map(state.conversationOverview);
        let newOrder = state.conversationDisplayOrder;
        newOverview.delete(conversationId);
        newOrder = newOrder.filter((item) => item !== conversationId);
        return {
          ...state,
          conversationDisplayOrder: newOrder,
          conversationOverview: newOverview,
        };
      }),
    updateWithoutOrderChange: (updateOverview: Partial<ConversationOverview>) =>
      set((state) => {
        const { conversation_id, ...updates } = updateOverview;
        const newOverview = new Map(state.conversationOverview);
        const existingOverview = state.conversationOverview.get(
          conversation_id!
        );
        if (existingOverview) {
          newOverview.set(conversation_id!, {
            ...existingOverview,
            ...updates,
          });
        }
        return {
          ...state,
          conversationOverview: newOverview,
        };
      }),
    updateWithOrderChange: (updateOverview: Partial<ConversationOverview>) =>
      set((state) => {
        const { conversation_id, ...updates } = updateOverview;
        const newOverview = new Map(state.conversationOverview);
        let newOrder = state.conversationDisplayOrder;
        const existingOverview = state.conversationOverview.get(
          conversation_id!
        );
        if (existingOverview) {
          newOverview.set(conversation_id!, {
            ...existingOverview,
            ...updates,
          });
          newOrder = newOrder.filter((item) => item !== conversation_id);
          newOrder.unshift(conversation_id!);
        }
        return {
          ...state,
          conversationDisplayOrder: newOrder,
          conversationOverview: newOverview,
        };
      }),
    fetchConversationOverview: async ({
      range = [0, 20],
      userId,
    }: {
      range: Array<number | number>;
      userId: string;
    }) => {
      try {
        set({
          conversationtLoading: true,
        });

        const result = await getAllConversationOverviews({
          range,
          user_id: userId,
        });

        const conversationMap = new Map<string, ConversationOverview>();
        const conversationIds = result.map((chat) => chat.conversation_id);

        for (const conversation of result) {
          conversationMap.set(conversation.conversation_id, conversation);
        }

        set({
          conversationDisplayOrder: conversationIds,
          conversationOverview: conversationMap,
        });
      } catch (error) {
        console.error("Error fetching conversation overview: ", error);
      } finally {
        set({
          conversationtLoading: false,
        });
      }
    },

    fetchNewConversation: async (conversationId: string, userId: string) => {
      try {
        const result = await getConversationOverview(conversationId, userId);

        set((state) => {
          const newOverview = new Map(state.conversationOverview);
          const newOrder = state.conversationDisplayOrder;

          if (result) {
            newOverview.set(conversationId, result);
            newOrder.unshift(conversationId);
          }

          return {
            ...state,
            conversationDisplayOrder: newOrder,
            conversationOverview: newOverview,
          };
        });
      } catch (error) {
        console.error("Error fetching new conversation overview: ", error);
      }
    },
    addMessage: (msg: LocalMessage) => {
      set((state) => {
        const newMap = new Map([[msg.local_id, msg], ...state.messages]);
        return {
          ...state,
          messages: newMap,
        };
      });
    },
    initaiteMessages: async (conversationId: string) => {
      set({
        messages: new Map(),
        loadingMessages: true,
      });
      const messages = await getMessagesByConversation({
        conversationId,
        range: [0, 25],
      });

      set((state) => {
        const newMap = new Map<string, RawMessage>();
        messages.forEach((message) => {
          newMap.set(message.local_id, message);
        });
        return {
          ...state,
          loadingMessages: false,
          messages: newMap,
        };
      });
    },
    fetchMoreMessages: async (
      conversationId: string,
      range: [number, number]
    ) => {
      set({
        loadingMoreMessages: true,
      });

      const messages = await getMessagesByConversation({
        conversationId,
        range,
      });

      set((state) => {
        const newMap = new Map<string, RawMessage>();
        messages.forEach((message) => {
          newMap.set(message.local_id, message);
        });
        return {
          ...state,
          messages: new Map([...newMap, ...state.messages]),
          loadingMoreMessages: false,
        };
      });
    },
    setActiveConversationId: (conversationId: string | null) => {
      set((state) => ({ ...state, activeConversationId: conversationId }));
    },
    updateMessage: (localId: string, update: Partial<RawMessage>) => {
      set((state) => {
        const existingMessage = state.messages.get(localId);
        const newMap = new Map(state.messages);
        if (existingMessage) {
          newMap.set(localId, {
            ...existingMessage,
            ...update,
          });
        }
        return {
          ...state,
          messages: newMap,
        };
      });
    },
    emptyMessages: () => {
      set({ messages: new Map(), activeConversationId: null });
    },
    setActiveConversationData: (data: ActiveConversationData) =>
      set({
        activeConversationData: data,
      }),
    updateActiveConversationData: (update: Record<string, any>) =>
      set((state) => {
        const newConversationData = {
          ...state.activeConversationData,
          ...update,
        };
        return {
          ...state,
          activeConversationData: newConversationData,
        };
      }),
    start: async (userId: string, activeConversationId: string | null) => {
      if (get().started) return;
      await bus.start(userId, activeConversationId);
      set({
        started: true,
      });
    },
    stop: () => {
      get().bus.stop();
      set({
        started: false,
      });
    },
    changeChatBusConversationId: (conversation_id: string | null) =>
      get().bus.updateActiveConversationId(conversation_id),
  };
});
