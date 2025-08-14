import {
  getAllConversationOverviews,
  getConversationOverview,
} from "@/lib/database/chatServices";
import { ConversationOverviewReturnType } from "@/lib/supabase";
import { create } from "zustand";

interface ConversationState {
  conversationOverview: Map<string, ConversationOverviewReturnType>;
  conversationDisplayOrder: Array<string>;
  conversationtLoading: boolean;
}

interface ConversatioUpdateHandler {
  addConversationOverview: (overview: ConversationOverviewReturnType) => void;
  deleteConversationOverview: (conversationId: string) => void;
  updateWithoutOrderChange: (updateOverview: Record<string, any>) => void;
  updateWithOrderChange: (updateOverview: Record<string, any>) => void;
}

interface ConversationFetchHandler {
  fetchConversationOverview: ({
    range,
  }: {
    range: Array<number | number>;
  }) => Promise<void>;
  fetchNewConversation: (conversationId: string) => Promise<void>;
}

const initalState: ConversationState = {
  conversationOverview: new Map(),
  conversationDisplayOrder: [],
  conversationtLoading: false,
};

export const useConversationStore = create<
  ConversationState & ConversatioUpdateHandler & ConversationFetchHandler
>((set) => ({
  ...initalState,
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
      const newOrder = state.conversationDisplayOrder;
      newOverview.delete(conversationId);
      newOrder.filter((item) => item !== conversationId);
      return {
        ...state,
        conversationDisplayOrder: newOrder,
        conversationOverview: newOverview,
      };
    }),
  updateWithoutOrderChange: (updateOverview: Record<string, any>) =>
    set((state) => {
      const { conversation_id, ...updates } = updateOverview;
      const newOverview = new Map(state.conversationOverview);
      const existingOverview = state.conversationOverview.get(conversation_id);
      if (existingOverview) {
        newOverview.set(conversation_id, {
          ...existingOverview,
          ...updates,
        });
      }
      return {
        ...state,
        conversationOverview: newOverview,
      };
    }),
  updateWithOrderChange: (updateOverview: Record<string, any>) =>
    set((state) => {
      const { conversation_id, ...updates } = updateOverview;
      const newOverview = new Map(state.conversationOverview);
      const newOrder = state.conversationDisplayOrder;
      const existingOverview = state.conversationOverview.get(conversation_id);
      if (existingOverview) {
        newOverview.set(conversation_id, {
          ...existingOverview,
          ...updates,
        });
        newOrder.filter((item) => item !== conversation_id);
        newOrder.unshift(conversation_id);
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

        newOverview.set(conversationId, result[0]);
        newOrder.unshift(conversationId);

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
}));
