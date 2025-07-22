import {
  View,
  Text,
  Dimensions,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  ActivityIndicator,
} from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { getPropertyDetail } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import Carousel from "react-native-reanimated-carousel";
import images from "@/constants/images";
import icons from "@/constants/icons";
import { facilities } from "@/constants/data";
import { ReviewCard } from "@/components/Card";
import { Button } from "@/components/Button";
import { useSupabase } from "@/lib/useSupabase";
import { ReviewModal } from "@/components/FilterModal";
import { useGlobalContext } from "@/lib/global-provider";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { getConversationByAgent } from "@/lib/database/chatServices";
// import MyMap from "@/components/MyMap";

const width = Dimensions.get("window").width;

const PropertySpec = ({
  icon,
  title,
  units,
}: {
  icon: ImageSourcePropType;
  title: string;
  units?: number;
}) => {
  return (
    <View className="flex flex-row gap-2 items-center">
      <View className="p-3 rounded-full bg-primary-100">
        <Image className="size-5" source={icon} />
      </View>
      <Text className="text-base font-rubik-medium text-black-300 mt-0.5">
        {units} {title}
      </Text>
    </View>
  );
};

const LikeButton = ({
  isWishlisted,
  handleWishlist,
}: {
  isWishlisted: boolean | undefined;
  handleWishlist: (operation: "insert" | "delete") => void;
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
        handleWishlist(wishlisted ? "delete" : "insert");
        setWishlisted(!wishlisted);
      }}
      className="relative size-7"
    >
      <Animated.View
        style={animatedHeartOutline}
        className="size-full absolute left-0 top-0 "
      >
        <Image tintColor="white" className="size-full" source={icons.heart} />
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

const FacilitySpecs = ({
  item: { title, icon },
}: {
  item: {
    icon: ImageSourcePropType;
    title: string;
  };
}) => {
  return (
    <View className="flex flex-col gap-2 items-center justify-center mt-3">
      <View className="p-3 rounded-full bg-primary-100">
        <Image className="size-7" source={icon} />
      </View>
      <Text
        className="text-base w-[5.8rem] text-center font-rubik text-black-300 mt-0.5"
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
};

const LoadingComponent = () => {
  return (
    <View className="min-h-full w-full relative flex-1">
      <View className="h-[400px] w-full bg-primary-100">
        <View className="absolute top-5 left-0 w-full flex flex-row justify-between px-5">
          <View className="size-7 rounded-full bg-primary-200" />
          <View className="flex flex-row gap-5 items-center">
            <View className="size-7 rounded-full bg-primary-200" />
            <View className="size-7 rounded-full bg-primary-200" />
          </View>
        </View>
        <View className="h-4 w-16 rounded-full bg-primary-200 absolute bottom-8 left-1/2 -translate-x-1/2" />
      </View>
      <View className="my-7 px-5">
        <View className="h-10 w-[13rem] rounded-full bg-primary-200" />
        <View className="flex flex-row gap-4 mt-7">
          <View className="h-7 w-[6rem] rounded-full bg-primary-200" />
          <View className="flex flex-row gap-1 items-center">
            <View className="size-7 rounded-full bg-primary-200" />
            <View className="h-5 w-[7rem] rounded-full bg-primary-200" />
          </View>
        </View>
        <View className="flex flex-row gap-5 mt-7">
          <View className="flex flex-row gap-2 items-center">
            <View className="size-7 rounded-full bg-primary-200" />
            <View className="h-5 w-[4rem] rounded-full bg-primary-200" />
          </View>
          <View className="flex flex-row gap-2 items-center">
            <View className="size-7 rounded-full bg-primary-200" />
            <View className="h-5 w-[4rem] rounded-full bg-primary-200" />
          </View>
          <View className="flex flex-row gap-2 items-center">
            <View className="size-7 rounded-full bg-primary-200" />
            <View className="h-5 w-[4rem] rounded-full bg-primary-200" />
          </View>
        </View>
      </View>
      <View className="absolute bottom-0 left-0 bg-accent-100 w-full rounded-t-[3rem] border border-primary-200 border-b-0 p-6 flex flex-row justify-between items-center gap-7">
        <View className="flex flex-col gap-2">
          <View className="h-7 w-[7rem] rounded-full bg-primary-200" />
          <View className="h-9 w-[6rem] rounded-full bg-primary-200" />
        </View>
        <View className="h-14 flex-1 rounded-full bg-primary-200" />
      </View>
    </View>
  );
};

const Property = () => {
  const params = useLocalSearchParams<{ id: string }>();
  const [gallaryImages, setgallaryImages] = useState<Array<string>>([]);
  const { bottomSheetModalRef, setWishlistManager, wishlistManager } =
    useGlobalContext();
  const conversationIdRef = useRef<string | null>(null);

  const handleWishlist = (operation: "insert" | "delete") => {
    if (operation === "insert") {
      setWishlistManager((prev) => ({
        propertyIds: [...(prev.propertyIds ?? []), params.id],
        operation: "insert",
        changeId: params.id,
      }));
    } else {
      setWishlistManager((prev) => ({
        propertyIds:
          prev.propertyIds?.filter((property) => property !== params.id) ??
          prev.propertyIds,
        operation: "delete",
        changeId: params.id,
      }));
    }
  };

  const { data: propertyDetail, loading } = useSupabase({
    fn: getPropertyDetail,
    params: {
      property_id: params.id,
    },
  });

  const checkIfNewConversation = async () => {
    if (propertyDetail) {
      const conversation = await getConversationByAgent(propertyDetail.agent);
      if (conversation.length !== 0) {
        conversationIdRef.current = conversation[0].conversation_id;
      }
    }
  };

  const handleOpenChat = useCallback(() => {
    let chatMetadata;
    if (propertyDetail) {
      if (conversationIdRef.current) {
        chatMetadata = {
          conversation_id: conversationIdRef.current,
          avatar_url: propertyDetail?.agent_avatar.url,
          agent_name: propertyDetail?.agent_name,
          agent_id: propertyDetail?.agent,
          isFirstMessage: false,
        };
      } else {
        chatMetadata = {
          conversation_id: "",
          avatar_url: propertyDetail?.agent_avatar.url,
          agent_name: propertyDetail?.agent_name,
          agent_id: propertyDetail?.agent,
          isFirstMessage: true,
        };
      }
    }
    const json = encodeURIComponent(JSON.stringify(chatMetadata)); // escape for URL
    router.push(`/chat/${json}`);
  }, [propertyDetail]);

  useEffect(() => {
    if (propertyDetail) {
      setgallaryImages([
        propertyDetail?.image,
        ...propertyDetail?.gallery_images,
      ]);
    }
    checkIfNewConversation();
  }, [loading]);

  const handelPress = (id: string | undefined) => {
    bottomSheetModalRef.current[2]?.present();
    router.setParams({ propertyId: id });
  };

  return (
    <SafeAreaView className="bg-accent-100 relative flex-1">
      <GestureHandlerRootView>
        <BottomSheetModalProvider>
          {loading ? (
            <LoadingComponent />
          ) : (
            <View className="relative flex-1">
              <ScrollView
                showsVerticalScrollIndicator={false}
                className="flex-1"
              >
                <View className="relative">
                  <Carousel
                    width={width}
                    height={400}
                    data={["1", "2", "3", "5"]}
                    scrollAnimationDuration={500}
                    renderItem={({ index }) =>
                      propertyDetail ? (
                        <View className="h-full w-full" key={index}>
                          <Image
                            source={{
                              uri: gallaryImages[index],
                            }}
                            className="h-full w-full"
                            resizeMode="cover"
                          />
                        </View>
                      ) : (
                        <View
                          className="size-full border border-primary-100"
                          key={index}
                        />
                      )
                    }
                  />
                  <View className="absolute top-5 left-0 w-full flex flex-row justify-between px-5">
                    <TouchableOpacity onPress={() => router.back()}>
                      <Image
                        source={icons.back_arrow}
                        className="size-7"
                        tintColor="white"
                      />
                    </TouchableOpacity>
                    <View className="flex flex-row gap-5 items-center">
                      <LikeButton
                        isWishlisted={
                          !!wishlistManager.propertyIds?.find(
                            (propertyId) => propertyId === params.id
                          )?.length
                        }
                        handleWishlist={handleWishlist}
                      />
                      <TouchableOpacity>
                        <Image
                          source={icons.send}
                          className="size-7"
                          tintColor="white"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View className="px-5 my-7">
                  <Text className="text-2xl font-rubik-bold text-black-300">
                    {propertyDetail?.name}
                  </Text>
                  <View className="flex flex-row mt-5 gap-4">
                    <View className="bg-primary-100 py-1 px-3 rounded-full">
                      <Text className="capitalize mt-0.5 text-primary-300 font-rubik-medium text-sm">
                        {propertyDetail?.type}
                      </Text>
                    </View>
                    <View className="flex flex-row gap-2 items-center">
                      <Image
                        source={icons.star}
                        className="size-7"
                        resizeMode="contain"
                      />
                      <Text className="text-base font-rubik-medium text-black-200 mt-1">
                        {propertyDetail?.rating}({propertyDetail?.review_count}{" "}
                        reviews)
                      </Text>
                    </View>
                  </View>
                  <View className="flex flex-row gap-4 mt-6">
                    <PropertySpec
                      icon={icons.bed}
                      title="Beds"
                      units={propertyDetail?.bedrooms}
                    />
                    <PropertySpec
                      icon={icons.bath}
                      title="bath"
                      units={propertyDetail?.bathrooms}
                    />
                    <PropertySpec
                      icon={icons.area}
                      title="sqft"
                      units={propertyDetail?.area}
                    />
                  </View>
                  <View className="mt-7 mb-28 pt-7 border-t border-t-primary-200">
                    <Text className="text-xl font-rubik-semibold text-black-300">
                      Agent
                    </Text>
                    <View className="mt-4 flex flex-row gap-4">
                      <Image
                        className="rounded-full size-20"
                        source={{ uri: propertyDetail?.agent_avatar.url }}
                        resizeMode="cover"
                      />
                      <View className="flex flex-row justify-between flex-1">
                        <View className="flex flex-col justify-between py-4 w-2/3">
                          <Text
                            className="text-black-300 font-rubik-semibold text-lg"
                            numberOfLines={1}
                          >
                            {propertyDetail?.agent_name}
                          </Text>
                          <Text className="text-black-200 font-rubik-medium text-sm">
                            Owner
                          </Text>
                        </View>
                        <View className="flex flex-row gap-5 items-center justify-end flex-1">
                          <TouchableOpacity onPress={handleOpenChat}>
                            <Image source={icons.chat} className="size-8" />
                          </TouchableOpacity>
                          <TouchableOpacity>
                            <Image source={icons.phone} className="size-8" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                    <Text className="text-xl font-rubik-semibold text-black-300 mt-7">
                      Overview
                    </Text>
                    <Text className="break-words text-base text-black-200 font-rubik leading-7 mt-4">
                      {propertyDetail?.description}
                    </Text>
                    <Text className="text-xl font-rubik-semibold text-black-300 mt-7">
                      Facilities
                    </Text>
                    <View className="flex flex-row flex-wrap gap-3 mt-2">
                      {propertyDetail?.facilities.map((item, i) => (
                        <FacilitySpecs
                          item={facilities.find(
                            (facility) => facility.title === item
                          )}
                          key={i}
                        />
                      ))}
                    </View>
                    <Text className="text-xl font-rubik-semibold text-black-300 mt-7">
                      Gallary
                    </Text>
                    <View className="flex flex-row gap-6 mt-5">
                      {propertyDetail
                        ? gallaryImages
                            .slice(0, 2)
                            .map((item, index) => (
                              <Image
                                className="size-28 rounded-2xl"
                                source={{ uri: item }}
                                key={index}
                              />
                            ))
                        : [...Array(2)].map((_, i) => (
                            <View
                              className="size-28 bg-primary-100 rounded-2xl"
                              key={i}
                            />
                          ))}
                      {propertyDetail ? (
                        gallaryImages.length > 3 ? (
                          <TouchableOpacity
                            activeOpacity={0.7}
                            className="size-28 relative rounded-2xl overflow-hidden"
                          >
                            <Image
                              source={{ uri: gallaryImages[2] }}
                              className="size-full"
                            />
                            <View className="bg-black-300 absolute top-0 left-0 size-full opacity-45" />
                            <Text className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl font-rubik-bold text-white">
                              {gallaryImages.length - 2}+
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <Image
                            className="size-28 rounded-2xl"
                            source={{ uri: gallaryImages[2] }}
                          />
                        )
                      ) : (
                        <View className="size-28 bg-primary-100 rounded-2xl" />
                      )}
                    </View>
                    <Text className="text-xl font-rubik-semibold text-black-300 mt-7">
                      Location
                    </Text>
                    <View className="flex flex-row items-center gap-2 mt-4">
                      <Image source={icons.location} className="size-6" />
                      <Text className="break-words text-sm text-black-200 font-rubik-medium mt-1 w-full">
                        {propertyDetail?.address}
                      </Text>
                    </View>
                    <View className="h-56 w-full mt-5">
                      <Image
                        source={images.map}
                        className="size-full rounded-3xl"
                        resizeMode="cover"
                      />
                    </View>
                    <View className="flex flex-row justify-between mt-7 items-center">
                      <View className="flex flex-row gap-3">
                        <Image
                          source={icons.star}
                          className="size-7"
                          resizeMode="contain"
                        />
                        <Text className="font-rubik-semibold text-xl text-black-300">
                          {propertyDetail?.rating} (
                          {propertyDetail?.review_count} reviews)
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handelPress(propertyDetail?.id)}
                      >
                        <Text className="font-rubik-medium text-sm text-primary-300 mt-1">
                          See All
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View className="w-full mt-5">
                      {propertyDetail ? (
                        <ReviewCard data={propertyDetail?.top_reviews[0]} />
                      ) : (
                        <ActivityIndicator
                          size={25}
                          className="text-xl text-primary-300"
                        />
                      )}
                    </View>
                  </View>
                </View>
              </ScrollView>
              <View className="absolute bottom-0 left-0 bg-accent-100 w-full rounded-t-[3rem] border border-primary-200 border-b-0 p-6 flex flex-row justify-between items-center gap-7">
                <View className="flex flex-col">
                  <Text className="tracking-[0.2rem] break-words w-full text-sm text-black-200 font-rubik-medium uppercase leading-7">
                    Price
                  </Text>
                  <Text className="text-primary-300 font-rubik-bold text-2xl">
                    ${propertyDetail?.price}
                  </Text>
                </View>
                <Button text="Booking Now" buttonStyle="z-10" />
              </View>
            </View>
          )}
          <ReviewModal />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default Property;
