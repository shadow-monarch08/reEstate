import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";
import Search from "@/components/Search";
import { LoadingChatCard } from "@/components/Card";
import { ChatCard } from "@/features/chat/components/conversations";
import { router } from "expo-router";
import {
  ActiveConversationData,
  useChatStore,
} from "@/lib/zustand/store/useChatStore";
import { NoResult } from "@/components/NoResult";
import images from "@/constants/images";
import { useCallback } from "react";

const Chat = () => {
  const {
    conversationOverview,
    conversationDisplayOrder,
    setActiveConversationData,
    conversationtLoading,
  } = useChatStore();

  const handelCardPress = (item: ActiveConversationData) => {
    setActiveConversationData(item);
    router.push(`/chat/conversation`);
  };

  const renderLoadingItem = useCallback(
    () =>
      conversationtLoading ? (
        <View className="mt-5 flex flex-row gap-5 flex-wrap">
          {[...Array(4)].map((_, i) => (
            <LoadingChatCard key={i} />
          ))}
        </View>
      ) : (
        <NoResult
          title="No Conversation"
          subTitle="Connect and chat with agents of your choice."
          image={images.no_chat_result}
        />
      ),
    [conversationtLoading]
  );

  return (
    <SafeAreaView className="bg-accent-100 min-h-full">
      <FlatList
        data={conversationtLoading ? [] : conversationDisplayOrder}
        keyExtractor={(item) => item}
        className="px-5"
        renderItem={({ item }) => (
          <ChatCard
            handlePress={handelCardPress}
            item={conversationOverview.get(item)!}
          />
        )}
        ListEmptyComponent={renderLoadingItem}
        ListHeaderComponentClassName="pt-7 mb-5"
        ListHeaderComponent={
          <View>
            <View className="flex flex-row justify-between items-center mb-7">
              <View className="flex-row flex gap-4 items-center">
                <View className="p-2 bg-primary-300 rounded-2xl">
                  <Image
                    source={icons.chat_filled}
                    tintColor="white"
                    className="size-5 rounded-full"
                  />
                </View>
                <Text className="text-2xl text-black-300 font-rubik-medium">
                  Messages
                </Text>
              </View>
              <TouchableOpacity>
                <Image
                  source={icons.bell}
                  resizeMode="contain"
                  className="size-7"
                  tintColor="#191D31"
                />
              </TouchableOpacity>
            </View>
            <Search enableFocus={false} enableFilter={false} />
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default Chat;
