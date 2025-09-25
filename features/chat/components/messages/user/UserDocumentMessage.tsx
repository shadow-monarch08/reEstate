import { AssetMetaData } from "@/lib/zustand/store/useAppStore";
import { RawMessage } from "@/types/domain/chat";
import { formatBytes, openFileWithApp } from "@/utils";
import { Alert, Image, Text, TouchableOpacity, View } from "react-native";
import UserMessageWrapper from "./UserMessageWrapper";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { ActivityIndicator } from "react-native-paper";
import icons from "@/constants/icons";
import { useChatStore } from "@/lib/zustand/store/useChatStore";
import { UserDocumentMessageType } from "./types";
import React from "react";

const UserDocumentMessage = ({ msg }: { msg: UserDocumentMessageType }) => {
  const { bus } = useChatStore();

  const pickAndOpenFile = async () => {
    try {
      if (msg.body) {
        const asset: AssetMetaData = JSON.parse(msg.body);

        // 2. Check if sharing is available on the device
        // 2. Call your new cross-platform function
        if (asset.uri && asset.mime_type) {
          await openFileWithApp(
            asset.uri,
            asset.mime_type.split("/").splice(1, 2).join("/")
          );
        } else {
          Alert.alert("Error", "Could not determine file type.");
        }
      }
    } catch (error: any) {
      Alert.alert("An error occurred:", error);
      console.error("Error picking or sharing document:", error);
    }
  };
  return (
    <UserMessageWrapper
      onPress={pickAndOpenFile}
      msg={msg}
      innerContainerClass="pb-8 w-[17rem]"
    >
      <View className="flex-row gap-3 items-center p-3 bg-blue-500 rounded-lg w-full">
        <Image className="size-7" tintColor={"#FBFBFD"} source={icons.doc} />
        <View className="flex-1 flex flex-col justify-center items-start gap-1">
          <Text
            numberOfLines={2}
            className="font-rubik text-base mt-0.5 text-accent-100"
          >
            {msg.file_name}
          </Text>
          <Text className="font-rubik text-xs mt-0.5 text-slate-300">
            {formatBytes(msg.file_size)}
          </Text>
        </View>
        {msg.upload_status === "uploading" && (
          <Animated.View
            entering={FadeInDown.duration(150)}
            exiting={FadeOutDown.duration(150)}
          >
            <TouchableOpacity
              onPress={() =>
                bus.emit("upload:cancel", { local_id: msg.local_id })
              }
              className="relative size-7 flex justify-center items-center"
            >
              <Image
                source={icons.cross_h}
                tintColor="#FBFBFD"
                className="size-5 absolute left-1/2 bottom-1/2 -translate-x-1/2 translate-y-1/2"
              />
              <ActivityIndicator animating={true} size={29} color="#FBFBFD" />
            </TouchableOpacity>
          </Animated.View>
        )}
        {msg.upload_status === "failed" && (
          <Animated.View
            entering={FadeInDown.duration(150)}
            exiting={FadeOutDown.duration(150)}
          >
            <TouchableOpacity
              onPress={() => bus.reSend(msg.local_id)}
              className="relative size-7 flex justify-center items-center"
            >
              <Image
                source={icons.upload_h}
                tintColor="#FBFBFD"
                className="size-6"
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
      {msg.body && (
        <View className="mt-2 px-1">
          <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-accent-100">
            {msg.body}
          </Text>
        </View>
      )}
    </UserMessageWrapper>
  );
};

export default React.memo(UserDocumentMessage);
