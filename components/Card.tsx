import { View, Text, Image, TouchableOpacity, UIManager } from "react-native";
import React, { useState } from "react";
import images from "@/constants/images";
import icons from "@/constants/icons";
import { _internal_maybeHideAsync } from "expo-router/build/utils/splash";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { ChatOverviewReturnType } from "@/lib/supabase";
import { router } from "expo-router";

interface propertyItem {
  address: string;
  id: string;
  image: string;
  name: string;
  price: number;
  rating: number;
}

interface Props {
  onPress?: (params: string) => void;
  item: propertyItem;
  isWishlisted?: boolean;
  handleWishlist: (propertyId: string, operation: "insert" | "delete") => void;
}

interface reviewProps {
  id?: string;
  name?: string;
  avatar?: string;
  review?: string;
  created_at: string;
}

function timeSince(dateString: string): string {
  // Step 1: Replace space with 'T' to form ISO date
  let isoString = dateString.replace(" ", "T");

  // Step 2: Trim microseconds to 3 digits (JavaScript supports only milliseconds)
  isoString = isoString.replace(/(\.\d{3})\d*/, "$1");

  // Step 3: Ensure timezone is correctly formatted
  isoString = isoString.replace("+00:00", "Z");

  const inputDate = new Date(isoString);
  const now = new Date();
  // console.log(now.toString())

  if (isNaN(inputDate.getTime())) {
    return "Invalid date";
  }

  const diffInMs = now.getTime() - inputDate.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30); // Approximate
  const diffInYears = Math.floor(diffInDays / 365); // Approximate

  if (diffInYears > 0) {
    return `${diffInYears} year${diffInYears > 1 ? "s" : ""} ago`;
  } else if (diffInMonths > 0) {
    return `${diffInMonths} month${diffInMonths > 1 ? "s" : ""} ago`;
  } else if (diffInDays > 0) {
    return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;
  } else if (diffInHours > 0) {
    return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? "s" : ""} ago`;
  } else {
    return "just now";
  }
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();

  const isSameDay = (d1: Date, d2: Date) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isYesterday = (d: Date) => {
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    return isSameDay(d, yesterday);
  };

  if (isSameDay(date, now)) {
    // 24-hour format (e.g., 14:45)
    return "Today";
  }

  if (isYesterday(date)) {
    return "Yesterday";
  }

  // Format date (e.g., 09 Jun 2025)
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });
}

const LikeButton = ({
  isWishlisted,
  handleWishlist,
  id,
}: {
  id: string;
  isWishlisted: boolean | undefined;
  handleWishlist: (id: string, operation: "insert" | "delete") => void;
}) => {
  const animatedHeartFilled = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(isWishlisted ? 1 : 0, { duration: 200 }) }],
  }));
  const animatedHeartOutline = useAnimatedStyle(() => ({
    transform: [
      { scale: withTiming(!isWishlisted ? 1 : 0, { duration: 200 }) },
    ],
  }));
  const [wishlisted, setWishlisted] = useState(isWishlisted);
  return (
    <TouchableOpacity
      onPress={() => {
        handleWishlist(id, wishlisted ? "delete" : "insert");
        setWishlisted(!wishlisted);
      }}
      className="relative size-6"
    >
      <Animated.View
        style={animatedHeartOutline}
        className="size-full absolute left-0 top-0 "
      >
        <Image tintColor="#8C8E98" className="size-full" source={icons.heart} />
      </Animated.View>
      <Animated.View
        style={animatedHeartFilled}
        className="size-full absolute left-0 top-0 "
      >
        <Image
          tintColor="#F75555"
          className="size-full"
          source={icons.heart_filled}
        />
      </Animated.View>
    </TouchableOpacity>
  );
};

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

export const FeaturedCard = ({
  onPress,
  item: { address, id, image, name, price, rating },
  isWishlisted,
  handleWishlist,
}: Props) => {
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
        source={images.cardGradient}
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
              <LikeButton
                isWishlisted={isWishlisted}
                handleWishlist={handleWishlist}
                id={id}
              />
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const LoadingCard = () => {
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

export const Card = ({
  onPress,
  item: { address, id, image, name, price, rating },
  isWishlisted,
  handleWishlist,
}: Props) => {
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
          <Text className="text-black-100 font-rubik text-xs" numberOfLines={1}>
            {address}
          </Text>
          <View className="flex flex-row justify-between items-center">
            <Text className="text-primary-300 font-rubik-bold text-sm">
              ${price}
            </Text>
            <LikeButton
              isWishlisted={isWishlisted}
              id={id}
              handleWishlist={handleWishlist}
            />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const LoadingSearchCard = () => {
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

export const SearchCard = ({
  onPress,
  item: { address, id, image, name, price, rating },
  isWishlisted,
  handleWishlist,
}: Props) => {
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
          <LikeButton
            isWishlisted={isWishlisted}
            id={id}
            handleWishlist={handleWishlist}
          />
          <Text className="text-primary-300 font-rubik-bold text-sm">
            ${price}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

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

export const ReviewCard = ({
  data: { name, avatar, review, created_at },
}: {
  data: reviewProps;
}) => {
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
};

export const ChatCard = ({
  item,
  handlePress,
}: { item: ChatOverviewReturnType } & {
  handlePress: (param: object) => void;
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.6}
      className="flex flex-row justify-between items-center w-full mt-5 h-fit relative"
      onPress={() =>
        handlePress({
          conversation_id: item.conversation_id,
          avatar_url: item.agent_avatar,
          agent_name: item.agent_name,
          agent_id: item.agent_id,
        })
      }
    >
      <View className="flex flex-row gap-4 w-2/3">
        <Image
          source={{ uri: item.agent_avatar }}
          className="size-16 rounded-full"
        />
        <View className="flex flex-col justify-between py-1">
          <Text className="text-black-300 font-rubik-medium text-lg">
            {item.agent_name}
          </Text>
          <Text className="text-black-200 font-rubik text-sm" numberOfLines={1}>
            {item.last_message}
          </Text>
        </View>
      </View>
      <View className="flex flex-col justify-between items-end absolute right-0 h-full">
        {item.unread_count > 0 ? (
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
  );
};
