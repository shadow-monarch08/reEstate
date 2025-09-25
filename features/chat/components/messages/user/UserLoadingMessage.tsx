import React from "react";
import { View } from "react-native";

// Skeleton bubble for user (right side)
const LoadingUserMessage = () => (
  <View className="w-full flex flex-col items-start py-1">
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

export default React.memo(LoadingUserMessage);
