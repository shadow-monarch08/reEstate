import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import icons from "@/constants/icons";
import Search from "@/components/Search";
import { useSupabase } from "@/lib/useSupabase";
import { getChatOverview } from "@/lib/supabase";
import { useGlobalContext } from "@/lib/global-provider";
import { ChatCard } from "@/components/Card";
import { router } from "expo-router";

const Chat = () => {
  const { user, chatOverviewManager } = useGlobalContext();

  const handelCardPress = (item: object) => {
    const json = encodeURIComponent(JSON.stringify(item)); // escape for URL
    router.push(`/chat/${json}`);
  };

  return (
    <SafeAreaView className="bg-accent-100 min-h-full">
      <FlatList
        data={chatOverviewManager}
        keyExtractor={(item) => item.agent_id}
        className="px-5"
        renderItem={({ item }) => (
          <ChatCard handlePress={handelCardPress} item={item} />
        )}
        ListHeaderComponentClassName="pt-7 mb-5"
        ListHeaderComponent={
          <View>
            <View className="flex flex-row justify-between items-center">
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
