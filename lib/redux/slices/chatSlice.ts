import {
  getAllConversationOverviews,
  getConversationOverview,
} from "@/lib/database/chatServices";
import { ConversationOverviewReturnType, Message } from "@/lib/supabase";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatState {
  ConversationOverview: Map<string, ConversationOverviewReturnType>;
  ConversationDisplayOrder: Array<string>;
  // This is used to track the loading state of conversations
  conversationtLoading: boolean;
}

const initalState: ChatState = {
  ConversationOverview: new Map<string, ConversationOverviewReturnType>(),
  ConversationDisplayOrder: [],
  conversationtLoading: false,
};

export const fetchInDeviceChatOverviewThunk = createAsyncThunk(
  "chat/fetchInDeviceConversationOverview",
  async ({ range = [0, 20] }: { range: Array<number | number> }) => {
    const result = await getAllConversationOverviews({ range });

    const conversationOverviewMap = new Map<
      string,
      ConversationOverviewReturnType
    >();
    const conversationIds = result.map((chat) => chat.conversation_id);
    for (const chat of result) {
      conversationOverviewMap.set(chat.conversation_id, chat);
    }

    return { conversationIds, conversationOverviewMap };
  }
);

export const addNewConversationThunk = createAsyncThunk(
  "chat/addNewConversation",
  async (message: Message) => {
    const overview = await getConversationOverview(message.conversation_id);
    if (!overview) {
      throw new Error(
        `No conversation overview found for conversation ID: ${message.conversation_id}`
      );
    }
    return overview;
  }
);

const chatSlice = createSlice({
  name: "chat",
  initialState: initalState,
  reducers: {
    addConversationOverview: (state, action) => {
      const overview = action.payload;
      state.ConversationOverview.set(overview.conversation_id, overview);
      state.ConversationDisplayOrder.unshift(overview.conversation_id);
    },
    deleteConversationOverview: (state, action) => {
      const conversationId = action.payload;
      state.ConversationOverview.delete(conversationId);
    },
    updateConversationOverview: (
      state,
      action: PayloadAction<Record<string, any>>
    ) => {
      const { conversationId, ...updates } = action.payload;
      const existingOverview = state.ConversationOverview.get(conversationId);
      if (existingOverview) {
        state.ConversationOverview.set(conversationId, {
          ...existingOverview,
          ...updates,
        });
      } else {
        console.warn(
          `Conversation with ID ${conversationId} does not exist for update.`
        );
      }
    },
    addToConversationDisplayOrder: (state, action: PayloadAction<string>) => {
      const conversationId = action.payload;
      if (!state.ConversationDisplayOrder.includes(conversationId)) {
        state.ConversationDisplayOrder.unshift(conversationId);
      } else {
        console.warn(
          `Conversation with ID ${conversationId} already exists in display order.`
        );
      }
    },
    removeFromConversationDisplayOrder: (
      state,
      action: PayloadAction<string>
    ) => {
      const conversationId = action.payload;
      state.ConversationDisplayOrder = state.ConversationDisplayOrder.filter(
        (id) => id !== conversationId
      );
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInDeviceChatOverviewThunk.pending, (state) => {
        state.conversationtLoading = true;
      })
      .addCase(fetchInDeviceChatOverviewThunk.fulfilled, (state, action) => {
        state.ConversationOverview = action.payload.conversationOverviewMap;
        state.ConversationDisplayOrder = action.payload.conversationIds;
        state.conversationtLoading = false;
      })
      .addCase(fetchInDeviceChatOverviewThunk.rejected, (state) => {
        state.conversationtLoading = false;
      })
      .addCase(addNewConversationThunk.fulfilled, (state, action) => {
        const overview = action.payload;
        state.ConversationOverview.set(
          overview[0].conversation_id,
          overview[0]
        );
        if (
          !state.ConversationDisplayOrder.includes(overview[0].conversation_id)
        ) {
          state.ConversationDisplayOrder.unshift(overview[0].conversation_id);
        }
      });
  },
});

export const {
  addConversationOverview,
  deleteConversationOverview,
  updateConversationOverview,
  addToConversationDisplayOrder,
  removeFromConversationDisplayOrder,
} = chatSlice.actions;
export default chatSlice.reducer;
