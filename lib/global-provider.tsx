import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useSupabase } from "./useSupabase";
import {
  ConversationOverviewReturnType,
  deleteFromMessages,
  FilterDetailReturnType,
  getAgentData,
  getConversationUnreceivedMessages,
  getCurrentUser,
  getFilterDetail,
  getFromConversation,
  getWishlistedPropertyId,
  Message,
  Supabase,
  updateConversationSupabase,
  updateWishlist,
} from "./supabase";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { PostgrestError, RealtimeChannel } from "@supabase/supabase-js";
import { cacheProfileImage } from "./database/saveFiles";
import { addNetworkStateListener, getNetworkStateAsync } from "expo-network";

interface User {
  id: string | undefined;
  avatar_url: string | undefined;
  email: string | undefined;
  full_name: string | undefined;
}

interface wishlistManagerType {
  propertyIds: Set<string> | null;
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
  // isLoggedIn: boolean;
  // user: User | null;
  // loading: boolean;
  // refetch: (newParams: Record<string, ParamValue>) => Promise<void>;
  bottomSheetModalRef: React.RefObject<(BottomSheetModal | null)[]>;
  filterDetail: {
    data: FilterDetailReturnType | null;
    error: PostgrestError | null;
  } | null;
  wishlistManager: wishlistManagerType;
  setWishlistManager: React.Dispatch<React.SetStateAction<wishlistManagerType>>;
  chatOverviewManager: Map<string, ConversationOverviewReturnType>;
  setChatOverviewManager: React.Dispatch<
    React.SetStateAction<Map<string, ConversationOverviewReturnType>>
  >;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [wishlistManager, setWishlistManager] = useState<wishlistManagerType>({
    propertyIds: new Set<string>(),
    operation: null,
    changeId: "",
  });
  const [chatOverviewManager, setChatOverviewManager] = useState<
    Map<string, ConversationOverviewReturnType>
  >(new Map());
  const chatOverviewRef = useRef<Map<string, ConversationOverviewReturnType>>(
    new Map()
  );
  const newArrivedConversationQueueRef = useRef(Promise.resolve());
  const newConversationMessageSyncQueueRef = useRef(Promise.resolve());
  const newAgentAvatarSyncQueueRef = useRef(Promise.resolve());
  const channelRef = useRef<RealtimeChannel | null>(null);

  // const {
  //   data: user,
  //   loading,
  //   refetch,
  // } = useSupabase({
  //   fn: getCurrentUser,
  // });

  const { data: filterDetail } = useSupabase({
    fn: getFilterDetail,
  });

  // const { data: inDeviceChatOverview, refetch: fetchInDeviceChatOverview } =
  //   useSupabase({
  //     fn: getAllConversationOverviews,
  //     params: {
  //       range: [0, 20],
  //     },
  //   });

  // const processUnreceivedMessages = async () => {
  //   if (user) {
  //     while (true) {
  //       const chatUnreadQueuedMessages =
  //         await getConversationUnreceivedMessages({
  //           user_id: user.id,
  //           limit: 20,
  //         });
  //       console.log("inside");
  //       if (chatUnreadQueuedMessages) {
  //         if (chatUnreadQueuedMessages.length === 0) break;
  //         else {
  //           for await (const element of chatUnreadQueuedMessages) {
  //             await insertMessages(element.all_messages);
  //             await updateConversation(element.conversation_id, {
  //               "unread_count+": element.unread_count,
  //             });
  //             await deleteFromMessages({
  //               conversation_id: element.conversation_id,
  //             });
  //           }
  //         }
  //       } else {
  //         break;
  //       }
  //     }
  //     fetchInDeviceChatOverview({
  //       range: [0, 20],
  //     });
  //   }
  // };

  // useEffect(() => {
  //   if (inDeviceChatOverview && inDeviceChatOverview.length > 0) {
  //     let chatOverviewMap = new Map<string, ConversationOverviewReturnType>();
  //     for (const chat of inDeviceChatOverview) {
  //       chatOverviewMap.set(chat.conversation_id, chat);
  //       enqueueToCheckNewConversationAvatar(chat.conversation_id, {
  //         agentId: chat.agent_id,
  //         avatarLastUpdate: chat.avatar_last_update,
  //       });
  //     }
  //     setChatOverviewManager(chatOverviewMap);
  //   }
  // }, [inDeviceChatOverview]);

  // useEffect(() => {
  //   chatOverviewRef.current = chatOverviewManager;
  // }, [chatOverviewManager]);

  // const addNewConversation = useCallback(async (message: Message) => {
  //   let newChatOverview = await getConversationOverview(
  //     message.conversation_id
  //   );
  //   if (newChatOverview) {
  //     newChatOverview[0].last_message = message.message;
  //     newChatOverview[0].last_message_time = message.created_at;
  //     newChatOverview[0].last_message_sender_id = message.sender_id;
  //     newChatOverview[0].unread_count = newChatOverview[0].unread_count + 1;
  //     const newMap = new Map([
  //       [newChatOverview[0].conversation_id, newChatOverview[0]],
  //       ...chatOverviewRef.current,
  //     ]);
  //     updateConversation(newChatOverview[0].conversation_id, {
  //       "unread_count+": 1,
  //     });
  //     setChatOverviewManager(newMap);
  //     enqueueToCheckNewConversationAvatar(newChatOverview[0].conversation_id, {
  //       agentId: newChatOverview[0].agent_id,
  //       avatarLastUpdate: newChatOverview[0].avatar_last_update,
  //     });
  //   }
  // }, []);

  // const enqueueNewArrivedConversation = (message: Message) => {
  //   newArrivedConversationQueueRef.current =
  //     newArrivedConversationQueueRef.current
  //       .then(() => addNewConversation(message))
  //       .catch((e) =>
  //         console.error("error in new arrived conversation queue: ", e)
  //       );
  // };

  // const checkNewConversationAvatarUpdate = useCallback(
  //   async (
  //     convId: string,
  //     agentDetail: { agentId: string; avatarLastUpdate: string }
  //   ) => {
  //     const newAgentAvatar = await getAgentData(agentDetail.agentId);
  //     if (newAgentAvatar) {
  //       if (
  //         new Date(newAgentAvatar.avatar.lastUpdate) >
  //         new Date(agentDetail.avatarLastUpdate)
  //       ) {
  //         enqueueNewAgentAvatar(
  //           convId,
  //           agentDetail.agentId,
  //           newAgentAvatar.avatar.url,
  //           newAgentAvatar.avatar.lastUpdate
  //         );
  //       }
  //     }
  //   },
  //   []
  // );

  // const enqueueToCheckNewConversationAvatar = (
  //   convId: string,
  //   agentDetail: {
  //     agentId: string;
  //     avatarLastUpdate: string;
  //   }
  // ) => {
  //   newConversationMessageSyncQueueRef.current =
  //     newConversationMessageSyncQueueRef.current
  //       .then(() => checkNewConversationAvatarUpdate(convId, agentDetail))
  //       .catch((e) => console.error("error in new conversation avatar: ", e));
  // };

  // const updateAgentAvatar = useCallback(
  //   async (
  //     convId: string,
  //     agentId: string,
  //     agentAvatar: string,
  //     avatarLastUpdate: string
  //   ) => {
  //     const conv = chatOverviewRef.current.get(convId);
  //     if (conv) {
  //       const uri = await cacheProfileImage(agentAvatar, agentId);
  //       if (uri) {
  //         conv.agent_avatar = uri;
  //         const newMap = new Map(chatOverviewRef.current);
  //         newMap.set(convId, conv);
  //         setChatOverviewManager(newMap);
  //         updateConversation(convId, {
  //           agent_avatar: uri,
  //           avatar_last_update: avatarLastUpdate,
  //         });
  //       }
  //     }
  //   },
  //   []
  // );

  // const enqueueNewAgentAvatar = (
  //   convId: string,
  //   agentId: string,
  //   agentAvatar: string,
  //   avatarLastUpdate: string
  // ) => {
  //   newAgentAvatarSyncQueueRef.current = newAgentAvatarSyncQueueRef.current
  //     .then(() =>
  //       updateAgentAvatar(convId, agentId, agentAvatar, avatarLastUpdate)
  //     )
  //     .catch((e) => console.error("error in new agent avatar queue: ", e));
  // };

  // const sendRes = useCallback(
  //   (msgId: string, conversation_id: string) => {
  //     if (channelRef.current) {
  //       channelRef.current.send({
  //         type: "broadcast",
  //         event: "received",
  //         payload: {
  //           msgId,
  //           convId: conversation_id,
  //         },
  //       });
  //     }
  //   },
  //   [channelRef.current]
  // );

  // const handleMessageRead = useCallback((conversation_id: string) => {
  //   if (chatOverviewRef.current) {
  //     const newMap = new Map(chatOverviewRef.current);
  //     const conv = newMap.get(conversation_id);
  //     if (conv) {
  //       newMap.set(conversation_id, { ...conv, last_message_status: "read" });
  //     }
  //     setChatOverviewManager(newMap);
  //     updateMessage({
  //       msg: { status: "read" },
  //       checkCondition: {
  //         status: "read",
  //         conversation_id: conversation_id,
  //       },
  //       conditionSeperator: "AND",
  //       conditionOperator: {
  //         conversation_id: "=",
  //         status: "<>",
  //       },
  //     });
  //   }
  // }, []);

  // const handleMessageRes = useCallback(
  //   (conversation_id: string, agent_id: string) => {
  //     if (chatOverviewRef.current) {
  //       if (conversation_id === "") {
  //         for (const [key, conv] of chatOverviewRef.current) {
  //           if (conv.agent_id === agent_id) {
  //             const updatedConv = { ...conv, last_message_status: "received" };

  //             // Create a shallow copy of the map with updated item
  //             const newMap = new Map(chatOverviewRef.current);
  //             newMap.set(key, updatedConv);

  //             // Update the ref and state
  //             setChatOverviewManager(newMap);
  //             break;
  //           }
  //         }
  //         updateMessage({
  //           msg: { status: "received" },
  //           checkCondition: {
  //             status: "sent",
  //             receiver_id: agent_id,
  //           },
  //           conditionSeperator: "AND",
  //           conditionOperator: {
  //             status: "=",
  //             receiver_id: "=",
  //           },
  //         });
  //       } else {
  //         const newMap = new Map(chatOverviewRef.current);
  //         const conv = chatOverviewRef.current.get(conversation_id);
  //         if (conv) {
  //           conv.last_message_status = "received";
  //           newMap.set(conversation_id, conv);
  //         }
  //         setChatOverviewManager(chatOverviewRef.current);
  //         updateMessage({
  //           msg: { status: "received" },
  //           checkCondition: {
  //             status: "sent",
  //             conversation_id: conversation_id,
  //           },
  //           conditionSeperator: "AND",
  //           conditionOperator: {
  //             converesation_id: "=",
  //             status: "=",
  //           },
  //         });
  //       }
  //     }
  //   },
  //   []
  // );

  // const initiateChannel = useCallback(() => {
  //   if (!channelRef.current) {
  //     const channel = Supabase.channel(`user: ${user?.id}`, {
  //       config: {
  //         presence: { key: user?.id },
  //       },
  //     });
  //     channel
  //       .on(
  //         "presence",
  //         {
  //           event: "sync",
  //         },
  //         () => {
  //           const state = channel.presenceState();
  //           const onlineUsers = Object.values(state).flat();
  //           console.log(onlineUsers);
  //         }
  //       )
  //       .on("broadcast", { event: "res" }, (payload) => {
  //         handleMessageRes(payload.payload.convId, payload.payload.agentId);
  //         updateConversationSupabase({
  //           columnClaus: { user_message_status: null },
  //           comparisionClaus: {
  //             conversation_id: payload.payload.convId,
  //           },
  //         });
  //       })
  //       .on("broadcast", { event: "read" }, (payload) => {
  //         handleMessageRead(payload.payload.convId);
  //         updateConversationSupabase({
  //           columnClaus: { user_message_status: null },
  //           comparisionClaus: {
  //             conversation_id: payload.payload.convId,
  //           },
  //         });
  //       })
  //       .on("broadcast", { event: "shout" }, (payload) => {
  //         const data: Message = payload.payload.message;
  //         sendRes(data.id, data.conversation_id);
  //         if (chatOverviewRef.current.get(data.conversation_id)) {
  //           const newMap = new Map(chatOverviewRef.current);
  //           const conv: ConversationOverviewReturnType = newMap.get(
  //             data.conversation_id
  //           )!;
  //           newMap.delete(data.conversation_id);
  //           setChatOverviewManager(
  //             new Map([
  //               [
  //                 data.conversation_id,
  //                 {
  //                   ...conv,
  //                   last_message: data.message,
  //                   last_message_time: data.created_at,
  //                   unread_count: (conv?.unread_count ?? 0) + 1,
  //                 },
  //               ],
  //               ...newMap,
  //             ])
  //           );
  //           updateConversation(data.conversation_id, {
  //             unread_count: (conv.unread_count ?? 0) + 1,
  //           });
  //         } else {
  //           enqueueNewArrivedConversation(data);
  //         }
  //         insertMessages([data]);
  //       })
  //       .subscribe((status) => {
  //         if (status === "SUBSCRIBED") {
  //           channel.track({
  //             user_id: user?.id,
  //             last_seen: new Date().toISOString(),
  //           });
  //         }
  //       });
  //     channelRef.current = channel;
  //   }
  // }, [user]);

  // const messageStatus = async () => {
  //   const message_status = await getFromConversation<string, string>({
  //     comparisionClaus: { user: user?.id! },
  //     column: ["id", "user_message_status"],
  //   });
  //   if (message_status) {
  //     for (const element of message_status) {
  //       if (element.user_message_status) {
  //         updateMessage({
  //           msg: {
  //             status: element.user_message_status,
  //           },
  //           checkCondition: {
  //             conversation_id: element.id,
  //             status: element.user_message_status,
  //           },
  //           conditionSeperator: "AND",
  //           conditionOperator: {
  //             conversation_id: "=",
  //             status: "<>",
  //           },
  //         });
  //         if (chatOverviewRef.current) {
  //           let conv = chatOverviewRef.current.get(element.id);
  //           if (conv) {
  //             conv.last_message_status = element.user_message_status;
  //             chatOverviewRef.current.set(element.id, conv);
  //           }
  //         }
  //         updateConversationSupabase({
  //           comparisionClaus: {
  //             id: element.id,
  //           },
  //           columnClaus: {
  //             user_message_status: null,
  //           },
  //         });
  //       }
  //     }
  //     setChatOverviewManager(chatOverviewRef.current);
  //   }
  // };

  // useEffect(() => {
  //   if (channelRef.current) {
  //     Supabase.removeChannel(channelRef.current);
  //     channelRef.current = null;
  //   }
  //   let subscription: any;
  //   if (user) {
  //     const checkInitial = async () => {
  //       try {
  //         const state = await getNetworkStateAsync();
  //         console.log("Initial check:", state.isConnected);
  //         if (state.isConnected) {
  //           try {
  //             initiateChannel();
  //             await processUnreceivedMessages();
  //             await updateConversationSupabase({
  //               columnClaus: { agent_message_status: "received" },
  //               comparisionClaus: {
  //                 user: user.id!,
  //               },
  //             });
  //             await messageStatus();
  //           } catch (error) {
  //             console.error(error);
  //           }
  //         }
  //       } catch (error) {
  //         console.error(error);
  //       }
  //     };

  //     checkInitial();

  //     let timer: NodeJS.Timeout;
  //     subscription = addNetworkStateListener(
  //       ({ type, isConnected, isInternetReachable }) => {
  //         if (isConnected) {
  //           try {
  //             clearTimeout(timer);
  //             timer = setTimeout(() => {
  //               processUnreceivedMessages();
  //               initiateChannel();
  //               messageStatus();
  //             }, 500);
  //           } catch (error) {
  //             console.error("Message processing failed: ", error);
  //           }
  //         } else {
  //           if (channelRef.current) {
  //             Supabase.removeChannel(channelRef.current);
  //             channelRef.current = null;
  //           }
  //         }
  //       }
  //     );
  //   }

  //   return () => {
  //     if (subscription) {
  //       subscription.remove();
  //     }
  //   };
  // }, [user]);

  const bottomSheetModalRef = useRef<Array<BottomSheetModal | null>>([]);

  // const isLoggedIn = !!user;
  return (
    <GlobalContext.Provider
      value={{
        bottomSheetModalRef,
        filterDetail,
        wishlistManager,
        setWishlistManager,
        chatOverviewManager,
        setChatOverviewManager,
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
