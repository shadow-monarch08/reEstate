import icons from "@/constants/icons";
import { ActiveConversationData } from "@/lib/zustand/store/useChatStore";
import { ConversationOverview } from "@/types/domain/chat";
import { formatTimestamp } from "@/utils";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";

const ChatCard = ({
  item,
  handlePress,
}: { item: ConversationOverview } & {
  handlePress: (param: ActiveConversationData) => void;
}) => {
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

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case "image":
        return icons.gallery;
      case "doc":
        return icons.doc;
      default:
        return icons.bell;
    }
  };
  return (
    <Animated.View
      style={{
        marginTop: 28,
        width: "100%",
      }}
      layout={LinearTransition.duration(200)}
    >
      <TouchableOpacity
        activeOpacity={0.6}
        className="flex flex-row gap-4 w-full h-fit relative"
        onPress={() =>
          handlePress({
            agent_avatar: item.agent_avatar,
            avatar_last_update: item.avatar_last_update,
            conversation_id: item.conversation_id,
            agent_name: item.agent_name,
            agent_id: item.agent_id,
          })
        }
      >
        <View className="overflow-hidden flex flex-row justify-center size-16 rounded-full">
          <Image
            src={item.agent_avatar}
            className="h-16 w-20"
            resizeMode="cover"
          />
        </View>
        <View className="flex-1 flex flex-col justify-between py-1">
          <Text className="text-black-300 font-rubik-medium text-lg flex-1">
            {item.agent_name}
          </Text>
          <View className="flex flex-row gap-2">
            {item.last_message_sender_role === "user" && (
              <Image
                source={getStatusIcon(item.last_message_status)}
                tintColor={
                  item.last_message_status === "read" ? "#0061ff" : "#666876"
                }
                className="size-5"
              />
            )}
            {item.last_message ? (
              item.last_message_content_type === "text" ? (
                <Text
                  className="text-black-200 font-rubik text-sm flex-1"
                  numberOfLines={1}
                >
                  {item.last_message}
                </Text>
              ) : (
                <View className="flex-1 flex-row gap-1">
                  <Image
                    className="size-4"
                    tintColor={"#666876"}
                    source={getFileIcon(item.last_message_content_type)}
                  />
                  <Text
                    className="text-black-200 font-rubik text-sm flex-1"
                    numberOfLines={1}
                  >
                    {
                      item.last_message
                        ? item.last_message // If .message exists, display it
                        : item.last_message_content_type === "image"
                        ? "Image" // Otherwise, if it's an image, display "Image"
                        : item.last_message_file_name // Otherwise, display the file name
                    }
                  </Text>
                </View>
              )
            ) : (
              <Text
                className="text-black-200 font-rubik italic text-sm flex-1"
                numberOfLines={1}
              >
                No Message available
              </Text>
            )}
          </View>
        </View>
        <View className="flex flex-col justify-between items-end">
          {item.unread_count ?? 0 > 0 ? (
            <View className="rounded-full bg-primary-300 size-7 flex items-center justify-center">
              <Text className="font-rubik-medium text-white text-xs mt-1">
                {item.unread_count}
              </Text>
            </View>
          ) : null}
          <View className="flex flex-1 flex-row items-end">
            <Text className="font-rubik-medium text-xs text-black-200">
              {item.last_message && formatTimestamp(item.last_message_time)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default React.memo(ChatCard);
