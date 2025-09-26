import ChatInput from "@/components/molecules/ChatInput";
import {
  MediaModal,
  MediaModalProvider,
  MediaOverviewModal,
  MediaOverviewProvider,
} from "@/features/chat/components/conversations";
import { EmptyChatCard } from "@/components/NoResult";
import icons from "@/constants/icons";
import {
  getLastKnownMessageTime,
  markConversationRead,
} from "@/lib/database/localStore";
import { insertConversation } from "@/lib/supabase";
import { AssetMetaData, useAppStore } from "@/lib/zustand/store/useAppStore";
import { useChatStore } from "@/lib/zustand/store/useChatStore";
import { useUserStore } from "@/lib/zustand/store/useUserStore";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  BackHandler,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { v4 as uuidv4 } from "uuid";
import MessageRenderer from "@/features/chat/components/messages/MessageRenderer";
import { LoadingMessageRenderer } from "@/features/chat/components/messages/LoadingMessageRenderer";
import { LocalMessage } from "@/types/api/localDatabase";

const HeaderComponent = React.memo(() => {
  const { activeConversationData } = useChatStore();
  const { selectedMessageCount, resetSelectedMessages } = useAppStore();
  return (
    <View className="shadow-slate-200 h-20 relative shadow-sm bg-accent-100 w-full z-30">
      <View className="w-full px-4 flex flex-row justify-between h-full items-center">
        <View className="flex flex-row gap-2 items-center">
          <TouchableOpacity onPress={() => router.back()}>
            <Image source={icons.back_arrow} className="size-7" />
          </TouchableOpacity>
          <View className="overflow-hidden size-12 rounded-full">
            <Image
              src={activeConversationData?.agent_avatar}
              className="h-12 w-14"
              resizeMode="cover"
            />
          </View>
          <Text className="text-lg font-rubik-medium text-black-300">
            {activeConversationData?.agent_name}
          </Text>
        </View>
        <View className="flex flex-row gap-6 items-center">
          <TouchableOpacity>
            <Image
              source={icons.phone}
              className="size-7"
              tintColor="#666876"
            />
          </TouchableOpacity>
          <TouchableOpacity>
            <Image
              source={icons.video}
              className="size-7"
              tintColor="#666876"
            />
          </TouchableOpacity>
        </View>
      </View>

      {selectedMessageCount > 0 && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          className="absolute left-0 top-0 w-full px-4 flex flex-row justify-between h-full items-center bg-accent-100"
        >
          <View className="flex flex-row gap-5 items-center">
            <TouchableOpacity onPress={resetSelectedMessages}>
              <Image source={icons.back_arrow} className="size-7" />
            </TouchableOpacity>
            <Text className="text-2xl font-rubik-medium text-black-300">
              {selectedMessageCount}
            </Text>
          </View>
          <View className="flex flex-row gap-6 items-center">
            <TouchableOpacity>
              <Image
                source={icons.forward}
                className="size-8"
                tintColor="#666876"
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image
                source={icons.dustbin}
                className="size-7"
                tintColor="#666876"
              />
            </TouchableOpacity>
            <TouchableOpacity>
              <Image
                source={icons.more}
                className="size-7"
                tintColor="#666876"
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
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
    activeConversationId,
    activeConversationData,
    updateActiveConversationData,
    setActiveConversationId,
    updateWithoutOrderChange,
    bus,
  } = useChatStore();
  const { user } = useUserStore();
  const {
    setIsMediaModalVisible,
    setIsOverviewModalVisible,
    setAssetProvider,
    selectedMessageCount,
    isOverviewModalVisible,
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
          const assetArray: AssetMetaData[] = [];
          for (const asset of result.assets) {
            assetArray.push({
              file_name: asset.name,
              file_size: asset.size || 0,
              mime_type: asset.mimeType || "file",
              uri: asset.uri,
            });
          }
          setAssetProvider({ assets: assetArray, assetType: "doc" });
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
          const assetArray: AssetMetaData[] = [];
          for (const asset of result.assets) {
            assetArray.push({
              file_name: asset.fileName || "File",
              file_size: asset.fileSize || 0,
              mime_type: asset.mimeType || "Image",
              uri: asset.uri,
              img_height: asset.height,
              img_width: asset.width,
            });
          }
          setAssetProvider({ assets: assetArray, assetType: "image" });
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
    const backAction = () => {
      setIsOverviewModalVisible(false);
      // highlight-start
      return isOverviewModalVisible; // This is the key to preventing the default behavior
      // highlight-end
    };

    // Add the event listener
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Cleanup function: remove the event listener when the component unmounts
    return () => backHandler.remove();
  }, [isOverviewModalVisible]);

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
      if ((text && text.trim().length > 0) || m) {
        let msg: LocalMessage = {
          conversation_id: activeConversationData.conversation_id,
          local_id: uuidv4(),
          content_type: "text",
          body: (text || m) ?? null,
          created_at: new Date().toISOString(),
          status: "pending",
          sender_role: "user" as "user" | "agent",
          receiver_id: activeConversationData.agent_id,
          sender_id: "",
          pending: 1,
        };
        if (activeConversationData.newConversation && user) {
          setInitialLoading(true);
          const conversationId = await insertConversation({
            data: {
              agent_id: activeConversationData.agent_id,
              user_id: user.id,
            },
          });

          if (conversationId) {
            msg.conversation_id = conversationId.id;
            updateActiveConversationData({
              conversation_id: conversationId.id,
            });
            setActiveConversationId(conversationId.id);
            setInitialLoading(false);
          }
        }
        setText("");
        await bus.sendMessage(msg, false);
      }
    },
    [activeConversationData, text]
  );

  const renderItem = useCallback(
    ({ item }: { item: LocalMessage }) => {
      return <MessageRenderer message={item} />;
    },
    [messages]
  );

  return (
    <SafeAreaView className="bg-accent-100 min-h-full relative flex-1 w-full">
      <MediaOverviewProvider>
        <MediaModalProvider>
          <HeaderComponent />
          <FlatList
            className="h-full"
            data={Array.from(messages.values() ?? [])}
            keyExtractor={(item) => item.local_id}
            renderItem={renderItem}
            ListEmptyComponent={
              loadingMessages ? (
                <LoadingMessageRenderer />
              ) : (
                <EmptyChatCard handleMessage={handleMessage} />
              )
            }
            inverted={true}
            contentContainerClassName="pt-1 pb-1"
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
