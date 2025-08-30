import {
  View,
  Text,
  ImageSourcePropType,
  TouchableOpacity,
  Image,
} from "react-native";
import React from "react";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useAppStore } from "@/lib/zustand/store/useAppStore";

const MediaModal = ({
  content,
}: {
  content: Array<{
    title: string;
    icon: ImageSourcePropType;
    onPress: () => void;
    iconColor: string;
  }>;
}) => {
  const { isMedialModalVisible } = useAppStore();
  return (
    isMedialModalVisible && (
      <View className="w-full h-fit absolute bottom-24 z-40 px-6">
        <Animated.View
          entering={FadeInDown}
          exiting={FadeOutDown}
          className="h-fit w-full rounded-3xl bg-white overflow-hidden shadow-black-100 shadow-md"
        >
          <View className="size-full bg-primary-100 items-center justify-evenly gap-5 flex flex-row flex-wrap p-5">
            {content.map((item, i) => (
              <View
                key={i}
                className="flex flex-col gap-2 justify-center items-center"
              >
                <TouchableOpacity
                  className="p-6 bg-primary-200 rounded-full"
                  style={{
                    backgroundColor: item.iconColor,
                  }}
                  onPress={item.onPress}
                  activeOpacity={0.4}
                >
                  <Image
                    className="size-8"
                    resizeMode="cover"
                    source={item.icon}
                    tintColor="#FBFBFD"
                  />
                </TouchableOpacity>
                <Text className="font-rubik text-sm text-black-200">
                  {item.title}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    )
  );
};

export default MediaModal;
