import { View, Text, FlatList, TouchableOpacity } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "react-native";
import icons from "@/constants/icons";
import ChatInput from "@/components/ChatInput";
import { v4 as uuidv4 } from "uuid";
import { addNetworkStateListener, getNetworkStateAsync } from "expo-network";
import { simpleFormatTimestamp } from "@/utils";
import {
  getConversation,
  getLastKnownMessageTime,
  insertConversation,
  markConversationRead,
  Message,
} from "@/lib/database/localStore";
import { useChatStore } from "@/lib/zustand/store/useChatStore";
import { upsertConversation } from "@/lib/supabase";
import { useUserStore } from "@/lib/zustand/store/useUserStore";
import { EmptyChatCard } from "@/components/NoResult";
import MediaModalProvider from "@/components/MediaModalProvider";
import MediaModal from "@/components/MediaModal";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useAppStore } from "@/lib/zustand/store/useAppStore";
import MediaOverviewModal from "@/components/MediaOverviewModal";
import MediaOverviewProvider from "@/components/MediaOverviewProvider";
import images from "@/constants/images";

const LoadingAgentMessage = () => (
  <View className="w-full flex flex-col items-end mt-3">
    <View className="max-w-[80%] flex flex-row gap-2 rounded-[1rem] rounded-ee-md bg-primary-100 px-5 py-4 items-end">
      {/* timestamp placeholder */}
      <View className="h-full flex flex-row justify-end">
        <View className="h-3 w-6 bg-gray-200/40 rounded-md" />
      </View>
      {/* message text placeholder */}
      <View className="h-5 w-40 bg-gray-200/40 rounded-md" />
    </View>
  </View>
);

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

// Skeleton bubble for user (right side)
const LoadingUserMessage = () => (
  <View className="w-full flex flex-col items-start mt-3">
    <View className="max-w-[80%] flex flex-row-reverse gap-2 rounded-[1rem] rounded-ss-md bg-primary-300 px-5 py-4 items-end">
      {/* message text placeholder */}
      <View className="h-5 w-32 bg-gray-200/40 rounded-md" />
      {/* timestamp + tick placeholder */}
      <View className="flex flex-row gap-1 items-start justify-end h-full">
        <View className="size-4 rounded-full bg-gray-200/40" />
        <View className="h-3 w-6 bg-gray-200/40 rounded-md" />
      </View>
    </View>
  </View>
);

const AgentMessage = ({ msg }: { msg: Message }) => {
  return (
    <View className="w-full flex flex-col items-start mt-3">
      {msg.content_type.split("/")[0] === "text" ? (
        <View className="max-w-[80%] flex flex-row gap-2 rounded-[1rem] rounded-ss-md bg-primary-100 px-5 py-4 items-end">
          <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-black-300">
            {msg.body}
          </Text>
          <View className="flex flex-row gap-1 items-center">
            <Text className="font-rubik text-xs text-black-300">
              {simpleFormatTimestamp(msg.created_at)}
            </Text>
          </View>
        </View>
      ) : msg.content_type.split("/")[0] === "image" ? (
        <TouchableOpacity
          activeOpacity={0.6}
          className="max-w-[80%] w-2/3 rounded-[1rem] rounded-ss-md bg-primary-100 p-2 relative"
        >
          <Image
            className="h-72 w-full rounded-[1rem]"
            source={{ uri: JSON.parse(msg.body).uri }}
          />
          <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-black-300">
            {JSON.parse(msg.body).msg}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.6}
          className="max-w-[80%] w-2/3 rounded-[1rem] rounded-ss-md bg-primary-100 p-2 pb-8 relative"
        >
          <View className="flex-row gap-3 items-center p-2 bg-primary-200 rounded-lg w-full">
            <Image
              className="size-6"
              tintColor={"#FBFBFD"}
              source={icons.doc}
            />
            <View className="flex flex-col justify-center items-start gap-1">
              <Text
                numberOfLines={1}
                className="font-rubik text-base mt-0.5 text-accent-100 w-48"
              >
                {JSON.parse(msg.body).file_name}
              </Text>
              <Text className="font-rubik text-xs mt-0.5 text-slate-300">
                {formatBytes(JSON.parse(msg.body).file_size)}
              </Text>
            </View>
          </View>
          {JSON.parse(msg.body).message && (
            <View className="mt-2 px-1">
              <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-accent-100">
                {JSON.parse(msg.body).message}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};
const UserMessage = ({ msg }: { msg: Message }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return icons.clock;
      case "sent":
        return icons.tick;
      case "received":
        return icons.tick_double;
      case "read":
        return icons.tick_double;
      default:
        return icons.bell;
    }
  };
  return (
    <View className="w-full flex flex-col items-end mt-3">
      {msg.content_type.split("/")[0] === "text" ? (
        <View className="max-w-[80%] flex flex-row rounded-[1rem] rounded-ee-md gap-1 bg-primary-300 px-5 py-4 items-end">
          <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-accent-100">
            {msg.body}
          </Text>
          <View className="flex flex-row gap-1 items-center">
            <Text className="font-rubik text-xs mt-0.5 text-accent-100">
              {simpleFormatTimestamp(msg.created_at)}
            </Text>
            <Image
              source={getStatusIcon(msg.status)}
              tintColor={msg.status !== "read" ? "#FBFBFD" : "#93c5fd"}
              className="size-5"
            />
          </View>
        </View>
      ) : msg.content_type.split("/")[0] === "image" ? (
        <TouchableOpacity
          activeOpacity={0.6}
          className="max-w-[80%] w-2/3 rounded-[1rem] rounded-ee-md bg-primary-300 p-2 relative"
        >
          <View className="relative">
            <Image
              className="h-72 w-full rounded-[1rem]"
              source={{ uri: JSON.parse(msg.body).uri }}
            />
            <Image
              className="h-72 w-full rounded-[1rem] absolute top-0 left-0"
              source={images.image_gradient}
              resizeMode="cover"
            />
          </View>
          {JSON.parse(msg.body).message && (
            <View className="mt-2">
              <Text className="text-wrap flex-wrap pl-1 flex-shrink font-rubik text-base mt-0.5 mb-3 text-accent-100">
                {JSON.parse(msg.body).message}
              </Text>
            </View>
          )}
          <View className="flex-row gap-1 items-center absolute bottom-2 right-3">
            <Text className="font-rubik text-xs mt-0.5 text-accent-100">
              {simpleFormatTimestamp(msg.created_at)}
            </Text>
            <Image
              source={getStatusIcon(msg.status)}
              tintColor={msg.status !== "read" ? "#FBFBFD" : "#93c5fd"}
              className="size-5"
            />
          </View>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.6}
          className="max-w-[80%] w-2/3 rounded-[1rem] rounded-ee-md bg-primary-300 p-2 pb-8 relative"
        >
          <View className="flex-row gap-3 items-center p-2 bg-blue-500 rounded-lg w-full">
            <Image
              className="size-6"
              tintColor={"#FBFBFD"}
              source={icons.doc}
            />
            <View className="flex flex-col justify-center items-start gap-1">
              <Text
                numberOfLines={1}
                className="font-rubik text-base mt-0.5 text-accent-100 w-48"
              >
                {JSON.parse(msg.body).file_name}
              </Text>
              <Text className="font-rubik text-xs mt-0.5 text-slate-300">
                {formatBytes(JSON.parse(msg.body).file_size)}
              </Text>
            </View>
          </View>
          {JSON.parse(msg.body).message && (
            <View className="mt-2 px-1">
              <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-accent-100">
                {JSON.parse(msg.body).message}
              </Text>
            </View>
          )}
          <View className="flex-row gap-1 items-center absolute bottom-1 right-3">
            <Text className="font-rubik text-xs mt-0.5 text-accent-100">
              {simpleFormatTimestamp(msg.created_at)}
            </Text>
            <Image
              source={getStatusIcon(msg.status)}
              tintColor={msg.status !== "read" ? "#FBFBFD" : "#93c5fd"}
              className="size-5"
            />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

// Main loader: show 5–6 skeleton messages in random order
export const LoadingChatSkeleton = () => {
  // array of 6 messages, randomly "agent" or "user"
  const placeholders = [
    "agent",
    "user",
    "agent",
    "agent",
    "user",
    "agent",
    "user",
  ];

  return (
    <View className="px-4">
      {placeholders.map((type, idx) =>
        type === "agent" ? (
          <LoadingAgentMessage key={idx} />
        ) : (
          <LoadingUserMessage key={idx} />
        )
      )}
    </View>
  );
};

const HeaderComponent = React.memo(() => {
  const { activeConversationData } = useChatStore();

  return (
    <View className="shadow-slate-200 shadow-lg bg-accent-100 flex px-5 py-4 flex-row justify-between w-full items-center">
      <View className="flex flex-row gap-2 items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Image source={icons.back_arrow} className="size-7" />
        </TouchableOpacity>
        <View className="overflow-hidden size-14 rounded-full">
          <Image
            src={activeConversationData?.agent_avatar}
            className="h-14 w-16"
            resizeMode="cover"
          />
        </View>
        <Text className="text-xl font-rubik-medium text-black-300">
          {activeConversationData?.agent_name}
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
});

const FullChat = () => {
  const [text, setText] = useState<string>();
  const {
    initaiteMessages,
    fetchMoreMessages,
    messages,
    loadingMessages,
    loadingMoreMessages,
    addMessage,
    activeConversationId,
    activeConversationData,
    updateActiveConversationData,
    setActiveConversationId,
    fetchNewConversation,
    updateWithOrderChange,
    updateWithoutOrderChange,
    bus,
  } = useChatStore();
  const { user } = useUserStore();
  const {
    setIsMediaModalVisible,
    setIsOverviewModalVisible,
    setAssetProvider,
  } = useAppStore();

  const mediaContent = [
    {
      icon: icons.doc_h,
      title: "Document",
      onPress: async () => {
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*", // Allow all file types
          copyToCacheDirectory: true, // Recommended to ensure the file is accessible
          multiple: true,
        });
        if (!result.canceled || result.assets) {
          setAssetProvider({ asset: result.assets, assetType: "Doc" });
          setIsOverviewModalVisible(true);
          setIsMediaModalVisible(false);
        }
        console.log(result);
      },
      iconColor: "#581c87",
    },
    {
      icon: icons.gallery_h,
      title: "Gallery",
      onPress: async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
          quality: 0.7,
          selectionLimit: 5,
          allowsMultipleSelection: true,
        });
        if (!result.canceled || result.assets) {
          setAssetProvider({ asset: result.assets, assetType: "Img" });
          setIsOverviewModalVisible(true);
          setIsMediaModalVisible(false);
        }
        console.log(result);
      },
      iconColor: "#831843",
    },
    {
      icon: icons.camera_h,
      title: "Camera",
      onPress: async () => {
        let result = await ImagePicker.launchCameraAsync({
          quality: 0.7,
          allowsEditing: true,
        });

        console.log(result);
      },
      iconColor: "#ca8a04",
    },
    {
      icon: icons.profile_h,
      title: "Contact",
      onPress: () => {},
      iconColor: "#ef4444",
    },
    {
      icon: icons.audio_h,
      title: "Audio",
      onPress: async () => {
        const result = await DocumentPicker.getDocumentAsync({
          type: "audio/*", // This is the key to filtering for audio files
          copyToCacheDirectory: true, // Recommended to ensure the file is accessible
        });

        console.log(result);
      },
      iconColor: "#166534",
    },
    {
      icon: icons.location_h,
      title: "Location",
      onPress: () => {},
      iconColor: "#0061ff",
    },
  ];

  const [initialLoading, setInitialLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (activeConversationId !== activeConversationData.conversation_id) {
        await initaiteMessages(activeConversationData.conversation_id);
        setActiveConversationId(activeConversationData.conversation_id);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (activeConversationData.conversation_id !== "") {
        updateWithoutOrderChange({
          unread_count: 0,
          conversation_id: activeConversationData.conversation_id,
        });
        const last_message_time = await getLastKnownMessageTime(
          activeConversationData.conversation_id
        );
        await bus.syncReadStatus(
          activeConversationData.conversation_id,
          activeConversationData.agent_id
        );
        if (last_message_time)
          await markConversationRead(
            activeConversationData.conversation_id,
            last_message_time
          );
      }
    })();
    console.log(uuidv4());
    console.log(activeConversationData.conversation_id);

    return () => {
      setActiveConversationId(null);
    };
  }, []);

  const handleMessage = useCallback(
    async (m?: string) => {
      let tempConversationId;
      if ((text && text.trim().length > 0) || m) {
        if (activeConversationData.newConversation && user) {
          setInitialLoading(true);
          const conversationId = await upsertConversation({
            data: {
              agent_id: activeConversationData.agent_id,
              user_id: user.id,
            },
          });

          if (conversationId) {
            await insertConversation({
              agent_avatar: activeConversationData.agent_avatar,
              agent_id: activeConversationData.agent_id,
              agent_name: activeConversationData.agent_name,
              avatar_last_update: activeConversationData.avatar_last_update,
              conversation_id: conversationId.id,
            });
            tempConversationId = conversationId.id;
            updateActiveConversationData({
              conversation_id: conversationId.id,
              newConversation: false,
            });
            setActiveConversationId(conversationId.id);
            setInitialLoading(false);
            await fetchNewConversation(
              tempConversationId || activeConversationData.conversation_id
            );
          }
        }
      }
      const msg = {
        local_id: uuidv4(),
        content_type: "text/plain",
        body: (text || m) ?? "",
        conversation_id:
          tempConversationId || activeConversationData.conversation_id,
        created_at: new Date().toISOString(),
        status: "pending",
        sender_role: "user" as "user" | "agent",
      };
      addMessage(msg);
      updateWithOrderChange({
        last_message: msg.body,
        last_message_time: msg.created_at,
        last_message_content_type: msg.content_type,
        last_message_status: msg.status,
        last_message_sender_role: msg.sender_role,
        conversation_id:
          tempConversationId || activeConversationData.conversation_id,
      });
      setText("");
      await bus.sendMessage(
        {
          ...msg,
          receiver_id: activeConversationData.agent_id,
          sender_id: "",
          pending: 1,
        },
        false
      );
    },
    [activeConversationData, text]
  );

  const renderItem = useCallback(
    ({ item }: { item: Message }) =>
      item.sender_role === "agent" ? (
        <AgentMessage msg={item} />
      ) : (
        <UserMessage msg={item} />
      ),
    [messages]
  );

  return (
    <SafeAreaView className="bg-accent-100 min-h-full relative flex-1 w-full">
      <MediaOverviewProvider>
        <MediaModalProvider>
          <HeaderComponent />
          <FlatList
            className="px-5 h-full"
            data={Array.from(messages.values() ?? [])}
            keyExtractor={(item) => item.local_id}
            renderItem={renderItem}
            ListEmptyComponent={
              loadingMessages ? (
                <LoadingChatSkeleton />
              ) : (
                <EmptyChatCard handleMessage={handleMessage} />
              )
            }
            inverted={true}
            contentContainerClassName="pt-5"
          />
          <ChatInput
            value={text}
            handleInput={(msg: string) => setText(msg)}
            handleSubmit={handleMessage}
          />
          <MediaModal content={mediaContent} />
          <MediaOverviewModal />
        </MediaModalProvider>
      </MediaOverviewProvider>
    </SafeAreaView>
  );
};

export default FullChat;
