import {
  View,
  Text,
  ImageSourcePropType,
  TouchableOpacity,
  Image,
  BackHandler,
} from "react-native";
import React, { useEffect } from "react";
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
  const { isMedialModalVisible, setIsMediaModalVisible } = useAppStore();
  useEffect(() => {
    const backAction = () => {
      setIsMediaModalVisible(false);
      // highlight-start
      return isMedialModalVisible; // This is the key to preventing the default behavior
      // highlight-end
    };

    // Add the event listener
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Cleanup function: remove the event listener when the component unmounts
    return () => backHandler.remove();
  }, [isMedialModalVisible]);
  return (
    isMedialModalVisible && (
      <View className="w-full h-fit absolute bottom-24 z-40 px-6">
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(150)}
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
