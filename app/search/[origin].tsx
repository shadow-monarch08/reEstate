import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Card,
  LoadingCard,
  LoadingSearchCard,
  SearchCard,
} from "@/components/Card";
import { Filters_small } from "@/components/Filters";
import Search from "@/components/Search";
import icons from "@/constants/icons";
import { router, useLocalSearchParams } from "expo-router";
import NoResult from "@/components/NoResult";
import { useSupabase } from "@/lib/useSupabase";
import { getSearchedProperties, propertyReturnType } from "@/lib/supabase";
import { useGlobalContext } from "@/lib/global-provider";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { FilterModal } from "@/components/FilterModal";

const Explore = () => {
  const [range, setRange] = useState<[number, number]>([0, 5]);
  const [isFirstInstance, setIsFirstInstance] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [properties, setProperties] = useState<
    Array<propertyReturnType> | [] | null
  >([]);
  const [cardType, setCardType] = useState<"grid" | "list">("grid");

  const { setWishlistManager, wishlistManager } = useGlobalContext();

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

  const params = useLocalSearchParams<{
    filter: string;
    query: string;
    propFilter: string;
  }>();

  const { data, loading, refetch } = useSupabase({
    fn: getSearchedProperties,
    params: {
      filter: params.filter,
      query: params.query,
      propFilter: params.propFilter,
      range: [0, 5],
    },
    skip: true,
  });

  const {
    data: moreProperties,
    loading: loadingMoreProperties,
    refetch: refetchMoreProperties,
  } = useSupabase({
    fn: getSearchedProperties,
    params: {
      filter: params.filter,
      query: params.query,
      propFilter: params.propFilter,
      range: range,
    },
    skip: true,
  });

  useEffect(() => {
    refetch({
      filter: params.filter,
      query: params.query,
      propFilter: params.propFilter,
      range: [0, 5],
    });
    return () => {
      setIsFirstInstance(true);
      setRange([0, 5]);
      setProperties([]);
      setIsEnd(false);
    };
  }, [params.filter, params.query, params.propFilter]);

  useEffect(() => {
    if (data && data?.length < 6) {
      setIsEnd(true);
    }
  }, [data]);

  useEffect(() => {
    setProperties((prev) => [...(prev ?? []), ...(moreProperties ?? [])]);
    if (moreProperties && moreProperties.length < 6) {
      setIsEnd(true);
    }
  }, [moreProperties]);

  const fetchMoreData = useCallback(() => {
    if (isEnd) {
      return;
    }
    refetchMoreProperties({
      filter: params.filter,
      range: [range[1] + 1, range[1] + 6],
      query: params.query,
      propFilter: params.propFilter,
    });
    setRange((prev) => [prev[1] + 1, prev[1] + 6]);
    setIsFirstInstance(false);
  }, [range, isEnd, loadingMoreProperties, params.propFilter]);

  const handelCardPress = (id: string) => {
    router.push(`/properties/${id}`);
  };

  const renderItem = useCallback(
    ({ item }: { item: propertyReturnType }) =>
      cardType === "grid" ? (
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
      ) : (
        <SearchCard
          item={item}
          onPress={() => handelCardPress(item.id)}
          isWishlisted={
            !!wishlistManager.propertyIds?.find(
              (propertyId) => propertyId === item.id
            )?.length
          }
          handleWishlist={handleWishlist}
        />
      ),
    [cardType]
  );

  return (
    <SafeAreaView className="bg-accent-100 min-h-full">
      <GestureHandlerRootView className="flex-1">
        <BottomSheetModalProvider>
          <FlatList
            data={
              loading
                ? []
                : isFirstInstance
                ? data
                : [...(data ?? []), ...(properties ?? [])]
            }
            onEndReached={() => fetchMoreData()}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={cardType === "grid" ? 2 : 1}
            contentContainerClassName="pb-12 min-h-full pt-7"
            ListEmptyComponent={
              loading || loadingMoreProperties ? (
                <View className="px-5 mt-5 flex flex-row gap-5 flex-wrap">
                  {[...Array(4)].map((_, i) =>
                    cardType === "grid" ? (
                      <LoadingCard key={i} />
                    ) : (
                      <LoadingSearchCard key={i} />
                    )
                  )}
                </View>
              ) : (
                <NoResult />
              )
            }
            ListFooterComponent={
              isEnd ? (
                <Text className="text-black-200 font-rubik-medium text-center mt-1">
                  {data?.length != 0 ? "No more property!🥹" : ""}
                </Text>
              ) : (
                <View className="px-5 mt-5 flex flex-row gap-5 flex-wrap">
                  {[...Array(4)].map((_, i) =>
                    cardType === "grid" ? (
                      <LoadingCard key={i} />
                    ) : (
                      <LoadingSearchCard key={i} />
                    )
                  )}
                </View>
              )
            }
            extraData={cardType}
            columnWrapperClassName={
              cardType === "grid" ? "flex flex-row gap-5 px-5 mt-5" : ""
            }
            key={cardType}
            ListHeaderComponent={
              <View className="mb-5">
                <View className="px-5">
                  <View className="w-full flex flex-row justify-between items-center">
                    <TouchableOpacity
                      className="p-3 rounded-full bg-primary-200"
                      onPress={() => router.back()}
                    >
                      <Image
                        source={icons.back_arrow}
                        className="size-7"
                        tintColor={"#191D31"}
                      />
                    </TouchableOpacity>
                    <Text className="text-base font-rubik-medium text-black-300 mt-0.5">
                      Search for Your Ideal Home
                    </Text>
                    <TouchableOpacity>
                      <Image
                        source={icons.bell}
                        resizeMode="contain"
                        className="size-7"
                      />
                    </TouchableOpacity>
                  </View>
                  <Search enableFocus={false} />
                </View>
                <Filters_small />
                <View className="px-5 mt-5 flex flex-row justify-between items-center">
                  <Text className="font-rubik-medium text-xl text-black-300">
                    Found {properties?.length}{" "}
                    {!params.filter || params.filter === "All"
                      ? "Results"
                      : params.filter + "s"}
                  </Text>
                  <View className="flex flex-row gap-4">
                    <TouchableOpacity onPress={() => setCardType("grid")}>
                      <Image
                        source={icons.all
                          
                        }
                        className="size-6"
                        tintColor={cardType === "grid" ? "#0061FF" : "#8C8E98"}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCardType("list")}>
                      <Image
                        source={icons.list}
                        className="size-6"
                        tintColor={cardType === "list" ? "#0061FF" : "#8C8E98"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            }
          />
          <FilterModal />
        </BottomSheetModalProvider>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
};

export default Explore;
