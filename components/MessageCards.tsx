import icons from "@/constants/icons";
import images from "@/constants/images";
import { RawMessage } from "@/lib/database/localStore";
import { formatBytes, openFileWithApp, simpleFormatTimestamp } from "@/utils";
import {
  Alert,
  Image,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Sharing from "expo-sharing";
import { AssetMetaData, useAppStore } from "@/lib/zustand/store/useAppStore";
import { ActivityIndicator } from "react-native-paper";
import { useChatStore } from "@/lib/zustand/store/useChatStore";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "pending":
      return icons.clock;
    case "sent":
      return icons.tick;
    case "received":
      return icons.tick_double;
    case "read":
      return icons.tick_double;
    default:
      return icons.bell;
  }
};

export const LoadingAgentMessage = () => (
  <View className="w-full flex flex-col items-end py-1">
    <View className="max-w-[80%] flex flex-row gap-2 rounded-[1rem] rounded-ee-md bg-primary-100 px-5 py-4 items-end">
      {/* timestamp placeholder */}
      <View className="h-full flex flex-row justify-end">
        <View className="h-3 w-6 bg-gray-200/40 rounded-md" />
      </View>
      {/* message text placeholder */}
      <View className="h-5 w-40 bg-gray-200/40 rounded-md" />
    </View>
  </View>
);

// Skeleton bubble for user (right side)
export const LoadingUserMessage = () => (
  <View className="w-full flex flex-col items-start py-1">
    <View className="max-w-[80%] flex flex-row-reverse gap-2 rounded-[1rem] rounded-ss-md bg-primary-300 px-5 py-4 items-end">
      {/* message text placeholder */}
      <View className="h-5 w-32 bg-gray-200/40 rounded-md" />
      {/* timestamp + tick placeholder */}
      <View className="flex flex-row gap-1 items-start justify-end h-full">
        <View className="size-4 rounded-full bg-gray-200/40" />
        <View className="h-3 w-6 bg-gray-200/40 rounded-md" />
      </View>
    </View>
  </View>
);

export const AgentTextTypeMessage = ({ msg }: { msg: RawMessage }) => {
  return (
    <View className="max-w-[80%] flex flex-row gap-2 rounded-[1rem] rounded-ss-md bg-primary-100 px-5 py-4 items-end">
      <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-black-300">
        {msg.body}
      </Text>
      <View className="flex flex-row gap-1 items-center">
        <Text className="font-rubik text-xs text-black-300">
          {simpleFormatTimestamp(msg.created_at)}
        </Text>
      </View>
    </View>
  );
};

export const AgentImageTypeMessage = ({ msg }: { msg: RawMessage }) => {
  const { bus } = useChatStore();
  return (
    <Pressable className="max-w-[80%] rounded-[1rem] rounded-ss-md bg-primary-100 p-2 relative">
      <View className="relative w-[15rem] h-72 overflow-hidden">
        {JSON.parse(msg.body).uri ? (
          <Image
            className="h-full w-full rounded-[1rem]"
            source={{ uri: JSON.parse(msg.body).uri }}
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
                  {formatBytes(JSON.parse(msg.body).file_size)}
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
      {JSON.parse(msg.body).message && (
        <View className="mt-2">
          <Text className="text-wrap flex-wrap pl-1 flex-shrink font-rubik text-base mt-0.5 text-black-300">
            {JSON.parse(msg.body).message} {"\t\t\t\t\t\t\t\t\t"}
          </Text>
        </View>
      )}
      <View className="flex-row gap-1 items-center absolute bottom-3 right-3">
        <Text
          className={`font-rubik text-xs mt-0.5 ${
            JSON.parse(msg.body).message ? "text-black-300" : "text-accent-100"
          }`}
        >
          {simpleFormatTimestamp(msg.created_at)}
        </Text>
      </View>
    </Pressable>
  );
};

export const AgentDocumentTypeMessage = ({ msg }: { msg: RawMessage }) => {
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
    <Pressable
      onPress={() => {
        pickAndOpenFile();
      }}
      className="max-w-[80%] rounded-[1rem] rounded-ss-md bg-primary-100 p-2 pb-8 relative"
    >
      <View className="flex-row w-[17rem] gap-3 items-center p-3 bg-primary-200 rounded-lg">
        <Image className="size-7" tintColor={"#666876"} source={icons.doc} />
        <View className="flex-1 flex flex-col justify-center items-start gap-1">
          <Text
            numberOfLines={2}
            className="font-rubik text-base mt-0.5 text-black-200"
          >
            {JSON.parse(msg.body).file_name}
          </Text>
          <Text className="font-rubik text-xs mt-0.5 text-black-100">
            {formatBytes(JSON.parse(msg.body).file_size)}
          </Text>
        </View>
        {msg.upload_status === "downloading" && (
          <Animated.View
            entering={FadeInDown.duration(150)}
            exiting={FadeOutDown.duration(150)}
          >
            <TouchableOpacity className="relative size-7 flex justify-center items-center">
              <Image
                source={icons.cross_h}
                tintColor="#666876"
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
              onPress={() => bus.downloadFileForMessage(msg.local_id)}
              className="relative size-7 flex justify-center items-center"
            >
              <Image
                source={icons.download_h}
                tintColor="#666876"
                className="size-6"
              />
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
      {JSON.parse(msg.body).message && (
        <View className="mt-2 px-1">
          <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-black-300">
            {JSON.parse(msg.body).message}
          </Text>
        </View>
      )}
      <View className="flex-row gap-1 items-center absolute bottom-2 right-3">
        <Text className="font-rubik text-xs mt-0.5 text-black-300">
          {simpleFormatTimestamp(msg.created_at)}
        </Text>
      </View>
    </Pressable>
  );
};

export const UserTextTypeMessage = ({
  msg,
  onLongPressHandler,
  onPressHandler,
}: {
  msg: RawMessage;
  onLongPressHandler: () => void;
  onPressHandler: () => void;
}) => {
  const { selectedMessageCount } = useAppStore();
  return (
    <Pressable
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.6 : 1,
        },
      ]}
      onPress={() => {
        if (selectedMessageCount > 0) {
          onPressHandler();
        } else {
        }
      }}
      onLongPress={onLongPressHandler}
      className="max-w-80 flex flex-row rounded-[1rem] rounded-ee-md gap-1 bg-primary-300 px-4 py-3 items-end relative"
    >
      <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-accent-100">
        {msg.body} {"\t\t\t\t\t\t\t\t\t\t"}
      </Text>
      <View className="flex flex-row gap-1 items-center absolute bottom-2 right-3">
        <Text className="font-rubik text-xs mt-0.5 text-accent-100">
          {simpleFormatTimestamp(msg.created_at)}
        </Text>
        <Image
          source={getStatusIcon(msg.status)}
          tintColor={msg.status !== "read" ? "#FBFBFD" : "#93c5fd"}
          className="size-5"
        />
      </View>
    </Pressable>
  );
};

export const UserImageTypeMessage = ({
  msg,
  onLongPressHandler,
  onPressHandler,
}: {
  msg: RawMessage;
  onLongPressHandler: () => void;
  onPressHandler: () => void;
}) => {
  const { bus } = useChatStore();
  const { selectedMessageCount } = useAppStore();
  return (
    <Pressable
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.6 : 1,
        },
      ]}
      onPress={() => {
        if (selectedMessageCount > 0) {
          onPressHandler();
        } else {
        }
      }}
      onLongPress={onLongPressHandler}
      className="max-w-[80%] rounded-[1rem] rounded-ee-md bg-primary-300 p-2 relative"
    >
      <View className="relative w-[15rem] h-72 overflow-hidden">
        <Image
          className="h-full w-full rounded-[1rem]"
          source={{ uri: JSON.parse(msg.body).uri }}
        />
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
                onPress={() => bus.reSend(msg.local_id)}
                className="bg-[#0061FF80] rounded-full p-2 flex justify-center items-center flex-row gap-2"
                activeOpacity={0.7}
              >
                <Image
                  source={icons.upload_h}
                  tintColor="#FBFBFD"
                  className="size-6"
                />
                <Text className="text-accent-100 font-rubik text-base0">
                  {formatBytes(JSON.parse(msg.body).file_size)}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
          {msg.upload_status === "uploading" && (
            <Animated.View
              className="size-fit"
              entering={FadeInDown.duration(150)}
              exiting={FadeOutDown.duration(150)}
            >
              <TouchableOpacity
                onPress={() =>
                  bus.emit("upload:cancel", { local_id: msg.local_id })
                }
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
      {JSON.parse(msg.body).message && (
        <View className="mt-2">
          <Text className="text-wrap flex-wrap pl-1 flex-shrink font-rubik text-base mt-0.5 text-accent-100">
            {JSON.parse(msg.body).message} {"\t\t\t\t\t\t\t\t\t"}
          </Text>
        </View>
      )}
      <View className="flex-row gap-1 items-center absolute bottom-3 right-3">
        <Text className="font-rubik text-xs mt-0.5 text-accent-100">
          {simpleFormatTimestamp(msg.created_at)}
        </Text>
        <Image
          source={getStatusIcon(msg.status)}
          tintColor={msg.status !== "read" ? "#FBFBFD" : "#93c5fd"}
          className="size-5"
        />
      </View>
    </Pressable>
  );
};

export const UserDocumentTypeMessage = ({
  msg,
  onLongPressHandler,
  onPressHandler,
}: {
  msg: RawMessage;
  onLongPressHandler: () => void;
  onPressHandler: () => void;
}) => {
  const { bus } = useChatStore();
  const { selectedMessageCount } = useAppStore();
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
    <Pressable
      style={({ pressed }) => [
        {
          opacity: pressed ? 0.6 : 1,
        },
      ]}
      onPress={() => {
        if (selectedMessageCount > 0) {
          onPressHandler();
        } else {
          pickAndOpenFile();
        }
      }}
      onLongPress={onLongPressHandler}
      className="max-w-[80%] w-[17rem] rounded-[1rem] rounded-ee-md bg-primary-300 p-2 pb-8 relative"
    >
      <View className="flex-row gap-3 items-center p-3 bg-blue-500 rounded-lg w-full">
        <Image className="size-7" tintColor={"#FBFBFD"} source={icons.doc} />
        <View className="flex-1 flex flex-col justify-center items-start gap-1">
          <Text
            numberOfLines={2}
            className="font-rubik text-base mt-0.5 text-accent-100"
          >
            {JSON.parse(msg.body).file_name}
          </Text>
          <Text className="font-rubik text-xs mt-0.5 text-slate-300">
            {formatBytes(JSON.parse(msg.body).file_size)}
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
      {JSON.parse(msg.body).message && (
        <View className="mt-2 px-1">
          <Text className="text-wrap flex-wrap flex-shrink font-rubik text-base mt-0.5 text-accent-100">
            {JSON.parse(msg.body).message}
          </Text>
        </View>
      )}
      <View className="flex-row gap-1 items-center absolute bottom-2 right-3">
        <Text className="font-rubik text-xs mt-0.5 text-accent-100">
          {simpleFormatTimestamp(msg.created_at)}
        </Text>
        <Image
          source={getStatusIcon(msg.status)}
          tintColor={msg.status !== "read" ? "#FBFBFD" : "#93c5fd"}
          className="size-5"
        />
      </View>
    </Pressable>
  );
};
