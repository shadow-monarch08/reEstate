import {
  View,
  Text,
  Image,
  ImageSourcePropType,
  TouchableOpacity,
} from "react-native";
import React from "react";
import images from "@/constants/images";
import icons from "@/constants/icons";

export const NoResult = ({
  imageClassName = "w-11/12 h-56",
  title = "No result",
  subTitle = "We couldn't find any result",
  image = images.no_result,
}: {
  imageClassName?: string;
  title?: string;
  subTitle?: string;
  image?: ImageSourcePropType;
}) => {
  return (
    <View className="flex flex-col gap-2 items-center justify-center mt-6">
      <Image
        className={`${imageClassName}`}
        source={image}
        resizeMode="contain"
      />
      <Text className="text-2xl font-rubik-bold text-black-300">{title}</Text>
      <Text className="text-base font-rubik text-black-300">{subTitle}</Text>
    </View>
  );
};

export const EmptyChatCard = ({
  handleMessage,
}: {
  handleMessage: (msg: string) => void;
}) => {
  return (
    <View className="flex-1 items-center justify-center px-4 rotate-180 mt-32">
      <View className="w-11/12 bg-white rounded-2xl p-6 items-center shadow-lg">
        <Text className="text-xl font-semibold text-black-300 mb-2">
          No Messages Yet
        </Text>

        <Text className="text-sm text-black-200 text-center mb-5">
          Start the conversation and connect with this agent.
        </Text>

        <TouchableOpacity
          onPress={() => handleMessage("Hello 👋")}
          activeOpacity={0.6}
          className="bg-primary-300 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold text-base">
            Say Hello 👋
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
