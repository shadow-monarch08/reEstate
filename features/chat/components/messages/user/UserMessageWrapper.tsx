import { useAppStore } from "@/lib/zustand/store/useAppStore";
import { ReactNode, useState } from "react";
import { Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Image } from "react-native";
import { simpleFormatTimestamp } from "@/utils";
import icons from "@/constants/icons";
import { BaseUserMessageType } from "./types";

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

const UserMessageWrapper = ({
  msg,
  children,
  innerContainerClass,
  outerContainerClass,
  onPress,
}: {
  msg: BaseUserMessageType;
  children: ReactNode;
  outerContainerClass?: string;
  innerContainerClass?: string;
  onPress: () => void;
}) => {
  const [isMessageSelected, setIsMessageSelected] = useState(false);
  const { selectedMessageCount, addToActiveMessage, deleteFromActiveMessage } =
    useAppStore();

  const onPressHandler = () => {
    if (isMessageSelected) {
      deleteFromActiveMessage(msg.local_id);
      setIsMessageSelected(false);
    } else {
      addToActiveMessage(msg.local_id);
      setIsMessageSelected(true);
    }
  };

  const onLongPressHandler = () => {
    if (selectedMessageCount === 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      addToActiveMessage(msg.local_id);
      setIsMessageSelected(true);
    }
  };
  return (
    <Pressable
      onLongPress={onLongPressHandler}
      onPress={() => {
        if (selectedMessageCount > 0) {
          onPressHandler();
        } else {
        }
      }}
      className={`w-full flex flex-col items-end py-1 px-5 ${outerContainerClass}`}
      style={{
        backgroundColor:
          isMessageSelected && selectedMessageCount > 0
            ? "#0061FF1A"
            : "transparent",
      }}
    >
      <Pressable
        style={({ pressed }) => [
          {
            opacity: pressed ? 0.6 : 1,
          },
        ]}
        onPress={() => {
          if (selectedMessageCount > 0) {
            onPressHandler();
          } else {
            onPress();
          }
        }}
        onLongPress={onLongPressHandler}
        className={`max-w-[80%] rounded-[1rem] rounded-ee-md bg-primary-300 p-2 relative ${innerContainerClass}`}
      >
        {children}
        <View className="flex-row gap-1 items-center absolute bottom-3 right-3">
          <Text className="font-rubik text-xs mt-0.5 text-accent-100">
            {simpleFormatTimestamp(msg.created_at)}
          </Text>
          <Image
            source={getStatusIcon(msg.status)}
            tintColor={msg.status !== "read" ? "#FBFBFD" : "#93c5fd"}
            className="size-5"
          />
        </View>
      </Pressable>
    </Pressable>
  );
};

export default UserMessageWrapper;
