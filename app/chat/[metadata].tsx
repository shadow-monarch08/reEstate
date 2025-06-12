import { View, Text, FlatList, TouchableOpacity } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "react-native";
import icons from "@/constants/icons";
import { useSupabase } from "@/lib/useSupabase";
import {
  changetMessageStatus,
  ChatReturnType,
  getCompleteChat,
} from "@/lib/supabase";
import ChatInput from "@/components/ChatInput";
import { useGlobalContext } from "@/lib/global-provider";

interface Metadata {
  conversation_id: string;
  avatar_url: string;
  agent_name: string;
  agent_id: string;
}

const HeaderComponent = ({
  agentMetadata,
}: {
  agentMetadata: Metadata | null | undefined;
}) => {
  return (
    <View className="absolute left-0 top-0 z-[999] shadow-slate-200 shadow-lg bg-accent-100 flex px-5 py-4 flex-row justify-between w-full items-center">
      <View className="flex flex-row gap-2 items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={icons.back_arrow} className="size-7" />
        </TouchableOpacity>
        <Image
          source={{ uri: agentMetadata?.avatar_url }}
          className="size-14 rounded-full"
        />
        <Text className="text-xl font-rubik-medium text-black-300">
          {agentMetadata?.agent_name}
        </Text>
      </View>
      <View className="flex flex-row gap-3 items-center">
        <TouchableOpacity>
          <Image source={icons.phone} className="size-8" tintColor="#191D31" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Image source={icons.video} className="size-8" tintColor="#191D31" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTimestamp_2(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isYesterday = (d: Date) => {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    return isSameDay(d, yesterday);
  };

  if (isSameDay(date, now)) {
    // 24-hour format (e.g., 14:45)
    return "Today";
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  // Format date (e.g., 09 Jun 2025)
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const FullChat = () => {
  const { chatOverviewManager, setChatOverviewManager } = useGlobalContext();

  const params = useLocalSearchParams<{ metadata: string }>();
  const [agentMetadata, setAgentMetadata] = useState<Metadata | null>();
  const [isFirstInstance, setisFirstInstance] = useState(false);
  const [chat, setChat] = useState<Array<ChatReturnType> | null>([]);

  const {
    data: completeChat,
    loading: chatLoading,
    refetch: fetchChat,
  } = useSupabase({
    fn: getCompleteChat,
    params: {
      conversation_id: agentMetadata?.conversation_id,
      agent_id: agentMetadata?.agent_id,
    },
    skip: true,
  });
  const {
    data,
    loading,
    refetch: changeStatus,
  } = useSupabase({
    fn: changetMessageStatus,
    params: {
      conversation_id: agentMetadata?.conversation_id,
    },
    skip: true,
  });

  useEffect(() => {
    const metadata = params.metadata
      ? JSON.parse(decodeURIComponent(params.metadata as string))
      : null;
    setAgentMetadata(metadata);
    fetchChat({
      conversation_id: metadata?.conversation_id,
      agent_id: metadata?.agent_id,
    });
  }, []);

  useEffect(() => {
    if (completeChat) {
      setChat(completeChat);
    }
  }, [completeChat]);

  useEffect(() => {
    if (
      chatOverviewManager.filter(
        (item) => item.conversation_id === agentMetadata?.conversation_id
      )[0]?.unread_count > 0
    ) {
      changeStatus({
        conversation_id: agentMetadata?.conversation_id,
      });
      setChatOverviewManager((prev) =>
        prev.map((item) =>
          item.conversation_id === agentMetadata?.conversation_id
            ? {
                ...item,
                unread_count: 0,
              }
            : item
        )
      );
    }
  }, [chatOverviewManager, agentMetadata]);

  const renderItem = useCallback(
    ({ item }: { item: ChatReturnType }) =>
      item.sender_id === agentMetadata?.agent_id ? (
        <View className="w-full flex flex-col mt-7">
          <View className="w-[80%] flex flex-row rounded-[2rem] gap-1 bg-primary-100 px-6 py-5 items-end">
            <Text className="text-wrap flex-1 font-rubik text-base text-black-300">
              {item.message}
            </Text>
            <View className="flex flex-row gap-1 items-center">
              <Text className="font-rubik text-xs text-black-300">
                {formatTimestamp(item.created_at)}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View className="w-full flex flex-col items-end mt-7">
          <View className="w-[80%] flex flex-row rounded-[2rem] gap-1 bg-primary-300 px-6 py-5 items-end">
            <Text className="text-wrap flex-1 font-rubik text-base text-accent-100">
              {item.message}
            </Text>
            <View className="flex flex-row gap-1 items-center">
              <Text className="font-rubik text-xs mt-0.5 text-accent-100">
                {formatTimestamp(item.created_at)}
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
    [completeChat]
  );

  return (
    <SafeAreaView className="bg-accent-100 min-h-full relative flex-1">
      <HeaderComponent agentMetadata={agentMetadata} />
      <FlatList
        className="px-5 h-full"
        data={isFirstInstance ? completeChat : chat}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        inverted={true}
        contentContainerClassName="py-5"
      />
      <ChatInput />
    </SafeAreaView>
  );
};

export default FullChat;
