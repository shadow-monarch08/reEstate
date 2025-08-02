import {
  View,
  Text,
  TouchableOpacity,
  ImageSourcePropType,
  Image,
} from "react-native";
import React from "react";
import { router } from "expo-router";
import icons from "@/constants/icons";

export const Button = ({
  text,
  handlePress,
  image,
  buttonStyle,
}: {
  text: string;
  handlePress?: () => void;
  image?: ImageSourcePropType;
  buttonStyle?: string;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.65}
      className={`flex flex-row gap-4 bg-primary-300 py-3 w-full flex-1 justify-center rounded-full shadow-zinc-200 shadow-md ${buttonStyle}`}
      onPress={handlePress}
    >
      {image && <Image source={image} className="size-7" tintColor="white" />}
      <Text className="text-white font-rubik-bold text-base mt-1">{text}</Text>
    </TouchableOpacity>
  );
};

export const SearchButton = ({ query }: { query: string }) => {
  return (
    <TouchableOpacity
      onPress={() => router.push(`/search/${query}`)}
      className="flex-1 rounded-2xl overflow-hidden"
    >
      <View className="flex flex-row bg-primary-100 px-3 py-4">
        <View className="flex flex-row flex-1 gap-5">
          <Image
            source={icons.search_outline}
            className="size-5"
            tintColor="#8C8E98"
            resizeMode="contain"
          />
          <View className="flex-1">
            <Text className="text-black-100 font-rubik text-sm mt-0.5">
              Search Something
            </Text>
          </View>
        </View>
        <Image source={icons.filter} className="size-5" tintColor="#8C8E98" />
      </View>
    </TouchableOpacity>
  );
};
