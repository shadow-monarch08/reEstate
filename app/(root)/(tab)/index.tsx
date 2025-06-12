import icons from "@/constants/icons";
import { useGlobalContext } from "@/lib/global-provider";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  FeaturedCard,
  LoadingCard,
  LoadingFeaturedCard,
} from "../../../components/Card";
import { Filters } from "@/components/Filters";
import { useEffect, useState } from "react";
import { getFeaturedProperties, getLatestProperties } from "@/lib/supabase";
import { router, useLocalSearchParams } from "expo-router";
import { useSupabase } from "@/lib/useSupabase";
import NoResult from "@/components/NoResult";
import { SearchButton } from "@/components/Button";

export default function Index() {
  const { user, wishlistManager, setWishlistManager } = useGlobalContext();
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
  const handleWishlist = (
    propertyId: string,
    operation: "insert" | "delete"
  ) => {
    if (operation === "insert") {
      setWishlistManager((prev) => ({
        propertyIds: [...(prev.propertyIds ?? []), propertyId],
        operation: "insert",
        changeId: propertyId,
      }));
    } else {
      setWishlistManager((prev) => ({
        propertyIds:
          prev.propertyIds?.filter((property) => property !== propertyId) ??
          prev.propertyIds,
        operation: "delete",
        changeId: propertyId,
      }));
    }
  };
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
        data={latestPropertiesLoading ? [] : latestProperties}
        renderItem={({ item }) => (
          <Card
            item={item}
            onPress={() => handelCardPress(item.id)}
            isWishlisted={
              !!wishlistManager.propertyIds?.find(
                (propertyId) => propertyId === item.id
              )?.length
            }
            handleWishlist={handleWishlist}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerClassName="pb-24 min-h-full"
        columnWrapperClassName="flex flex-row gap-5 px-5 mt-5"
        ListEmptyComponent={
          latestPropertiesLoading ? (
            <View className="px-5 mt-5 flex flex-row gap-5">
              {[...Array(4)].map((_, i) => (
                <LoadingCard key={i} />
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
                    <Text className="text-xs text-black-100 font-rubik">
                      Good Morning
                    </Text>
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
              featuredProperties.length === 0 ? null : (
              <FlatList
                data={featuredProperties}
                renderItem={({ item }) => (
                  <FeaturedCard
                    item={item}
                    onPress={() => handelCardPress(item.id)}
                    isWishlisted={
                      !!wishlistManager.propertyIds?.find(
                        (propertyId) => propertyId === item.id
                      )?.length
                    }
                    handleWishlist={handleWishlist}
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
