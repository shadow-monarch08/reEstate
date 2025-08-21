import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";
import Search from "@/components/Search";
import { ChatCard } from "@/components/Card";
import { router } from "expo-router";
import {
  ActiveConversationData,
  useChatStore,
} from "@/lib/zustand/store/useChatStore";
import { NoResult } from "@/components/NoResult";
import images from "@/constants/images";

const Chat = () => {
  const { conversationOverview, setActiveConversationData } = useChatStore();
  const handelCardPress = (item: ActiveConversationData) => {
    setActiveConversationData(item);
    router.push(`/chat/conversation`);
  };

  return (
    <SafeAreaView className="bg-accent-100 min-h-full">
      <FlatList
        data={Array.from(conversationOverview?.values())}
        keyExtractor={(item) => item.agent_id}
        className="px-5"
        renderItem={({ item }) => (
          <ChatCard handlePress={handelCardPress} item={item} />
        )}
        ListEmptyComponent={
          <NoResult
            title="No Conversation"
            subTitle="Connect and chat with agents of your choice."
            image={images.no_chat_result}
          />
        }
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
