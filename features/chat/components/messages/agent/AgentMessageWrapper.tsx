import { simpleFormatTimestamp } from "@/utils";
import { Pressable, Text, View } from "react-native";
import type { BaseAgentMessageType } from "./types";
import React, { ReactNode } from "react";

type props = {
  msg: BaseAgentMessageType;
  children: ReactNode;
  onPress: () => void;
  innerContainerClass?: string;
  outerContainerClass?: string;
};

const AgentMessageWrapper: React.FC<props> = ({
  msg,
  children,
  onPress,
  innerContainerClass,
  outerContainerClass,
}) => {
  return (
    <View
      className={`w-full flex flex-col items-start px-5 py-1 ${outerContainerClass}`}
    >
      <Pressable
        onPress={onPress}
        className={`max-w-[80%] rounded-[1rem] rounded-ss-md bg-primary-100 p-2 relative ${innerContainerClass}`}
      >
        {children}
        <View className="flex-row gap-1 items-center absolute bottom-2 right-3">
          <Text className={`font-rubik text-xs mt-0.5 text-black-300`}>
            {simpleFormatTimestamp(msg.created_at)}
          </Text>
        </View>
      </Pressable>
    </View>
  );
};

export default AgentMessageWrapper;
