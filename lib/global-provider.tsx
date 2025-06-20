import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSupabase } from "./useSupabase";
import {
  changeMessageStatus,
  ChatOverviewReturnType,
  ChatReturnType,
  FilterDetailReturnType,
  getAgentData,
  getChatOverview,
  getConverationIds,
  getCurrentUser,
  getFilterDetail,
  getPropertyById,
  getWishlistedPropertyId,
  Message,
  PropertyReturnType,
  Supabase,
  updateWishlist,
} from "./supabase";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  saveFile,
  saveProfileImage,
  savePropertyImage,
} from "./database/saveFiles";
import {
  getAllChatOverviews,
  getChatOverviews,
  insertMessage,
  updateConversation,
  updateMessage,
} from "./database/chatServices";

interface User {
  id: string | undefined;
  avatar_url: string | undefined;
  email: string | undefined;
  full_name: string | undefined;
}

interface wishlistManagerType {
  propertyIds: Array<string | null> | [] | null;
  operation: "insert" | "delete" | null;
  changeId: string;
}

type ParamValue =
  | string
  | number
  | Array<number | string | Partial<any>>
  | undefined
  | null;

interface GlobalContextType {
  isLoggedIn: boolean;
  user: User | null;
  loading: boolean;
  refetch: (newParams: Record<string, ParamValue>) => Promise<void>;
  bottomSheetModalRef: React.RefObject<(BottomSheetModal | null)[]>;
  filterDetail: FilterDetailReturnType | null;
  wishlistManager: wishlistManagerType;
  setWishlistManager: React.Dispatch<React.SetStateAction<wishlistManagerType>>;
  chatOverviewManager: Array<ChatOverviewReturnType>;
  setChatOverviewManager: React.Dispatch<
    React.SetStateAction<Array<ChatOverviewReturnType>>
  >;
  setActiveConversationId: React.Dispatch<React.SetStateAction<string>>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistManager, setWishlistManager] = useState<wishlistManagerType>({
    propertyIds: [],
    operation: null,
    changeId: "",
  });
  const [chatOverviewManager, setChatOverviewManager] = useState<
    Array<ChatOverviewReturnType>
  >([]);
  const [conversationSyncTime, setConversationSyncTime] = useState<
    Array<{ conversation_id: string; last_message_time: Date }>
  >([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [newMessageSyncQueue, setNewMessageSyncQueue] = useState<
    Array<Message>
  >([]);
  const [updateMessageSyncQueue, setUpdateMessageSyncQueue] = useState<
    Array<Message>
  >([]);
  const [newConversationSyncQueue, setNewConversationSyncQueue] = useState<
    Array<Message>
  >([]);
  const [newAgentAvatarSyncQueue, setNewAgentAvatarSyncQueue] = useState<
    Array<Message>
  >([]);

  const {
    data: user,
    loading,
    refetch,
  } = useSupabase({
    fn: getCurrentUser,
  });

  const { data: chatOverView, refetch: fetchChatOverview } = useSupabase({
    fn: getChatOverview,
    params: {
      user_id: user?.id,
      range: [0, 15],
      conversation_arr: conversationSyncTime,
    },
    skip: true,
  });

  const { data: wishlists, refetch: refetchWishlist } = useSupabase({
    fn: getWishlistedPropertyId,
    params: {
      userId: user?.id,
    },
    skip: true,
  });

  const { refetch: UpdateWishlist } = useSupabase({
    fn: updateWishlist,
    params: {
      propertyId: wishlistManager.changeId,
      userId: user?.id,
      operation: wishlistManager?.operation,
    },
    skip: true,
  });

  const { data: filterDetail } = useSupabase({
    fn: getFilterDetail,
  });

  const { data: inDeviceChatOverview } = useSupabase({
    fn: getAllChatOverviews,
    params: {
      range: [0, 15],
    },
  });

  useEffect(() => {
    refetchWishlist({
      userId: user?.id,
    });
    fetchChatOverview({
      user_id: user?.id,
      range: [0, 15],
      conversation_arr: conversationSyncTime,
    });
  }, [user]);

  useEffect(() => {
    if (inDeviceChatOverview) {
      for (const chat of inDeviceChatOverview) {
        setConversationSyncTime((prev) => [
          ...prev,
          {
            conversation_id: chat.conversation_id,
            last_message_time: new Date(chat?.last_message_time ?? 0),
          },
        ]);
        setChatOverviewManager(inDeviceChatOverview);
      }
    }
  }, [inDeviceChatOverview]);

  useEffect(() => {
    if (wishlistManager.operation === "insert") {
      UpdateWishlist({
        propertyId: wishlistManager.changeId,
        userId: user?.id,
        operation: wishlistManager.operation,
      });
    } else if (wishlistManager.operation === "delete") {
      UpdateWishlist({
        propertyId: wishlistManager.changeId,
        userId: user?.id,
        operation: wishlistManager.operation,
      });
    }
  }, [wishlistManager.propertyIds]);

  useEffect(() => {
    updateNewMessageIntoDeviceStore();
  }, [updateMessageSyncQueue]);

  const updateNewMessageIntoDeviceStore = async () => {
    try {
      if (updateMessageSyncQueue) {
        const dummyMessageUpdateQueue = [...updateMessageSyncQueue];
        for (const message of dummyMessageUpdateQueue) {
          delete message.identifier_agent;
          delete message.identifier_user;
          updateMessage(message, message.id);
          changeMessageStatus(message.conversation_id, "received");
          setUpdateMessageSyncQueue((prev) =>
            prev.filter((item) => item.id !== message.id)
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (wishlists) {
      setWishlistManager((prev) => ({
        ...prev,
        propertyIds: wishlists.map((obj) => obj.property),
      }));
    }
  }, [wishlists]);

  useEffect(() => {
    syncNewMessagesIntoDeviceStorage();
  }, [newMessageSyncQueue]);

  const syncNewMessagesIntoDeviceStorage = async () => {
    try {
      if (newMessageSyncQueue) {
        const dumyMessageSyncQueue = [...newMessageSyncQueue];

        for (const message of dumyMessageSyncQueue) {
          updateConversation(message.conversation_id, {
            last_message: message.created_at,
          });

          if (message.property_ref) {
            message.property_ref = {
              id: message.property_ref as string,
            };
          }
          delete message.identifier_user;
          delete message.identifier_agent;

          insertMessage([message]);
          setNewMessageSyncQueue((prev) =>
            prev.filter(
              (item) => item.conversation_id !== message.conversation_id
            )
          );
        }
      }
    } catch (error) {}
  };

  useEffect(() => {
    updateChatOverviewForNewMessage();
  }, [newConversationSyncQueue]);
  useEffect(() => {
    handleNewAgentAvatar();
  }, [newAgentAvatarSyncQueue]);

  const updateChatOverviewForNewMessage = async () => {
    try {
      if (newConversationSyncQueue) {
        const copyQueue = [...newConversationSyncQueue];

        for (const queue of copyQueue) {
          let newChatOverView = await getChatOverviews(queue.conversation_id);
          newChatOverView[0].unread_count =
            newChatOverView[0].unread_count ?? 0 + 1;
          setChatOverviewManager((prev) => [newChatOverView[0], ...prev]);
          setNewAgentAvatarSyncQueue((prev) => [...prev, queue]);
          setNewConversationSyncQueue((prev) =>
            prev.filter(
              (item) =>
                item.conversation_id !== newChatOverView[0].conversation_id
            )
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleNewAgentAvatar = async () => {
    try {
      if (newAgentAvatarSyncQueue) {
        const dummyAgentAvatarQueue = [...newAgentAvatarSyncQueue];
        for (const message of dummyAgentAvatarQueue) {
          const newChatOverView = chatOverviewManager.filter(
            (prev) => prev.conversation_id === message.conversation_id
          )[0];
          const agentData = await getAgentData(newChatOverView.agent_id);
          if (
            agentData &&
            new Date(agentData?.avatar.lastUpdate) >
              new Date(newChatOverView.avatar_last_update)
          ) {
            newChatOverView.agent_avatar = agentData?.avatar.url;
            newChatOverView.avatar_last_update = agentData?.avatar.lastUpdate;
            setChatOverviewManager((prev) =>
              prev.map((item) =>
                item.conversation_id === newChatOverView.conversation_id
                  ? {
                      ...item,
                      agent_avatar: agentData.avatar.url,
                      avatar_last_update: agentData.avatar.lastUpdate,
                    }
                  : item
              )
            );

            const updatedAvatarLink = await saveProfileImage(
              agentData?.avatar.url,
              newChatOverView.agent_id
            );

            setChatOverviewManager((prev) =>
              prev.map((item) =>
                item.conversation_id === message.conversation_id
                  ? {
                      ...item,
                      avatar_last_update: agentData.avatar.lastUpdate,
                      agent_avatar: updatedAvatarLink,
                    }
                  : item
              )
            );

            updateConversation(newChatOverView.conversation_id, {
              agent_avatar: updatedAvatarLink,
              avatar_last_update: agentData?.avatar.lastUpdate,
            });
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleChatOverView = async () => {
    if (chatOverView) {
      for (const chat of chatOverView) {
        let oldChat = chatOverviewManager.filter(
          (item) => (item.conversation_id = chat.conversation_id)
        )[0];
        oldChat.last_message_time = chat.last_message_time;

        setChatOverviewManager((prev) =>
          prev.filter((item) => item.conversation_id !== chat.conversation_id)
        );
        setChatOverviewManager((prev) => [chat, ...prev]);

        if (
          new Date(oldChat.avatar_last_update) <
          new Date(chat.avatar_last_update)
        ) {
          const updatedAvatarLink = await saveProfileImage(
            chat.agent_avatar,
            chat.agent_id
          );

          oldChat.agent_avatar = updatedAvatarLink;
          oldChat.avatar_last_update = chat.avatar_last_update;
        }

        if (chat.unread_messages) {
          let tempUnreadMessage = chat.unread_messages;
          const propertyIdArr = tempUnreadMessage
            .map((item) => item.property_ref)
            .filter((item) => item);

          if (propertyIdArr.length > 0) {
            let propertyDetail = await getPropertyById(propertyIdArr);
            if (propertyDetail) {
              for (let i = 0; i < propertyDetail?.length; i++) {
                const uploadLink = await savePropertyImage(
                  propertyDetail[i].image,
                  propertyDetail[i].id
                );
                propertyDetail[i].image = uploadLink;
              }
              tempUnreadMessage = tempUnreadMessage.map((item) => ({
                ...item,
                property_ref: propertyDetail.filter(
                  (prop) => prop.id === item.property_ref
                )[0],
              }));
              insertMessage(tempUnreadMessage);
            }
          }
        }

        delete chat.unread_messages;
        delete chat.last_file;
        delete chat.last_property_ref;
        delete chat.last_message;

        if ((chat.unread_count = 0)) delete chat.unread_count;

        updateConversation(chat.conversation_id, chat);
      }
    }
  };

  useEffect(() => {
    handleChatOverView();
  }, [chatOverView]);

  useEffect(() => {
    let channel = null;
    if (user) {
      channel = Supabase.channel(`conversation=${user?.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "messages",
            filter: `identifier_user=eq.${user?.id}`,
          },
          (payload) => {
            let newData: Message = payload.new as Message;
            switch (payload.eventType) {
              case "INSERT":
                const conversationToUpdate = chatOverviewManager.filter(
                  (item) => item.conversation_id === newData.conversation_id
                )[0];
                if (conversationToUpdate) {
                  setChatOverviewManager((prev) => [
                    {
                      ...conversationToUpdate,
                      last_message: newData.message,
                      last_file: newData.file,
                      last_property_ref: newData.property_ref,
                      last_message_time: newData.created_at,
                      unread_count:
                        newData.conversation_id !== activeConversationId
                          ? conversationToUpdate.unread_count ?? 0 + 1
                          : 0,
                    },
                    ...prev.filter(
                      (item) => item.conversation_id !== newData.conversation_id
                    ),
                  ]);
                  updateConversation(newData.conversation_id, {
                    unread_count: conversationToUpdate.unread_count ?? 0 + 1,
                    last_message_time: newData.created_at,
                  });
                } else {
                  if (
                    newConversationSyncQueue.filter(
                      (item) => item.conversation_id === newData.conversation_id
                    )[0]
                  ) {
                    setNewConversationSyncQueue((prev) => [
                      ...prev.filter(
                        (item) =>
                          item.conversation_id !== newData.conversation_id
                      ),
                      newData,
                    ]);
                  } else {
                    setNewConversationSyncQueue((prev) => [...prev, newData]);
                  }
                }
                if (newData.conversation_id !== activeConversationId)
                  setNewMessageSyncQueue((prev) => [...prev, newData]);
                break;
              case "UPDATE":
                if (newData.conversation_id !== activeConversationId)
                  setUpdateMessageSyncQueue((prev) => [...prev, newData]);
                break;
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (channel) {
        Supabase.removeChannel(channel);
      }
    };
  }, [user]);

  const bottomSheetModalRef = useRef<Array<BottomSheetModal | null>>([]);

  const isLoggedIn = !!user;
  return (
    <GlobalContext.Provider
      value={{
        refetch,
        user,
        loading,
        isLoggedIn,
        bottomSheetModalRef,
        filterDetail,
        wishlistManager,
        setWishlistManager,
        chatOverviewManager,
        setChatOverviewManager,
        setActiveConversationId,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = (): GlobalContextType => {
  const context = useContext(GlobalContext);

  if (!context) {
    throw new Error("useGlobalContext must be used within a GlobalProvider");
  }

  return context;
};

export default GlobalProvider;
