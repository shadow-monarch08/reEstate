import { View, Text, TouchableOpacity, FlatList, Image } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Filters_small } from "@/components/Filters";
import { SafeAreaView } from "react-native-safe-area-context";
import NoResult from "@/components/NoResult";
import {
  Card,
  LoadingCard,
  LoadingSearchCard,
  SearchCard,
} from "@/components/Card";
import { useGlobalContext } from "@/lib/global-provider";
import { router, useLocalSearchParams } from "expo-router";
import { useSupabase } from "@/lib/useSupabase";
import { getWishlistProperty, propertyReturnType } from "@/lib/supabase";
import icons from "@/constants/icons";
import Search from "@/components/Search";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { FilterModal } from "@/components/FilterModal";

const Wishlist = () => {
  const [range, setRange] = useState<[number, number]>([0, 5]);
  const [data, setData] = useState<Array<propertyReturnType> | null>([]);
  const [isFirstInstance, setIsFirstInstance] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const { user, setWishlistManager, wishlistManager } = useGlobalContext();
  const [cardType, setCardType] = useState<"grid" | "list">("grid");
  const params = useLocalSearchParams<{
    filter: string;
    query: string;
    propFilter: string;
  }>();

  const {
    data: wishlistProperty,
    refetch,
    loading,
  } = useSupabase({
    fn: getWishlistProperty,
    params: {
      filter: params.filter,
      query: params.query,
      range: range,
      propFilter: params.propFilter,
      userId: user?.id,
    },
    skip: true,
  });

  useEffect(() => {
    refetch({
      filter: params.filter,
      query: params.query,
      range: [0, 5],
      propFilter: params.propFilter,
      userId: user?.id,
    });

    return () => {
      setIsFirstInstance(true);
      setRange([0, 5]);
      setData([]);
      setIsEnd(false);
    };
  }, [params.filter, user, params.query, params.propFilter]);

  useEffect(() => {
    if (wishlistProperty && wishlistProperty?.length < 6) {
      setIsEnd(true);
    }
    if (wishlistProperty) {
      setData((prev) => [...(prev ?? []), ...(wishlistProperty ?? [])]);
    }
  }, [wishlistProperty]);

  useEffect(() => {
    if (wishlistManager.operation === "delete") {
      if (data?.find((obj) => obj.id === wishlistManager.changeId)) {
        setIsFirstInstance(false);
      }
      setData(
        (prev) =>
          prev?.filter(
            (property) => property.id !== wishlistManager.changeId
          ) ?? prev
      );
    } else if (wishlistManager.operation === "insert") {
      refetch({
        filter: params.filter,
        query: params.query,
        range: [0, 5],
        propFilter: params.propFilter,
        userId: user?.id,
      });
      setIsEnd(false);
      setIsFirstInstance(true);
    }
  }, [wishlistManager.propertyIds]);

  const fetchMoreData = useCallback(() => {
    if (isEnd) {
      return;
    }
    refetch({
      filter: params.filter,
      query: params.query,
      range: [range[1] + 1, range[1] + 6],
      propFilter: params.propFilter,
      userId: user?.id,
    });
    setRange((prev) => [prev[1] + 1, prev[1] + 6]);
    setIsFirstInstance(false);
  }, [range, isEnd, loading]);

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
  const handelCardPress = (id: string) => router.push(`/properties/${id}`);

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
    [cardType, wishlistManager.propertyIds]
  );

  return (
    <SafeAreaView className="bg-accent-100 min-h-full">
      <GestureHandlerRootView>
        <BottomSheetModalProvider>
          <FlatList
            data={
              loading && isFirstInstance
                ? []
                : isFirstInstance
                ? wishlistProperty
                : data
            }
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            numColumns={cardType === "grid" ? 2 : 1}
            key={cardType}
            onEndReached={() => fetchMoreData()}
            contentContainerClassName="pb-24 min-h-full"
            columnWrapperClassName={
              cardType === "grid" ? "flex flex-row gap-5 px-5 mt-5" : ""
            }
            ListEmptyComponent={
              loading ? (
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
                <View className="flex justify-center items-center flex-1">
                  <NoResult imageClassName="h-56" />
                </View>
              )
            }
            ListFooterComponent={
              isEnd ? (
                <Text className="text-black-200 font-rubik-medium text-center mt-7">
                  {data?.length ?? 0 ? "No more property! 🥹" : ""}
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
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View className="mb-1">
                <View className="px-5">
                  <View className="w-full mt-7 flex flex-row justify-between items-center">
                    <View className="flex flex-row gap-4 items-center">
                      <View className="p-2 bg-primary-300 rounded-2xl">
                        <Image
                          source={icons.home_filled}
                          tintColor="white"
                          className="size-5 rounded-full"
                        />
                      </View>
                      <Text className="text-2xl text-black-300 font-rubik-medium">
                        Favourites
                      </Text>
                    </View>
                    <TouchableOpacity>
                      <Image
                        source={icons.bell}
                        resizeMode="contain"
                        className="size-7"
                        tintColor="#191D31"
                      />
                    </TouchableOpacity>
                  </View>
                  <Search enableFocus={false} />
                </View>
                <Filters_small />
                <View className="flex flex-row-reverse px-5 mt-5">
                  <View className="flex flex-row gap-4">
                    <TouchableOpacity onPress={() => setCardType("grid")}>
                      <Image
                        source={icons.all}
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

export default Wishlist;
