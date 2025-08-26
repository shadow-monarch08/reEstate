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
  Message,
} from "@/lib/database/localStore";
import { ConversationOverviewReturnType } from "@/lib/supabase";
import { create } from "zustand";

export type ActiveConversationData = {
  agent_avatar: string;
  conversation_id: string;
  agent_name: string;
  agent_id: string;
  avatar_last_update: string;
  newConversation?: boolean;
};

interface ChatState {
  conversationOverview: Map<string, ConversationOverviewReturnType>;
  conversationDisplayOrder: Array<string>;
  conversationtLoading: boolean;
  messages: Map<string, Message>;
  loadingMessages: boolean;
  loadingMoreMessages: boolean;
  activeConversationId: string | null;
  started: boolean;
  bus: ChatBus;
  activeConversationData: ActiveConversationData;
}

interface ConversatioUpdateHandler {
  addConversationOverview: (overview: ConversationOverviewReturnType) => void;
  deleteConversationOverview: (conversationId: string) => void;
  updateWithoutOrderChange: (
    updateOverview: Partial<ConversationOverviewReturnType>
  ) => void;
  updateWithOrderChange: (
    updateOverview: Partial<ConversationOverviewReturnType>
  ) => void;
}

interface ConversationFetchHandler {
  fetchConversationOverview: ({
    range,
  }: {
    range: Array<number | number>;
  }) => Promise<void>;
  fetchNewConversation: (conversationId: string) => Promise<void>;
}

interface MessageHandlers {
  addMessage: (msg: Message) => void;
  initaiteMessages: (conversationId: string) => Promise<void>;
  fetchMoreMessages: (
    conversationId: string,
    range: [number, number]
  ) => Promise<void>;
  updateMessage: (localId: string, update: Partial<Message>) => void;
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
  conversationOverview: new Map<string, ConversationOverviewReturnType>(),
  conversationDisplayOrder: [],
  conversationtLoading: false,
  messages: new Map<string, Message>(),
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
>((set, get) => ({
  ...initialState,
  addConversationOverview: (overview: ConversationOverviewReturnType) =>
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
  updateWithoutOrderChange: (
    updateOverview: Partial<ConversationOverviewReturnType>
  ) =>
    set((state) => {
      const { conversation_id, ...updates } = updateOverview;
      const newOverview = new Map(state.conversationOverview);
      const existingOverview = state.conversationOverview.get(conversation_id!);
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
  updateWithOrderChange: (
    updateOverview: Partial<ConversationOverviewReturnType>
  ) =>
    set((state) => {
      const { conversation_id, ...updates } = updateOverview;
      const newOverview = new Map(state.conversationOverview);
      let newOrder = state.conversationDisplayOrder;
      const existingOverview = state.conversationOverview.get(conversation_id!);
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
  }: {
    range: Array<number | number>;
  }) => {
    try {
      set({
        conversationtLoading: true,
      });

      const result = await getAllConversationOverviews({ range });

      const conversationMap = new Map<string, ConversationOverviewReturnType>();
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

  fetchNewConversation: async (conversationId: string) => {
    try {
      const result = await getConversationOverview(conversationId);

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
  addMessage: (msg: Message) => {
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
      loadingMessages: true,
      messages: new Map(),
    });
    const messages = await getMessagesByConversation({
      conversationId,
      range: [0, 25],
    });

    set((state) => {
      const newMap = new Map<string, Message>();
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
      const newMap = new Map<string, Message>();
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
  updateMessage: (localId: string, update: Partial<Message>) => {
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
    const bus = get().bus;
    //Listen to bus events

    bus
      .on("message:incoming", (msg: PostgrestChangesMessagePayload) => {
        const activeConversation = get().activeConversationId;
        const conversationOverview = get().conversationOverview.get(
          msg.conversation_id
        );

        if (msg.conversation_id === activeConversation) {
          get().addMessage({ ...msg, pending: 0 });
        }

        if (conversationOverview) {
          get().updateWithOrderChange({
            conversation_id: msg.conversation_id,
            last_message: msg.body,
            last_message_time: msg.created_at,
            last_message_status: msg.status,
            last_message_pending: 0,
            last_message_content_type: msg.content_type,
            last_message_sender_role: msg.sender_role,
            unread_count:
              activeConversation === msg.conversation_id ||
              msg.sender_role === "user"
                ? 0
                : conversationOverview.unread_count + 1,
          });
        } else {
          get().fetchNewConversation(msg.conversation_id);
        }
      })
      .on("message:ack", (msgAck: BroadcastAckPayload) => {
        get().updateWithoutOrderChange({
          conversation_id: msgAck.conversation_id,
          last_message_status: msgAck.status,
          last_message_pending: 0,
        });

        get().updateMessage(msgAck.local_id, {
          pending: 0,
          status: msgAck.status,
        });
      })
      .on(
        "message:sync",
        (msgSync: { conversation_id: string; local_id: string }) => {
          get().updateWithoutOrderChange({
            conversation_id: msgSync.conversation_id,
            last_message_status: "sent",
            last_message_pending: 0,
          });
          if (msgSync.conversation_id === get().activeConversationId) {
            get().updateMessage(msgSync.local_id, {
              pending: 0,
              status: "sent",
            });
          }
        }
      )
      .on(
        "status:sync",
        (statusSync: {
          conversation_id: string;
          status: string;
          messageIds: Array<{ local_id: string }>;
        }) => {
          if (get().activeConversationId === statusSync.conversation_id) {
            for (const message of statusSync.messageIds) {
              get().updateMessage(message.local_id, {
                pending: 0,
                status: statusSync.status,
              });
            }
          }
          get().updateWithoutOrderChange({
            conversation_id: statusSync.conversation_id,
            last_message_status: statusSync.status,
            last_message_pending: 0,
          });
        }
      );

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
}));
