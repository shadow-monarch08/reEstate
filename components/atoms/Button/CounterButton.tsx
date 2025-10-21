import { Image, Text } from "react-native";
import { TouchableOpacity, View } from "react-native";
import { CounterButttonProps } from "./types";
import icons from "@/constants/icons";
import React from "react";

const CounterButton = ({ value, handelValue }: CounterButttonProps) => {
  return (
    <View className="flex flex-row justify-between px-1 items-center w-2/6">
      <TouchableOpacity
        onPress={() => handelValue(-1)}
        className="p-1 bg-primary-100 rounded-full overflow-hidden"
      >
        <Image source={icons.minus} tintColor="#0061FF" className="size-6" />
      </TouchableOpacity>
      <Text className="text-sm font-rubik-medium text-black-300 mt-1">
        {value}
      </Text>
      <TouchableOpacity
        onPress={() => handelValue(1)}
        className="p-1 bg-primary-100 rounded-full overflow-hidden"
      >
        <Image source={icons.plus} tintColor="#0061FF" className="size-6" />
      </TouchableOpacity>
    </View>
  );
};

export default React.memo(CounterButton);
