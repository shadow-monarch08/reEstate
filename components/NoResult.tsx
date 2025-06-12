import { View, Text, Image } from "react-native";
import React from "react";
import images from "@/constants/images";

const NoResult = ({
  imageClassName = "w-11/12 h-56",
  title = "No result",
  subTitle = "We couldn't find any result",
}: {
  imageClassName?: string;
  title?: string;
  subTitle?: string;
}) => {
  return (
    <View className="flex flex-col gap-2 items-center justify-center mt-6">
      <Image
        className={`${imageClassName}`}
        source={images.noResult}
        resizeMode="contain"
      />
      <Text className="text-2xl font-rubik-bold text-black-300">{title}</Text>
      <Text className="text-base font-rubik text-black-300">{subTitle}</Text>
    </View>
  );
};

export default NoResult;
