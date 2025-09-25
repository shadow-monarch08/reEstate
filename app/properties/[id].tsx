import {
  View,
  Text,
  Dimensions,
  ScrollView,
  Image,
  TouchableOpacity,
  ImageSourcePropType,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Portal } from "react-native-paper";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { router, useLocalSearchParams } from "expo-router";
import { getPropertyDetail } from "@/lib/supabase";
import { SafeAreaView } from "react-native-safe-area-context";
import images from "@/constants/images";
import icons from "@/constants/icons";
import { facilities } from "@/constants/data";
import { LoadingReviewCard, ReviewCard } from "@/components/Card";
import { useSupabase } from "@/lib/useSupabase";
import { useGlobalContext } from "@/lib/global-provider";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import PagerView from "react-native-pager-view";
import { useWishlistStore } from "@/lib/zustand/store/useWishlistStore";
import { useChatStore } from "@/lib/zustand/store/useChatStore";
import Modal from "react-native-modal";
import { getConversation } from "@/lib/database/localStore";
import { MapDisplay, MapModal } from "@/components/MapDisplay";
import { NoResult } from "@/components/NoResult";
import LikeButton from "@/components/atoms/LikeButton";
import Button from "@/components/atoms/Button";

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

const IndicatorItem = ({
  index,
  currentPage,
  onPress,
}: {
  index: number;
  currentPage: SharedValue<number>;
  onPress: () => void;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const isActive = currentPage.value === index;
    return {
      width: withTiming(isActive ? 40 : 13, { duration: 300 }),
      backgroundColor: withTiming(isActive ? "#0061FF" : "#FBFBFD", {
        duration: 300,
      }),
    };
  });

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        style={[
          {
            height: 13,
            borderRadius: 20,
          },
          animatedStyle,
        ]}
      />
    </Pressable>
  );
};

// const PropertyShareModal = React.memo(() => {
//   return(

//   )
// })

const Property = () => {
  const pagerViewRef = useRef<PagerView>(null);
  const currentPage = useSharedValue(0);
  const params = useLocalSearchParams<{ id: string }>();
  const [gallaryImages, setgallaryImages] = useState<Array<string>>([]);
  const { bottomSheetModalRef } = useGlobalContext();
  const { setActiveConversationData } = useChatStore();
  const { wishlistIds } = useWishlistStore();
  const [isConversationLoading, setIsConversationLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { data: propertyDetail, loading } = useSupabase({
    fn: getPropertyDetail,
    params: {
      property_id: params.id,
    },
  });

  const handleOpenChat = useCallback(async () => {
    if (propertyDetail?.data) {
      setIsConversationLoading(true);
      // console.log(propertyDetail.data.agent_id);
      const conversationDetail = await getConversation<{
        conversation_id: string;
      }>(["conversation_id"], {
        agent_id: propertyDetail.data.agent_id,
      });
      if (conversationDetail.length > 0) {
        setActiveConversationData({
          conversation_id: conversationDetail[0].conversation_id,
          newConversation: false,
          agent_avatar: propertyDetail?.data?.agent_avatar.url,
          agent_name: propertyDetail?.data?.agent_name,
          agent_id: propertyDetail?.data?.agent_id,
          avatar_last_update: propertyDetail?.data?.agent_avatar.lastUpdate,
        });
      } else {
        setActiveConversationData({
          conversation_id: "",
          newConversation: true,
          agent_avatar: propertyDetail?.data?.agent_avatar.url,
          agent_name: propertyDetail?.data?.agent_name,
          agent_id: propertyDetail?.data?.agent_id,
          avatar_last_update: propertyDetail?.data?.agent_avatar.lastUpdate,
        });
      }
    }
    setIsConversationLoading(false);
    router.push(`/chat/conversation`);
  }, [propertyDetail]);

  useEffect(() => {
    if (propertyDetail?.data) {
      setgallaryImages([
        propertyDetail.data?.image,
        ...propertyDetail.data?.gallery_images,
      ]);
    }
    // checkIfNewConversation();
  }, [loading]);

  const handelPress = (id: string | undefined) => {
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef.current[2]?.present();
    }
    router.setParams({ propertyId: id });
  };

  const onPageSelected = (e: any) => {
    const index = e.nativeEvent.position;
    currentPage.value = index;
  };

  const handleIndicatorPress = (index: number) => {
    pagerViewRef.current?.setPage(index);
    currentPage.value = index;
  };

  return (
    <SafeAreaView className="bg-accent-100 min-h-full">
      {loading ? (
        <LoadingComponent />
      ) : propertyDetail?.data ? (
        <>
          <View className="relative">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="relative">
                <PagerView
                  ref={pagerViewRef}
                  onPageSelected={onPageSelected}
                  style={{ height: 400, width: "100%", flex: 1 }}
                  initialPage={0}
                  overdrag={true}
                  overScrollMode="always"
                >
                  {gallaryImages.slice(0, 5).map((image, index) => (
                    <View key={index} className="size-full flex-1">
                      <Image
                        source={{ uri: image }}
                        className="size-full"
                        resizeMode="cover"
                      />
                    </View>
                  ))}
                </PagerView>
                <View
                  style={{
                    position: "absolute",
                    bottom: 30,
                    width: "100%",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  {gallaryImages.slice(0, 5).map((_, index) => (
                    <IndicatorItem
                      key={index}
                      index={index}
                      currentPage={currentPage}
                      onPress={() => handleIndicatorPress(index)}
                    />
                  ))}
                </View>
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
                      isWishListed={wishlistIds.has(params.id)}
                      id={params.id}
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
                  {propertyDetail?.data?.name}
                </Text>
                <View className="flex flex-row mt-5 gap-4">
                  <View className="bg-primary-100 py-1 px-3 rounded-full">
                    <Text className="capitalize mt-0.5 text-primary-300 font-rubik-medium text-sm">
                      {propertyDetail?.data?.type}
                    </Text>
                  </View>
                  <View className="flex flex-row gap-2 items-center">
                    <Image
                      source={icons.star}
                      className="size-7"
                      resizeMode="contain"
                    />
                    <Text className="text-base font-rubik-medium text-black-200 mt-1">
                      {propertyDetail?.data?.rating}(
                      {propertyDetail?.data?.review_count} reviews)
                    </Text>
                  </View>
                </View>
                <View className="flex flex-row gap-4 mt-6">
                  <PropertySpec
                    icon={icons.bed}
                    title="Beds"
                    units={propertyDetail?.data?.bedrooms}
                  />
                  <PropertySpec
                    icon={icons.bath}
                    title="bath"
                    units={propertyDetail?.data?.bathrooms}
                  />
                  <PropertySpec
                    icon={icons.area}
                    title="sqft"
                    units={propertyDetail?.data?.area}
                  />
                </View>
                <View className="mt-7 mb-28 pt-7 border-t border-t-primary-200">
                  <Text className="text-xl font-rubik-semibold text-black-300">
                    Agent
                  </Text>
                  <View className="mt-4 flex flex-row gap-4">
                    <Image
                      className="rounded-full size-20"
                      source={{ uri: propertyDetail?.data?.agent_avatar.url }}
                      resizeMode="cover"
                    />
                    <View className="flex flex-row justify-between flex-1">
                      <View className="flex flex-col justify-between py-4 w-2/3">
                        <Text
                          className="text-black-300 font-rubik-semibold text-lg"
                          numberOfLines={1}
                        >
                          {propertyDetail?.data?.agent_name}
                        </Text>
                        <Text className="text-black-200 font-rubik-medium text-sm">
                          Owner
                        </Text>
                      </View>
                      <View className="flex flex-row gap-5 items-center justify-end flex-1">
                        {isConversationLoading ? (
                          <ActivityIndicator className="size-10 text-primary-300" />
                        ) : (
                          <TouchableOpacity onPress={handleOpenChat}>
                            <Image source={icons.chat} className="size-8" />
                          </TouchableOpacity>
                        )}
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
                    {propertyDetail?.data?.description}
                  </Text>
                  <Text className="text-xl font-rubik-semibold text-black-300 mt-7">
                    Facilities
                  </Text>
                  <View className="flex flex-row flex-wrap gap-3 mt-2">
                    {propertyDetail?.data?.facilities.map((item, i) => (
                      <FacilitySpecs
                        item={
                          facilities.find(
                            (facility) => facility.title === item
                          )!
                        }
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
                      {propertyDetail?.data?.address}
                    </Text>
                  </View>
                  <MapDisplay
                    onPress={() => setIsModalVisible(true)}
                    location={propertyDetail?.data?.geolocation}
                  />
                  <View className="flex flex-row justify-between mt-7 items-center">
                    <View className="flex flex-row gap-3">
                      <Image
                        source={icons.star}
                        className="size-7"
                        resizeMode="contain"
                      />
                      <Text className="font-rubik-semibold text-xl text-black-300">
                        {propertyDetail?.data?.rating} (
                        {propertyDetail?.data?.review_count} reviews)
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handelPress(propertyDetail?.data?.id)}
                    >
                      <Text className="font-rubik-medium text-sm text-primary-300 mt-1">
                        See All
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View className="w-full mt-5">
                    {propertyDetail ? (
                      <ReviewCard data={propertyDetail.data?.top_reviews[0]} />
                    ) : (
                      <LoadingReviewCard />
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
                  ${propertyDetail?.data?.price}
                </Text>
              </View>
              <Button text="Booking Now" buttonStyle="z-10" />
            </View>
          </View>
          <Portal>
            <MapModal
              location={propertyDetail?.data?.geolocation}
              isModalVisible={isModalVisible}
              onPress={() => setIsModalVisible(false)}
            />
          </Portal>
        </>
      ) : (
        <NoResult
          image={images.no_data_found}
          title="Can't find any result"
          subTitle="There seems to be some problem, try again!"
        />
      )}
    </SafeAreaView>
  );
};

export default Property;
