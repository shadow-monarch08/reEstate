import { View, Text, Image, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import icons from "@/constants/icons";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from "react-native-reanimated";

const CheckBox = ({ onPress, isSelected }: { onPress: () => void, isSelected: boolean }) => {
  const animatedStylePlus = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(isSelected ? 1 : 0, { duration: 200 }) }],
    // opacity: withTiming(isSelected? 1: 0, { duration: 300 })
  }));
  const animatedStyleMinus = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(!isSelected ? 1 : 0, { duration: 200 }) }],
    // opacity: withTiming(isSelected? 1: 0, { duration: 300 })
  }));
  return (
    <TouchableOpacity
      activeOpacity={1}
      className="size-7 p-1 rounded-lg bg-primary-200 relative"
      onPress={onPress}
    >
      <Animated.View
        style={animatedStylePlus}
        className="bg-safe p-0.5 rounded-md size-full overflow-hidden absolute left-1 top-1"
      >
        <Image source={icons.plus} className="size-full" tintColor="white" />
      </Animated.View>
      <Animated.View
        style={animatedStyleMinus}
        className="bg-danger p-0.5 rounded-md size-full overflow-hidden absolute left-1 top-1"
      >
        <Image source={icons.minus} className="size-full" tintColor="white" />
      </Animated.View>
    </TouchableOpacity>
  );
};

export default CheckBox;
