import { Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { ButtonProps } from "./types";

const CustomButton: React.FC<ButtonProps> = ({
  text,
  handlePress,
  image,
  buttonStyle,
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

export default React.memo(CustomButton);
