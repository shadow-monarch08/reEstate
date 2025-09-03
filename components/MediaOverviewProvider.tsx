import { View, Text, Pressable } from "react-native";
import React, { ReactNode } from "react";
import { useAppStore } from "@/lib/zustand/store/useAppStore";

const MediaOverviewProvider = ({ children }: { children: ReactNode }) => {
  const { isOverviewModalVisible, setIsOverviewModalVisible } = useAppStore();
  return (
    <View className="h-full w-full relative">
      {children}
      {isOverviewModalVisible && (
        <Pressable
          className="absolute top-0 left-0 h-full w-full"
          onPress={() => setIsOverviewModalVisible(!isOverviewModalVisible)}
        />
      )}
    </View>
  );
};

export default MediaOverviewProvider;
