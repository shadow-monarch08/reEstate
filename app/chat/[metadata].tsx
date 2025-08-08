import { View, Text, FlatList, TouchableOpacity } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "react-native";
import icons from "@/constants/icons";
import { useSupabase } from "@/lib/useSupabase";
import {
  ConversationOverviewReturnType,
  createConversation,
  deleteFromMessages,
  getFromConversation,
  getUnreceivedMessages,
  insertInMessages,
  Message,
  Supabase,
  updateConversationSupabase,
} from "@/lib/supabase";
import ChatInput from "@/components/ChatInput";
import { useGlobalContext } from "@/lib/global-provider";
import {
  getMessagesByConversation,
  insertConversation,
  insertMessages,
  updateConversation,
  updateMessage,
} from "@/lib/database/chatServices";
import { RealtimeChannel } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";
import { addNetworkStateListener, getNetworkStateAsync } from "expo-network";
import { simpleFormatTimestamp } from "@/utils";

interface Metadata {
  conversation_id: string;
  avatar_url: string;
  agent_name: string;
  agent_id: string;
  avatar_last_update: string;
  isFirstMessage: boolean;
}

const HeaderComponent = React.memo(
  ({ chatMetadata }: { chatMetadata: Metadata | null | undefined }) => {
    return (
      <View className="shadow-slate-200 shadow-lg bg-accent-100 flex px-5 py-4 flex-row justify-between w-full items-center">
        <View className="flex flex-row gap-2 items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={icons.back_arrow} className="size-7" />
          </TouchableOpacity>
          <View className="overflow-hidden size-14 rounded-full">
            <Image
              src={chatMetadata?.avatar_url}
              className="h-14 w-16"
              resizeMode="cover"
            />
          </View>
          <Text className="text-xl font-rubik-medium text-black-300">
            {chatMetadata?.agent_name}
          </Text>
        </View>
        <View className="flex flex-row gap-3 items-center">
          <TouchableOpacity>
            <Image
              source={icons.phone}
              className="size-8"
              tintColor="#191D31"
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={icons.video}
              className="size-8"
              tintColor="#191D31"
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

const FullChat = () => {
  const { chatOverviewManager, setChatOverviewManager, user } =
    useGlobalContext();
  const params = useLocalSearchParams<{ metadata: string }>();
  const [chatMetadata, setChatMetadata] = useState<Metadata | null>(null);
  const [isFirstInstance, setIsFirstInstance] = useState(false);
  const [chat, setChat] = useState<Map<string, Message> | null>(null);
  const [isAgentOnline, setIsAgentOnline] = useState<boolean>(false);
  const [status, setStatus] = useState<"sent" | "received" | "read">("sent");
  const [message, setMessage] = useState("");
  const channelRef = useRef<{
    channel1: RealtimeChannel | null;
    channel2: RealtimeChannel | null;
  }>({
    channel1: null,
    channel2: null,
  });
  const chatRef = useRef<Map<string, Message> | null>(null);
  const statusRef = useRef<"sent" | "received" | "read">("sent");
  const channelStatusRef = useRef<{ channel1: boolean; channel2: boolean }>({
    channel1: false,
    channel2: false,
  });

  const {
    data: completeChat,
    loading: chatLoading,
    refetch: fetchChat,
  } = useSupabase({
    fn: getMessagesByConversation,
    params: {
      conversationId: chatMetadata?.conversation_id,
      range: [0, 30],
    },
    skip: true,
  });

  useEffect(() => {
    chatRef.current = chat;
  }, [chat]);

  const handleUserSync = useCallback(
    (conversation_id: string) => {
      if (chatRef.current) {
        if (
          Array.from(chatRef.current?.values() ?? []).find(
            (item) => item.status === "received"
          )
        ) {
          const newMap = new Map(chatRef.current);
          for (const [key, value] of chatRef.current) {
            if (value.status !== "received") break;
            newMap.set(key, { ...value, status: "read" });
          }
          setChat(newMap);
          const conv = chatOverviewManager.get(conversation_id);
          if (conv) {
            conv.last_message_status = "read";
            setChatOverviewManager((prev) => {
              const newMap = new Map(prev);
              newMap.set(conversation_id, conv);
              return newMap;
            });
          }
          updateMessage({
            msg: { status: "read" },
            checkCondition: {
              status: "received",
              conversation_id: conversation_id,
            },
            conditionOperator: {
              conversation_id: "=",
            },
            conditionSeperator: "AND",
          });
        }
      }
    },
    [chat]
  );

  const handelAgentSync = useCallback(
    (conversation_id: string) => {
      if (chatRef.current) {
        if (
          Array.from(chatRef.current?.values() ?? []).find(
            (item) => item.status === "sent"
          )
        ) {
          const newMap = new Map(chatRef.current);
          for (const [key, value] of chatRef.current) {
            if (value.status !== "sent") break;
            newMap.set(key, { ...value, status: "received" });
          }
          setChat(newMap);
          const conv = chatOverviewManager.get(conversation_id);
          if (conv) {
            conv.last_message_status = "received";
            setChatOverviewManager((prev) => {
              const newMap = new Map(prev);
              newMap.set(conversation_id, conv);
              return newMap;
            });
          }
          updateMessage({
            msg: { status: "received" },
            checkCondition: {
              status: "sent",
              conversation_id: conversation_id,
            },
            conditionOperator: { conversation_id: "=" },
            conditionSeperator: "AND",
          });
        }
      }
    },
    [chat]
  );

  const handleMessageRead = useCallback(
    (conversation_id: string, msgId: string) => {
      if (chatRef.current) {
        if (msgId === "") {
          const newMap = new Map(chatRef.current);
          for (const [key, value] of chatRef.current) {
            if (value.status !== "sent" && value.status !== "received") break;
            newMap.set(key, { ...value, status: "read" });
          }
          setChat(newMap);
        } else {
          const newMap = new Map(chatRef.current);
          const msg = newMap.get(msgId);
          if (msg) {
            newMap.set(msgId, { ...msg, status: "read" });
          }
          setChat(newMap);
        }
        setChatOverviewManager((prev) => {
          const newMap = new Map(prev);
          const conv = prev.get(conversation_id);
          if (conv) {
            conv.last_message_status = "read";
            newMap.set(conversation_id, conv);
          }

          return newMap;
        });
        updateMessage({
          msg: { status: "read" },
          checkCondition: {
            status: "read",
            conversation_id: conversation_id,
          },
          conditionOperator: {
            status: "<>",
            conversation_id: "=",
          },
          conditionSeperator: "AND",
        });
      }
    },
    [chat]
  );

  const handleMessageRes = useCallback(
    (conversation_id: string, msgId: string, agentId: string) => {
      if (chatRef.current) {
        if (conversation_id === "") {
        }
        const newMap = new Map(chatRef.current);
        const msg = newMap.get(msgId);
        if (msg) {
          newMap.set(msgId, { ...msg, status: "received" });
        }
        setChat(newMap);
        setChatOverviewManager((prev) => {
          const newMap = new Map(prev);
          const conv = prev.get(conversation_id);
          if (conv) {
            conv.last_message_status = "received";
            newMap.set(conversation_id, conv);
          }

          return newMap;
        });
        updateMessage({
          msg: { status: "received" },
          checkCondition: {
            status: "sent",
            conversation_id: conversation_id,
          },
          conditionOperator: {
            conversation_id: "=",
          },
          conditionSeperator: "AND",
        });
      }
    },
    [chat]
  );

  const initiateChannel1 = useCallback(
    (conversation_id: string, metadata?: Metadata) => {
      if (!channelRef.current.channel1) {
        const channel = Supabase.channel(`conversation: ${conversation_id}`, {
          config: {
            presence: { key: user?.id },
          },
        });
        channel
          .on(
            "presence",
            {
              event: "sync",
            },
            () => {
              const state = channel.presenceState();
              const onlineUsers = Object.values(state).flat();
              console.log(onlineUsers);
              if (onlineUsers.length > 1) {
                handleUserSync(conversation_id);
                setStatus("received");
                channelStatusRef.current.channel1 = true;
              } else {
                channelStatusRef.current.channel1 = false;
              }
            }
          )
          .on("broadcast", { event: "read" }, (payload) => {
            handleMessageRead(payload.payload.convId, payload.payload.msgId);
            updateConversationSupabase({
              columnClaus: { user_message_status: null },
              comparisionClaus: {
                conversation_id: payload.payload.convId,
              },
            });
          })
          .on("broadcast", { event: "shout" }, (payload) => {
            const data: { message: Message } = payload.payload;
            sendRead(data.message.id, data.message.conversation_id);
            setChat((prev) => {
              const newMessage = new Map([[data.message.id, data.message]]);
              const newMap = new Map(prev);
              return new Map([...newMessage, ...newMap]);
            });
            if (metadata) {
              setChatOverviewManager((prev) => {
                const newMap = new Map(prev);
                newMap.delete(metadata.conversation_id);
                const newItemMap: Map<string, ConversationOverviewReturnType> =
                  new Map([
                    [
                      metadata.conversation_id,
                      {
                        conversation_id: metadata.conversation_id,
                        agent_id: metadata.agent_id,
                        agent_name: metadata.agent_name,
                        agent_avatar: metadata.avatar_url,
                        avatar_last_update: metadata.avatar_last_update,
                        unread_count: 0,
                        last_message: data.message.message,
                        last_message_status: data.message.status,
                        last_message_time: data.message.created_at,
                        last_message_sender_id: metadata.agent_id,
                      },
                    ],
                  ]);
                return new Map([...newItemMap, ...newMap]);
              });
            } else if (chatMetadata) {
              setChatOverviewManager((prev) => {
                const newMap = new Map(prev);
                newMap.delete(chatMetadata.conversation_id);
                const newItemMap: Map<string, ConversationOverviewReturnType> =
                  new Map([
                    [
                      chatMetadata.conversation_id,
                      {
                        conversation_id: chatMetadata.conversation_id,
                        agent_id: chatMetadata.agent_id,
                        agent_name: chatMetadata.agent_name,
                        agent_avatar: chatMetadata.avatar_url,
                        avatar_last_update: chatMetadata.avatar_last_update,
                        unread_count: 0,
                        last_message: data.message.message,
                        last_message_time: data.message.created_at,
                        last_message_status: status,
                        last_message_sender_id: chatMetadata.agent_id,
                      },
                    ],
                  ]);
                return new Map([...newItemMap, ...newMap]);
              });
            }
            insertMessages([data.message]);
            updateConversationSupabase({
              columnClaus: { agent_message_status: "read" },
              comparisionClaus: {
                conversation_id: data.message.conversation_id,
              },
            });
          })
          .subscribe((status) => {
            if (status === "SUBSCRIBED") {
              channel.track({
                user_id: user?.id,
                last_seen: new Date().toISOString(),
              });
            }
          });

        channelRef.current.channel1 = channel;
      }
    },
    [chatMetadata]
  );

  const initiateChannel2 = useCallback(
    (conversation_id: string, agent_id: string) => {
      if (!channelRef.current.channel2) {
        const channel = Supabase.channel(`agent: ${agent_id}`, {
          config: {
            presence: { key: user?.id },
          },
        });
        channel
          .on(
            "presence",
            {
              event: "sync",
            },
            () => {
              const state = channel.presenceState();
              const onlineUsers = Object.values(state).flat();
              console.log(onlineUsers);
              if (onlineUsers.length > 0) {
                handelAgentSync(conversation_id);
                channelStatusRef.current.channel2 = true;
                setStatus("sent");
              } else {
                channelStatusRef.current.channel2 = false;
              }
            }
          )
          .on("broadcast", { event: "res" }, (payload) => {
            if (!channelStatusRef.current.channel1) {
              handleMessageRes(
                conversation_id,
                payload.payload.msgId,
                agent_id
              );
            }
          })
          .subscribe();

        channelRef.current.channel2 = channel;
      }
    },
    [chatMetadata]
  );

  const processUnreceivedMessages = async (metadata: Metadata) => {
    if (user) {
      const chatUnreadQueuedMessages = await getUnreceivedMessages({
        conversationId: metadata.conversation_id,
        userId: user.id,
      });
      console.log("inside");
      if (chatUnreadQueuedMessages) {
        if (chatUnreadQueuedMessages.length === 0) return;
        else {
          const newMap = new Map(chatRef.current);
          for (const element of chatUnreadQueuedMessages[0].all_messages) {
            newMap.set(element.id, element);
          }
          setChat(newMap);
        }
      }
    }
  };

  const messageStatus = useCallback(async (metadata: Metadata) => {
    const message_status = await getFromConversation<string, string>({
      comparisionClaus: { id: metadata.conversation_id },
      column: ["user_message_status"],
    });
    if (message_status) {
      for (const element of message_status) {
        if (element.user_message_status) {
          if (chatRef.current) {
            const newMap = new Map(chatRef.current);
            for (const [key, value] of newMap) {
              if (value.status === element.user_message_status) break;
              newMap.set(key, {
                ...value,
                status: element.user_message_status,
              });
            }
            setChat(newMap);
          }
          updateConversationSupabase({
            comparisionClaus: {
              id: element.id,
            },
            columnClaus: {
              user_message_status: null,
            },
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    const metadata: Metadata = params.metadata
      ? JSON.parse(decodeURIComponent(params.metadata as string))
      : null;
    setChatMetadata(metadata);

    if (channelRef.current.channel1 && channelRef.current.channel2) {
      Supabase.removeChannel(channelRef.current.channel1);
      Supabase.removeChannel(channelRef.current.channel2);
      channelRef.current.channel1 = null;
      channelRef.current.channel2 = null;
    }
    let subscription: any;

    if (!metadata.isFirstMessage) {
      const checkInitial = async () => {
        try {
          const state = await getNetworkStateAsync();
          if (state.isConnected) {
            try {
              initiateChannel1(metadata.conversation_id, metadata);
              initiateChannel2(metadata.conversation_id, metadata.agent_id);
              await processUnreceivedMessages(metadata);
              await updateConversationSupabase({
                columnClaus: { agent_message_status: "read" },
                comparisionClaus: {
                  conversation_id: metadata.conversation_id,
                },
              });
              await messageStatus(metadata);
            } catch (error) {
              console.error(error);
            }
          }
        } catch (error) {
          console.error(error);
        }
      };

      checkInitial();

      let timer: NodeJS.Timeout;
      subscription = addNetworkStateListener(
        ({ type, isConnected, isInternetReachable }) => {
          console.log(isConnected);
          try {
            if (isConnected) {
              clearTimeout(timer);
              timer = setTimeout(() => {
                initiateChannel1(metadata.conversation_id, metadata);
                initiateChannel2(metadata.conversation_id, metadata.agent_id);
                processUnreceivedMessages(metadata);
                updateConversationSupabase({
                  columnClaus: { agent_message_status: "read" },
                  comparisionClaus: {
                    conversation_id: metadata.conversation_id,
                  },
                });
                messageStatus(metadata);
              }, 500);
            } else {
              if (channelRef.current.channel1 && channelRef.current.channel2) {
                Supabase.removeChannel(channelRef.current.channel1);
                Supabase.removeChannel(channelRef.current.channel2);
                channelRef.current.channel1 = null;
                channelRef.current.channel2 = null;
              }
            }
          } catch (error) {
            console.error("Message processing failed: ", error);
          }
        }
      );

      fetchChat({
        conversationId: metadata.conversation_id,
        range: [0, 30],
      });
      updateConversation(metadata.conversation_id, {
        unread_count: 0,
      });
      setChatOverviewManager((prev) => {
        const newMap = new Map(prev);
        const conv = newMap.get(metadata.conversation_id);
        if (conv) {
          conv.unread_count = 0;
          newMap.set(metadata.conversation_id, conv);
        }
        return newMap;
      });
      sendRead("", metadata.conversation_id);
    }

    return () => {
      if (subscription) {
        subscription.remove();
      }
      if (channelRef.current.channel1 && channelRef.current.channel2) {
        Supabase.removeChannel(channelRef.current.channel1);
        Supabase.removeChannel(channelRef.current.channel2);
        channelRef.current.channel1 = null;
        channelRef.current.channel2 = null;
      }
    };
  }, []);

  useEffect(() => {
    if (completeChat) {
      const newMap = new Map<string, Message>();
      completeChat.forEach((element) => {
        newMap.set(element.id, element);
      });
      setChat(newMap);
    }
  }, [completeChat]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const sendRead = useCallback(
    (msgId: string, conversation_id: string) => {
      if (channelRef.current.channel1 && channelRef.current.channel2) {
        if (channelStatusRef.current.channel1) {
          channelRef.current.channel1.send({
            type: "broadcast",
            event: "read",
            payload: {
              msgId,
              convId: conversation_id,
            },
          });
        } else {
          channelRef.current.channel2.send({
            type: "broadcast",
            event: "read",
            payload: {
              msgId,
              convId: conversation_id,
            },
          });
        }
      }
    },
    [channelRef.current.channel1]
  );

  const handleSendMessage = async () => {
    if (chatMetadata) {
      if (chatMetadata.isFirstMessage) {
        const conversationId = await createConversation({
          data: {
            agent_id: chatMetadata.agent_id,
            user_id: user?.id ?? "",
          },
        });
        if (conversationId) {
          insertConversation({
            conversation_id: conversationId.id,
            agent_id: chatMetadata.agent_id,
            agent_name: chatMetadata.agent_name,
            agent_avatar: chatMetadata.avatar_url,
            avatar_last_update: chatMetadata.avatar_last_update,
            unread_count: 0,
          });
          initiateChannel1(conversationId.id);
          initiateChannel2(conversationId.id, chatMetadata.agent_id);
          sendMessage(conversationId.id);
          setChatOverviewManager((prev) => {
            const newMap = new Map(prev);
            return new Map([
              [
                conversationId.id,
                {
                  conversation_id: conversationId.id,
                  agent_id: chatMetadata.agent_id,
                  agent_name: chatMetadata.agent_name,
                  agent_avatar: chatMetadata.avatar_url,
                  avatar_last_update: chatMetadata.avatar_last_update,
                  unread_count: 0,
                  last_message: message,
                  last_message_status: status,
                  last_message_time: new Date().toISOString(),
                  last_message_sender_id: user?.id ?? "",
                },
              ],
              ...newMap,
            ]);
          });
        }
        setChatMetadata((prev) => {
          if (prev) {
            return { ...prev, isFirstMessage: false };
          } else {
            return prev;
          }
        });
      } else {
        sendMessage();
        setChatOverviewManager((prev) => {
          const newMap = new Map(prev);
          newMap.delete(chatMetadata.conversation_id);
          return new Map([
            [
              chatMetadata.conversation_id,
              {
                conversation_id: chatMetadata.conversation_id,
                agent_id: chatMetadata.agent_id,
                agent_name: chatMetadata.agent_name,
                agent_avatar: chatMetadata.avatar_url,
                avatar_last_update: chatMetadata.avatar_last_update,
                unread_count: 0,
                last_message: message,
                last_message_status: status,
                last_message_time: new Date().toISOString(),
                last_message_sender_id: user?.id ?? "",
              },
            ],
            ...newMap,
          ]);
        });
      }
    }
  };

  const sendMessage = useCallback(
    (conversationId?: string) => {
      const messageStruct: Message = {
        id: uuidv4(),
        message: message,
        file: null,
        property_ref: null,
        created_at: new Date().toISOString(),
        conversation_id: chatMetadata
          ? chatMetadata.conversation_id === ""
            ? conversationId!
            : chatMetadata.conversation_id
          : conversationId!,
        sender_id: user?.id ? user.id : "",
        receiver_id: chatMetadata ? chatMetadata.agent_id : "",
        status: statusRef.current,
      };
      if (message.trim().length !== 0) {
        if (channelStatusRef.current.channel1) {
          if (channelRef.current.channel1) {
            setChat((prev) => {
              const newMap = new Map(prev);
              return new Map([[messageStruct.id, messageStruct], ...newMap]);
            });
            insertMessages([messageStruct]);
            channelRef.current.channel1.send({
              type: "broadcast",
              event: "shout",
              payload: { message: messageStruct },
            });
            setMessage("");
          }
        } else if (channelStatusRef.current.channel2) {
          if (channelRef.current.channel2) {
            setChat((prev) => {
              const newMap = new Map(prev);
              return new Map([[messageStruct.id, messageStruct], ...newMap]);
            });
            insertMessages([messageStruct]);
            channelRef.current.channel2.send({
              type: "broadcast",
              event: "shout",
              payload: { message: messageStruct },
            });
            setMessage("");
          }
        } else {
          setChat((prev) => {
            const newMap = new Map(prev);
            return new Map([[messageStruct.id, messageStruct], ...newMap]);
          });
          insertMessages([messageStruct]);
          insertInMessages({
            msg: messageStruct,
          });
          setMessage("");
        }
      }
    },
    [channelRef.current, message, chatMetadata]
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) =>
      item.sender_id === chatMetadata?.agent_id ? (
        <View className="w-full flex flex-col items-start mt-7">
          <View className="max-w-[80%] flex flex-row gap-2 rounded-[1rem] bg-primary-100 px-5 py-4 items-end">
            <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-black-300">
              {item.message}
            </Text>
            <View className="flex flex-row gap-1 items-center">
              <Text className="font-rubik text-xs text-black-300">
                {simpleFormatTimestamp(item.created_at)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="w-full flex flex-col items-end mt-7">
          <View className="max-w-[80%] flex flex-row rounded-[1rem] gap-1 bg-primary-300 px-5 py-4 items-end">
            <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-accent-100">
              {item.message}
            </Text>
            <View className="flex flex-row gap-1 items-center">
              <Text className="font-rubik text-xs mt-0.5 text-accent-100">
                {simpleFormatTimestamp(item.created_at)}
              </Text>
              {item.status === "sent" ? (
                <Image
                  source={icons.tick}
                  tintColor={"#FBFBFD"}
                  className="size-5"
                />
              ) : (
                <Image
                  source={icons.tick_double}
                  tintColor={item.status === "received" ? "#FBFBFD" : "#93c5fd"}
                  className="size-5"
                />
              )}
            </View>
          </View>
        </View>
      ),
    [chatMetadata, status]
  );

  return (
    <SafeAreaView className="bg-accent-100 min-h-full relative flex-1">
      <HeaderComponent chatMetadata={chatMetadata} />
      <FlatList
        className="px-5 h-full"
        data={Array.from(chat?.values() ?? [])}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted={true}
        contentContainerClassName="pt-5"
      />
      <ChatInput
        value={message}
        handleInput={(msg: string) => setMessage(msg)}
        handleSubmit={handleSendMessage}
      />
    </SafeAreaView>
  );
};

export default FullChat;
