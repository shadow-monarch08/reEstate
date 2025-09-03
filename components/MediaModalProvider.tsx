import { View, Text, Pressable, ImageSourcePropType } from "react-native";
import React, { ReactNode } from "react";
import { useAppStore } from "@/lib/zustand/store/useAppStore";
import MediaModal from "./MediaModal";

const MediaModalProvider = ({ children }: { children: ReactNode }) => {
  const { isMedialModalVisible, setIsMediaModalVisible } = useAppStore();
  return (
    <View className="h-full w-full relative">
      {children}
      {isMedialModalVisible && (
        <Pressable
          className="absolute top-0 left-0 h-full w-full"
          onPress={() => setIsMediaModalVisible(!isMedialModalVisible)}
        />
      )}
    </View>
  );
};

export default MediaModalProvider;
