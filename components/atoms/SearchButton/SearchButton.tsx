import icons from "@/constants/icons";
import { router } from "expo-router";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const SearchButton = ({ query }: { query: string }) => {
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

export default React.memo(SearchButton);
