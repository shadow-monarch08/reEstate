import { View, Text, Image, TextInput, TouchableOpacity } from "react-native";
import React from "react";
import icons from "@/constants/icons";

const ChatInput = ({
  value,
  handleInput,
  placeholder = "Type your message",
  handleSubmit,
}: {
  value?: string;
  handleInput?: (param: string) => void;
  placeholder?: string;
  handleSubmit?: () => void;
}) => {
  return (
    <View className="w-full px-5 mb-6 flex flex-row gap-3 items-center">
      <View className="flex flex-1 flex-row gap-2 bg-primary-100 px-4 py-5 rounded-2xl">
        <View className="flex flex-1 flex-row gap-3 items-center">
          <TouchableOpacity>
            <Image
              source={icons.smiley}
              className="size-6"
              tintColor="#8C8E98"
              resizeMode="contain"
            />
          </TouchableOpacity>
          <TextInput
            value={value}
            onChangeText={handleInput}
            placeholder={placeholder}
            multiline
            textAlignVertical="top"
            scrollEnabled
            className="font-rubik text-base flex-1 mt-0.5 text-black-300 break-words max-h-20"
          />
        </View>
        <View className="flex flex-row items-center gap-3">
          <TouchableOpacity onPress={handleSubmit}>
            <Image source={icons.clip} className="size-6" tintColor="#8C8E98" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSubmit}>
            <Image
              source={icons.camera}
              className="size-6"
              tintColor="#8C8E98"
            />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity
        activeOpacity={0.6}
        className="p-3.5 bg-primary-300 rounded-full shadow-slate-300 shadow-lg"
      >
        <Image source={icons.mic} className="size-7" tintColor={"white"} />
      </TouchableOpacity>
    </View>
  );
};

export default ChatInput;
