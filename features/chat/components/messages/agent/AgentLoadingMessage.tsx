import React from "react";
import { View } from "react-native";

const LoadingAgentMessage = () => (
  <View className="w-full flex flex-col items-end py-1">
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

export default React.memo(LoadingAgentMessage);
