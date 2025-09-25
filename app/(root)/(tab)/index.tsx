import icons from "@/constants/icons";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ColumnCard,
  FeaturedCard,
  LoadingColumnCard,
  LoadingFeaturedCard,
} from "../../../components/Card";
import { Filters } from "@/components/Filters";
import { useEffect, useState } from "react";
import { getFeaturedProperties, getLatestProperties } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useSupabase } from "@/lib/useSupabase";
import { NoResult } from "@/components/NoResult";
import SearchButton from "@/components/atoms/SearchButton";
import { useUserStore } from "@/lib/zustand/store/useUserStore";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

// Function to determine greeting based on time
function getGreeting() {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) {
    return "Good Morning 🌅";
  } else if (hour >= 12 && hour < 17) {
    return "Good Afternoon ☀️";
  } else if (hour >= 17 && hour < 21) {
    return "Good Evening 🌇";
  } else {
    return "Good Night 🌙";
  }
}

function Greeter() {
  const [greeting, setGreeting] = useState(getGreeting());

  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  // ✅ JS function we’ll safely call via runOnJS
  const updateGreeting = () => {
    const newGreeting = getGreeting();
    setGreeting(newGreeting);
  };

  useEffect(() => {
    function scheduleNextUpdate() {
      const now = new Date();
      const msUntilNextHour =
        (60 - now.getMinutes()) * 60 * 1000 -
        now.getSeconds() * 1000 -
        now.getMilliseconds();
      return setTimeout(() => {
        triggerGreetingChange();
        scheduleNextUpdate();
      }, msUntilNextHour);
    }
    const timer = scheduleNextUpdate();
    return () => clearTimeout(timer);
  }, []);

  const triggerGreetingChange = () => {
    opacity.value = withTiming(0, { duration: 400 });
    translateY.value = withTiming(-20, { duration: 400 }, (finished) => {
      if (finished) {
        // ✅ correctly call JS update
        runOnJS(updateGreeting)();

        translateY.value = 20;
        opacity.value = 0;

        translateY.value = withTiming(0, { duration: 400 });
        opacity.value = withTiming(1, { duration: 400 });
      }
    });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View className="flex-1 flex flex-row items-center">
      <Animated.Text
        className="text-xs text-black-100 font-rubik"
        style={[animatedStyle]}
      >
        {greeting}
      </Animated.Text>
    </View>
  );
}

export default function Index() {
  const { user } = useUserStore();
  const params = useLocalSearchParams<{
    query: string;
    filter: string;
  }>();
  const [refetchLoading, setRefetchLoading] = useState(false);

  const {
    data: featuredProperties,
    loading: featuredPropertiesLoading,
    refetch: latestRefetch,
  } = useSupabase({
    fn: getFeaturedProperties,
    params: {
      filter: params.filter,
      range: [0, 5],
    },
    skip: true,
  });

  const {
    data: latestProperties,
    loading: latestPropertiesLoading,
    refetch,
  } = useSupabase({
    fn: getLatestProperties,
    params: {
      filter: params?.filter,
      range: [0, 5],
    },
    skip: true,
  });

  const handleRefresh = async (): Promise<void> => {
    setRefetchLoading(true);
    try {
      latestRefetch;
      refetch({
        filter: params.filter,
        range: [0, 5],
      });
    } catch (error) {
      console.error(error);
    } finally {
      setRefetchLoading(false);
    }
  };

  const handelCardPress = (id: string) => router.push(`/properties/${id}`);

  const handlePress = (type: string) => {
    router.push(`/properties/view-all`);
    router.setParams({ type: type });
  };

  useEffect(() => {
    refetch({
      filter: params.filter,
      range: [0, 5],
    });
    latestRefetch({
      filter: params.filter,
      range: [0, 5],
    });
  }, [params.filter]);

  return (
    <SafeAreaView className="bg-accent-100 min-h-full">
      <FlatList
        data={latestPropertiesLoading ? [] : latestProperties?.data}
        renderItem={({ item }) => (
          <ColumnCard item={item} onPress={() => handelCardPress(item.id)} />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerClassName="pb-24 min-h-full"
        columnWrapperClassName="flex flex-row gap-5 px-5 mt-5"
        ListEmptyComponent={
          latestPropertiesLoading ? (
            <View className="px-5 mt-5 flex flex-row gap-5">
              {[...Array(4)].map((_, i) => (
                <LoadingColumnCard key={i} />
              ))}
            </View>
          ) : (
            <NoResult />
          )
        }
        refreshing={refetchLoading}
        showsVerticalScrollIndicator={false}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          <View className="mb-1">
            <View className="px-5">
              <View className="w-full mt-7 flex flex-row justify-between items-center">
                <View className="flex flex-row gap-3 items-center">
                  <Image
                    source={{ uri: user?.avatar_url }}
                    className="size-14 rounded-full"
                  />
                  <View>
                    <Greeter />
                    <Text className="font-rubik-medium text-black-300 mt-1 text-base">
                      {user?.full_name}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Image
                    source={icons.bell}
                    resizeMode="contain"
                    className="size-7"
                  />
                </TouchableOpacity>
              </View>
            </View>
            <View className="px-5 mt-6">
              <SearchButton query="home" />
              <Text className="font-rubik-semibold text-lg text-black-300 mt-6">
                Categories
              </Text>
            </View>
            <Filters />
            <View className="px-5 mt-6">
              <View className="flex flex-row justify-between items-center">
                <Text className="font-rubik-semibold text-lg text-black-300">
                  Featured
                </Text>
                <TouchableOpacity onPress={() => handlePress("featured")}>
                  <Text className="font-rubik-medium text-sm text-primary-300">
                    See All
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            {featuredPropertiesLoading ? (
              <View className="px-5 mt-6 flex flex-row gap-5">
                {[...Array(4)].map((_, i) => (
                  <LoadingFeaturedCard key={i} />
                ))}
              </View>
            ) : !featuredProperties ||
              featuredProperties.data?.length === 0 ? null : (
              <FlatList
                data={featuredProperties.data}
                renderItem={({ item }) => (
                  <FeaturedCard
                    item={item}
                    onPress={() => handelCardPress(item.id)}
                  />
                )}
                bounces={false}
                keyExtractor={(item) => item.id}
                horizontal
                contentContainerClassName="flex mt-6 gap-5 px-5"
                showsHorizontalScrollIndicator={false}
              />
            )}
            <View className="flex flex-row justify-between mt-7 items-center px-5">
              <Text className="font-rubik-semibold text-lg text-black-300">
                Our Recommenndation
              </Text>
              <TouchableOpacity onPress={() => handlePress("regular")}>
                <Text className="font-rubik-medium text-sm text-primary-300">
                  See All
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </SafeAreaView>
  );
}
