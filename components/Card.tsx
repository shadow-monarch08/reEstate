import { View, Text, Image, TouchableOpacity, UIManager } from "react-native";
import React from "react";
import images from "@/constants/images";
import icons from "@/constants/icons";
import { _internal_maybeHideAsync } from "expo-router/build/utils/splash";
import {
  ConversationOverviewReturnType,
  PropertyReturnType,
} from "@/lib/supabase";
import Animated, {
  Layout,
  LinearTransition,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import { timeSince, formatTimestamp } from "@/utils";
import { LikeButton } from "./Button";
import { useWishlistStore } from "@/lib/zustand/store/useWishlistStore";
import { ActiveConversationData } from "@/lib/zustand/store/useChatStore";

export interface Props {
  onPress?: () => void;
  item: PropertyReturnType;
}

interface reviewProps {
  id?: string;
  name?: string;
  avatar?: string;
  review?: string;
  created_at: string;
}

export const LoadingFeaturedCard = () => {
  return (
    <View className="h-[20rem] max-w-[15rem] overflow-hidden relative bg-primary-200 rounded-[2rem]">
      <View className="flex flex-row">
        <View className="flex flex-col px-4 h-full py-6 w-full justify-end gap-2">
          <View className="w-1/2 h-8 bg-primary-200 rounded-full" />
          <View className="w-full h-5 bg-primary-200 rounded-full" />
          <View className="w-1/3 h-7 bg-primary-200 rounded-full" />
        </View>
      </View>
    </View>
  );
};

export const FeaturedCard = React.memo(
  ({ onPress, item: { address, id, image, name, price, rating } }: Props) => {
    const { wishlistIds } = useWishlistStore();
    return (
      <TouchableOpacity
        className="h-[20rem] flex-1 max-w-[15rem] overflow-hidden relative"
        activeOpacity={0.6}
        onPress={onPress}
      >
        <Image
          src={image}
          className="absolute top-0 left-0 h-full w-full rounded-[2rem]"
          resizeMode="cover"
        />
        <Image
          source={images.card_gradient}
          className="size-full absolute bottom-0 rounded-[2rem]"
        />
        <View className="flex flex-col justify-between h-full py-6">
          <View className="flex flex-row-reverse px-5">
            <View className="rounded-full bg-white py-2 px-3 flex flex-row gap-1 w-fit items-center">
              <Image
                source={icons.star}
                className="size-4"
                resizeMode="contain"
              />
              <Text className="font-rubik-medium text-xs text-primary-300 mt-0.5">
                {rating}
              </Text>
            </View>
          </View>

          <View className="flex flex-row px-4 justify-between items-end">
            <View className="flex flex-col gap-1">
              <Text
                className="text-white font-rubik-extrabold text-base"
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text className="text-white font-rubik text-sm" numberOfLines={1}>
                {address}
              </Text>
              <View className="flex flex-row justify-between items-center">
                <Text className="text-white font-rubik-bold text-base">
                  ${price}
                </Text>
                <LikeButton isWishListed={wishlistIds.has(id)} id={id} />
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

export const LoadingColumnCard = () => {
  return (
    <View className="p-4 rounded-2xl bg-white shadow-zinc-200 shadow-md flex-1 min-w-[12rem] max-w-[13rem]">
      <View className="relative h-[10rem] w-full bg-primary-200 rounded-xl" />
      <View className="flex flex-row justify-between items-end mt-3">
        <View className="flex flex-col gap-2 w-full">
          <View className="w-1/2 h-7 bg-primary-200 rounded-full" />
          <View className="w-full h-4 bg-primary-200 rounded-full" />
          <View className="w-1/3 h-6 bg-primary-200 rounded-full" />
        </View>
      </View>
    </View>
  );
};

export const ColumnCard = React.memo(
  ({ onPress, item: { address, id, image, name, price, rating } }: Props) => {
    const { wishlistIds } = useWishlistStore();
    return (
      <TouchableOpacity
        className="p-4 rounded-2xl bg-white shadow-zinc-200 shadow-md flex-1 min-w-[12rem] max-w-[13rem]"
        activeOpacity={0.6}
        onPress={onPress}
      >
        <View className="relative h-[10rem] w-full">
          <Image
            className="h-full w-full rounded-xl absolute top-0 left-0"
            src={image}
            resizeMode="cover"
          />
          <View className="flex flex-row-reverse px-2 py-3">
            <View className="rounded-full bg-white py-1 px-2 flex flex-row gap-1 w-fit items-center">
              <Image
                source={icons.star}
                className="size-3"
                resizeMode="contain"
              />
              <Text className="font-rubik-medium text-[0.6rem] text-primary-300 mt-0.5">
                {rating}
              </Text>
            </View>
          </View>
        </View>
        <View className="flex flex-row justify-between items-end mt-3">
          <View className="flex flex-col gap-2">
            <Text
              className="text-black-300 font-rubik-bold text-sm"
              numberOfLines={1}
            >
              {name}
            </Text>
            <Text
              className="text-black-100 font-rubik text-xs"
              numberOfLines={1}
            >
              {address}
            </Text>
            <View className="flex flex-row justify-between items-center">
              <Text className="text-primary-300 font-rubik-bold text-sm">
                ${price}
              </Text>
              <LikeButton isWishListed={wishlistIds.has(id)} id={id} />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }
);

export const LoadingRowCard = () => {
  return (
    <View className="bg-white flex flex-row gap-4 p-4 h-[10rem] w-full max-w-[30rem] shadow-zinc-100 shadow-md rounded-3xl">
      <View className="h-full w-[7.5rem] relative bg-primary-200 rounded-2xl" />
      <View className="flex flex-col justify-between py-5 w-2/5">
        <View className="flex flex-col gap-4">
          <View className="h-[1.1rem] w-full rounded-full bg-primary-200" />
          <View className="h-[1.1rem] w-1/3 rounded-full bg-primary-200" />
        </View>
        <View className="h-[0.8rem] w-full rounded-full bg-primary-200" />
      </View>
      <View className="flex flex-col justify-between py-5 items-end flex-1">
        <View className="size-7 rounded-full bg-primary-200" />
        <View className="h-[1rem] w-1/2 rounded-full bg-primary-200" />
      </View>
    </View>
  );
};

export const RowCard = React.memo(
  ({ onPress, item: { address, id, image, name, price, rating } }: Props) => {
    const { wishlistIds } = useWishlistStore();
    return (
      <View className="px-5 w-full flex items-center mt-5">
        <TouchableOpacity
          className="bg-white flex flex-row gap-4 p-4 h-[10rem] w-full max-w-[30rem] shadow-zinc-100 shadow-md rounded-3xl"
          activeOpacity={0.7}
          onPress={onPress}
        >
          <View className="h-full w-[7.5rem] relative">
            <Image
              source={{ uri: image }}
              className="h-full w-full absolute top-0 left-0 rounded-2xl"
              resizeMode="cover"
            />
            <View className="p-3 flex flex-row-reverse">
              <View className="rounded-full bg-white px-1 flex flex-row gap-1 w-fit items-center">
                <Image
                  source={icons.star}
                  className="size-3"
                  resizeMode="contain"
                />
                <Text className="font-rubik-medium text-[0.6rem] text-primary-300 mt-0.5">
                  {rating}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex flex-col justify-between py-5 w-2/5">
            <Text
              className="break-words text-black-300 font-rubik-semibold text-base"
              numberOfLines={2}
            >
              {name}
            </Text>
            <Text
              className="break-words text-black-200 font-rubik text-sm"
              numberOfLines={1}
            >
              {address}
            </Text>
          </View>
          <View className="flex flex-col justify-between py-5 items-end flex-1">
            <LikeButton isWishListed={wishlistIds.has(id)} id={id} />
            <Text className="text-primary-300 font-rubik-bold text-sm">
              ${price}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }
);

export const LoadingReviewCard = () => {
  return (
    <View className="flex flex-col gap-4 w-full">
      <View className="flex flex-row gap-3 w-full items-center">
        <View className="size-12 rounded-full bg-primary-200" />
        <View className="h-[1.5rem] w-20 rounded-full bg-primary-200" />
      </View>
      <View className="h-[1.5rem] w-full rounded-full bg-primary-200" />
      <View className="flex-row justify-between w-full items-center">
        <View className="flex flex-row gap-2 items-center">
          <View className="size-6 rounded-full bg-primary-200" />
          <View className="h-[1rem] w-16 rounded-full bg-primary-200" />
        </View>
        <View className="h-[1rem] w-16 rounded-full bg-primary-200" />
      </View>
    </View>
  );
};

export const ReviewCard = React.memo(
  ({ data: { name, avatar, review, created_at } }: { data: reviewProps }) => {
    return (
      <View className="flex flex-col gap-4 w-full">
        <View className="flex flex-row gap-3 w-full items-center">
          <Image
            className="size-12 rounded-full"
            source={{ uri: avatar }}
            resizeMode="cover"
          />
          <Text className="text-black-300 font-rubik-bold text-base mt-1">
            {name}
          </Text>
        </View>
        <Text className="text-base text-black-200 font-rubik leading-6">
          {review}
        </Text>
        <View className="flex-row justify-between w-full items-center">
          <View className="flex flex-row gap-2">
            <TouchableOpacity>
              <Image
                className="size-6"
                tintColor="#0061FF"
                source={icons.heart}
              />
            </TouchableOpacity>
            <Text className="text-sm font-rubik-medium text-black-300 mt-1">
              938
            </Text>
          </View>
          <Text className="text-black-100 text-sm font-rubik-medium">
            {timeSince(created_at)}
          </Text>
        </View>
      </View>
    );
  }
);

export const LoadingChatCard = () => {
  return (
    <View className="flex flex-row justify-between items-center w-full mt-4 h-fit relative">
      {/* Left section */}
      <View className="flex flex-row gap-4 w-2/3">
        {/* Avatar */}
        <View className="overflow-hidden flex flex-row justify-center size-16 rounded-full bg-primary-200" />

        {/* Name + Last message */}
        <View className="flex flex-col justify-between py-1 flex-1">
          <View className="h-5 w-32 rounded-md bg-primary-200" />
          <View className="flex flex-row gap-2">
            <View className="size-5 rounded-full bg-primary-200" />
            <View className="h-4 w-24 rounded-md bg-primary-200" />
          </View>
        </View>
      </View>

      {/* Right section */}
      <View className="flex flex-col justify-between items-end absolute right-0 h-full">
        <View className="rounded-full size-7 bg-primary-200" />
        <View className="flex flex-1 flex-row items-end">
          <View className="h-3 w-12 rounded-md bg-primary-200" />
        </View>
      </View>
    </View>
  );
};

export const ChatCard = React.memo(
  ({
    item,
    handlePress,
  }: { item: ConversationOverviewReturnType } & {
    handlePress: (param: ActiveConversationData) => void;
  }) => {
    return (
      <Animated.View
        style={{
          marginTop: 28,
          width: "100%",
        }}
        layout={LinearTransition.duration(200)}
      >
        <TouchableOpacity
          activeOpacity={0.6}
          className="flex flex-row justify-between items-center w-full h-fit relative"
          onPress={() =>
            handlePress({
              agent_avatar: item.agent_avatar,
              avatar_last_update: item.avatar_last_update,
              conversation_id: item.conversation_id,
              agent_name: item.agent_name,
              agent_id: item.agent_id,
            })
          }
        >
          <View className="flex flex-row gap-4 w-2/3">
            <View className="overflow-hidden flex flex-row justify-center size-16 rounded-full">
              <Image
                src={item.agent_avatar}
                className="h-16 w-20"
                resizeMode="cover"
              />
            </View>
            <View className="flex flex-col justify-between py-1">
              <Text className="text-black-300 font-rubik-medium text-lg">
                {item.agent_name}
              </Text>
              <View className="flex flex-row gap-2">
                {item.last_message_pending ? (
                  <Image
                    source={icons.clock}
                    tintColor={"#666876"}
                    className="size-5"
                  />
                ) : (
                  item.last_message_sender_role === "user" &&
                  (item.last_message_status === "sent" ? (
                    <Image
                      source={icons.tick}
                      tintColor={"#666876"}
                      className="size-5"
                    />
                  ) : (
                    <Image
                      source={icons.tick_double}
                      tintColor={
                        item.last_message_status === "received"
                          ? "#666876"
                          : "#0061FF"
                      }
                      className="size-5"
                    />
                  ))
                )}
                <Text
                  className="text-black-200 font-rubik text-sm"
                  numberOfLines={1}
                >
                  {item.last_message}
                </Text>
              </View>
            </View>
          </View>
          <View className="flex flex-col justify-between items-end absolute right-0 h-full">
            {item.unread_count ?? 0 > 0 ? (
              <View className="rounded-full bg-primary-300 size-7 flex items-center justify-center">
                <Text className="font-rubik-medium text-white text-xs mt-1">
                  {item.unread_count}
                </Text>
              </View>
            ) : null}
            <View className="flex flex-1 flex-row items-end">
              <Text className="font-rubik-medium text-xs text-black-200">
                {formatTimestamp(item.last_message_time)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }
);

export const EmptyRowCard = () => {
  return (
    <View className="bg-white flex flex-row gap-4 p-4 h-[10rem] w-full max-w-[30rem] shadow-zinc-100 shadow-md rounded-3xl">
      <Image
        source={images.no_result}
        className="h-full w-[7.5rem] rounded-2xl"
      />
      <View className="flex flex-col gap-4 justify-center w-3/5">
        <Text className="text-black-300 font-rubik-semibold text-base">
          No results found
        </Text>
        <Text
          className="text-black-200 font-rubik text-sm text-wrap"
          numberOfLines={2}
        >
          Try adjusting your search radius for more results.
        </Text>
      </View>
    </View>
  );
};
