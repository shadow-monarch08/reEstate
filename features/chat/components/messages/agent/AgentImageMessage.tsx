import icons from "@/constants/icons";
import images from "@/constants/images";
import { useChatStore } from "@/lib/zustand/store/useChatStore";
import { formatBytes } from "@/utils";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { ActivityIndicator } from "react-native-paper";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import AgentMessageWrapper from "./AgentMessageWrapper";
import { AgentDocumentMessageType } from "./types";
import React from "react";

const AgentImageMessage = ({ msg }: { msg: AgentDocumentMessageType }) => {
  const { bus } = useChatStore();
  return (
    <AgentMessageWrapper onPress={() => {}} msg={msg}>
      <View className="relative w-[15rem] h-72 overflow-hidden">
        {msg.device_path ? (
          <Image
            className="h-full w-full rounded-[1rem]"
            source={{ uri: msg.device_path }}
          />
        ) : (
          <View className="h-full w-full rounded-[1rem] bg-blue-300 flex justify-center items-center">
            <Image
              className="size-28"
              source={icons.gallery_h}
              tintColor="#0061FF1A"
            />
          </View>
        )}
        <Image
          className="h-full w-full rounded-[1rem] absolute top-0 left-0"
          source={images.image_gradient}
          resizeMode="cover"
        />
        <View className="absolute left-0 top-0 size-full flex justify-center items-center">
          {msg.upload_status === "failed" && (
            <Animated.View
              className="size-fit"
              entering={FadeInDown.duration(150)}
              exiting={FadeOutDown.duration(150)}
            >
              <TouchableOpacity
                onPress={() => bus.downloadFileForMessage(msg.local_id)}
                className="bg-[#0061FF80] rounded-full p-2 flex justify-center items-center flex-row gap-2"
                activeOpacity={0.7}
              >
                <Image
                  source={icons.download_h}
                  tintColor="#FBFBFD"
                  className="size-6"
                />
                <Text className="text-accent-100 font-rubik text-base0">
                  {formatBytes(msg.file_size)}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          {msg.upload_status === "downloading" && (
            <Animated.View
              className="size-fit"
              entering={FadeInDown.duration(150)}
              exiting={FadeOutDown.duration(150)}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                className="relative bg-[#0061FF80] rounded-full size-14 flex justify-center items-center"
              >
                <Image
                  source={icons.cross_h}
                  tintColor="#FBFBFD"
                  className="size-6 absolute left-1/2 bottom-1/2 -translate-x-1/2 translate-y-1/2"
                />
                <ActivityIndicator animating={true} size={33} color="#FBFBFD" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </View>
      {msg.body && (
        <View className="mt-2">
          <Text className="text-wrap flex-wrap pl-1 flex-shrink font-rubik text-base mt-0.5 text-black-300">
            {msg.body} {"\t\t\t\t\t\t\t\t\t"}
          </Text>
        </View>
      )}
    </AgentMessageWrapper>
  );
};

export default React.memo(AgentImageMessage);
