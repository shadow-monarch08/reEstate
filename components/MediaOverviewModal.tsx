import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  BackHandler,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import images from "@/constants/images";
import icons from "@/constants/icons";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";
import { useAppStore } from "@/lib/zustand/store/useAppStore";
import { ImagePickerAsset } from "expo-image-picker";
import { DocumentPickerAsset } from "expo-document-picker";
import { useChatStore } from "@/lib/zustand/store/useChatStore";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { LocalMessage, Message } from "@/lib/database/localStore";
import { v4 as uuidv4 } from "uuid";
import { MediaManager } from "@/lib/mediaManager";

function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

const MediaOverviewModal = () => {
  const { isOverviewModalVisible, setIsOverviewModalVisible, assetProvider } =
    useAppStore();
  const { activeConversationData, addMessage, updateWithOrderChange, bus } =
    useChatStore();
  const [activeAsset, setActiveAsset] = useState<
    ImagePickerAsset | DocumentPickerAsset | null
  >(null);
  const [assetMapHolder, setAssetMapHolder] = useState<Map<
    string,
    { asset: ImagePickerAsset | DocumentPickerAsset; msg: string }
  > | null>(null);

  useEffect(() => {
    const backAction = () => {
      setIsOverviewModalVisible(false);
      // highlight-start
      return isOverviewModalVisible; // This is the key to preventing the default behavior
      // highlight-end
    };

    // Add the event listener
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    // Cleanup function: remove the event listener when the component unmounts
    return () => backHandler.remove();
  }, [isOverviewModalVisible]);

  useEffect(() => {
    if (assetProvider) {
      setActiveAsset(assetProvider.asset[0]);
      const assetMap = new Map() as typeof assetMapHolder;
      for (const asset of assetProvider.asset) {
        if (assetProvider.assetType === "Doc") {
          assetMap?.set(asset.uri, {
            asset: asset as DocumentPickerAsset,
            msg: "",
          });
        } else {
          assetMap?.set(asset.uri, {
            asset: asset as ImagePickerAsset,
            msg: "",
          });
        }
      }
      setAssetMapHolder(assetMap);
    }
  }, [assetProvider]);

  const handleSend = async () => {
    if (assetMapHolder) {
      for (const [key, value] of assetMapHolder) {
        // 1. Create a controlled, permanent copy in the 'sent' folder
        const permanentSentUri = await MediaManager.saveSentImage(
          value.asset.uri
        );
        if (assetProvider?.assetType === "Doc") {
          const asset = value.asset as DocumentPickerAsset;
          let msg: Message = {
            local_id: uuidv4(),
            content_type: `file/${asset.mimeType?.split("/")[0]}`,
            body: JSON.stringify({
              file_name: asset.name,
              mime_type: asset.mimeType,
              file_size: asset.size,
              message: value.msg.length > 0 ? value.msg : null,
              uri: permanentSentUri,
            }),
            conversation_id: activeConversationData.conversation_id,
            status: "pending",
            sender_role: "user",
            upload_status: "uploading",
            progress: 0,
            created_at: new Date().toISOString(),
          };
          addMessage(msg);
          updateWithOrderChange({
            last_message: msg.body,
            last_message_time: msg.created_at,
            last_message_content_type: msg.content_type,
            last_message_status: msg.status,
            last_message_sender_role: msg.sender_role,
            conversation_id: activeConversationData.conversation_id,
          });
          bus.sendFileMessage(asset, {
            ...msg,
            file_name: asset.name,
            file_size: asset.size,
            mime_type: asset.mimeType,
            sender_id: "",
            receiver_id: activeConversationData.agent_id,
            pending: 1,
          });
        } else {
          const asset = value.asset as ImagePickerAsset;
          let msg: Message = {
            local_id: uuidv4(),
            content_type: asset.mimeType || "image/jpeg",
            body: JSON.stringify({
              file_name: asset.fileName,
              mime_type: asset.mimeType,
              file_size: asset.fileSize,
              message: value.msg.length > 0 ? value.msg : null,
              uri: permanentSentUri,
            }),
            conversation_id: activeConversationData.conversation_id,
            status: "pending",
            sender_role: "user",
            upload_status: "uploading",
            progress: 0,
            created_at: new Date().toISOString(),
          };
          addMessage(msg);
          updateWithOrderChange({
            last_message: msg.body,
            last_message_time: msg.created_at,
            last_message_content_type: msg.content_type,
            last_message_status: msg.status,
            last_message_sender_role: msg.sender_role,
            conversation_id: activeConversationData.conversation_id,
          });
          bus.sendFileMessage(asset, {
            ...msg,
            file_name: asset.fileName ?? "",
            file_size: asset.fileSize,
            mime_type: asset.mimeType,
            sender_id: "",
            receiver_id: activeConversationData.agent_id,
            pending: 1,
          });
        }
      }
      setIsOverviewModalVisible(false);
    }
  };

  const addMoreAsset = async () => {
    if (assetProvider?.assetType === "Img") {
      let result = await ImagePicker.launchImageLibraryAsync({
        quality: 0.7,
        selectionLimit: 5,
        allowsMultipleSelection: true,
      });
      if (!result.canceled || result.assets) {
        setAssetMapHolder((prev) => {
          const newMap = new Map(prev);
          newMap.set(result.assets[0].uri, {
            asset: result.assets[0] as ImagePickerAsset,
            msg: "",
          });
          return newMap;
        });
      }
      console.log(result);
    } else {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*", // Allow all file types
        copyToCacheDirectory: true, // Recommended to ensure the file is accessible
        multiple: true,
      });
      if (!result.canceled || result.assets) {
        setAssetMapHolder((prev) => {
          const newMap = new Map(prev);
          newMap.set(result.assets[0].uri, {
            asset: result.assets[0] as DocumentPickerAsset,
            msg: "",
          });
          return newMap;
        });
      }
      console.log(result);
    }
  };

  return (
    isOverviewModalVisible && (
      <View className="h-fit w-full absolute bottom-0 left-0 p-3 z-50">
        <Animated.View
          entering={FadeInDown.duration(200)}
          exiting={FadeOutDown.duration(100)}
          className="rounded-2xl w-full p-5 pt-7 bg-white shadow-md shadow-black-300"
        >
          <View className="bg-primary-100 rounded-2xl p-4 h-64 flex justify-center items-center">
            {activeAsset &&
              ("name" in activeAsset ? (
                <View className="flex flex-col gap-2 items-center">
                  <Image
                    className="size-20 rounded-md"
                    resizeMode="cover"
                    source={{ uri: activeAsset.uri }}
                  />
                  <Text
                    numberOfLines={1}
                    className="text-base font-rubik text-black-200"
                  >
                    {activeAsset.name}
                  </Text>
                  <Text className="text-sm font-rubik text-black-300">
                    {formatBytes(activeAsset.size || 0)}
                  </Text>
                </View>
              ) : (
                <Image
                  className="w-full h-full"
                  resizeMode="contain"
                  source={{ uri: activeAsset.uri }}
                />
              ))}
          </View>
          <View className="bg-primary-200 rounded-xl flex-1 p-3 mt-7">
            <TextInput
              value={assetMapHolder?.get(activeAsset?.uri || "")?.msg}
              onChangeText={(m: string) => {
                const newMap = new Map(assetMapHolder);
                if (activeAsset) {
                  let existingData = newMap.get(activeAsset.uri || "");
                  if (existingData) {
                    existingData.msg = m;
                    newMap.set(activeAsset.uri, existingData);
                    setAssetMapHolder(newMap);
                  }
                }
              }}
              placeholder="Caption (optional)"
              multiline
              textAlignVertical="top"
              scrollEnabled
              className="font-rubik text-base flex-1 mt-0.5 text-black-300 break-words max-h-20"
            />
          </View>
          <View className="w-full flex flex-row mt-7 gap-2">
            <TouchableOpacity
              onPress={addMoreAsset}
              className="p-3 bg-primary-100 rounded-xl"
            >
              <Image
                source={icons.plus}
                className="size-7"
                tintColor="#191d31"
              />
            </TouchableOpacity>
            <FlatList
              data={Array.from(assetMapHolder?.values() ?? [])}
              showsHorizontalScrollIndicator={false}
              bounces={true}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => setActiveAsset(item.asset)}
                  className="size-10 flex flex-col gap-1"
                >
                  <Image
                    source={{ uri: item.asset.uri }}
                    className="size-full rounded-lg"
                    resizeMode="cover"
                    style={{
                      opacity: activeAsset?.uri === item.asset.uri ? 1 : 0.5,
                    }}
                  />
                  {activeAsset?.uri === item.asset.uri && (
                    <View className="w-full h-1 bg-primary-300 rounded-full" />
                  )}
                </TouchableOpacity>
              )}
              contentContainerClassName="flex flex-row gap-3"
              contentContainerStyle={{
                paddingHorizontal: "50%",
              }}
              horizontal
            />
            <TouchableOpacity
              onPress={handleSend}
              className="p-3 bg-primary-300 rounded-xl"
            >
              <Image source={icons.send} className="size-7" tintColor="#fff" />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    )
  );
};

export default MediaOverviewModal;
