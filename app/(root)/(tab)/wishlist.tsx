import { View, Text, TouchableOpacity, FlatList, Image } from "react-native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Filters_small } from "@/components/Filters";
import { SafeAreaView } from "react-native-safe-area-context";
import { NoResult } from "@/components/NoResult";
import {
  ColumnCard,
  LoadingColumnCard,
  LoadingRowCard,
  RowCard,
} from "@/components/Card";
import { useGlobalContext } from "@/lib/global-provider";
import { router, useLocalSearchParams } from "expo-router";
import { useSupabase } from "@/lib/useSupabase";
import { getWishlistProperty, PropertyReturnType } from "@/lib/supabase";
import icons from "@/constants/icons";
import Search from "@/components/Search";
import { useUserStore } from "@/lib/zustand/store/useUserStore";
import { useWishlistStore } from "@/lib/zustand/store/useWishlistStore";

const ListHeaderComponent = React.memo(
  ({
    handlePress,
    cardType,
  }: {
    handlePress: (type: string) => void;
    cardType: "grid" | "list";
  }) => {
    return (
      <View className="mb-1">
        <View className="px-5">
          <View className="w-full mt-7 mb-7 flex flex-row justify-between items-center">
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
            <TouchableOpacity onPress={() => handlePress("grid")}>
              <Image
                source={icons.all}
                className="size-6"
                tintColor={cardType === "grid" ? "#0061FF" : "#8C8E98"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handlePress("list")}>
              <Image
                source={icons.list}
                className="size-6"
                tintColor={cardType === "list" ? "#0061FF" : "#8C8E98"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
);

const Wishlist = () => {
  const [range, setRange] = useState<[number, number]>([0, 20]);
  const { bottomSheetModalRef } = useGlobalContext();
  const { user } = useUserStore();
  const { wishlistIds, operation, updatedPropertyId } = useWishlistStore();

  const [cardType, setCardType] = useState<"grid" | "list">("grid");
  const params = useLocalSearchParams<{
    filter: string;
    query: string;
    propFilter: string;
  }>();

  const {
    data: wishlistProperty,
    fetchMore,
    refetch,
    loading,
    loadingMore,
    setData,
    hasMore,
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
    pagination: true,
  });

  useEffect(() => {
    refetch({
      filter: params.filter,
      query: params.query,
      range: [0, 20],
      propFilter: params.propFilter,
      userId: user?.id,
    });

    return () => {
      setRange([0, 20]);
    };
  }, [params.filter, user, params.query, params.propFilter]);

  useEffect(() => {
    if (operation) {
      if (operation === "delete") {
        setData((prev) => ({
          error: null,
          data:
            prev?.data?.filter(
              (item: PropertyReturnType) => item.id !== updatedPropertyId
            ) ?? [],
        }));
      } else {
        refetch({
          filter: params.filter,
          query: params.query,
          range: [0, 20],
          propFilter: params.propFilter,
          userId: user?.id,
        });
      }
    }
  }, [wishlistIds]);

  const fetchMoreData = useCallback(() => {
    if (loading || loadingMore) return;
    fetchMore({
      filter: params.filter,
      query: params.query,
      range: [range[1] + 1, range[1] + 20],
      propFilter: params.propFilter,
      userId: user?.id,
    });
    setRange((prev) => [prev[1] + 1, prev[1] + 20]);
  }, [range, loadingMore]);

  useEffect(() => {
    return () => {
      if (bottomSheetModalRef.current) {
        bottomSheetModalRef.current[0]?.dismiss();
      }
    };
  }, []);

  const handelCardPress = useCallback(
    (id: string) => router.push(`/properties/${id}`),
    []
  );

  const renderFooter = useCallback(
    () => (
      <>
        {loadingMore ? (
          <View className="px-5 mt-5 flex flex-row gap-5 flex-wrap">
            {[...Array(4)].map((_, i) =>
              cardType === "grid" ? (
                <LoadingColumnCard key={i} />
              ) : (
                <LoadingRowCard key={i} />
              )
            )}
          </View>
        ) : !hasMore ? (
          <Text className="text-black-200 font-rubik-medium text-center mt-7">
            {wishlistProperty?.data?.length ?? 0 ? "No more property! 🥹" : ""}
          </Text>
        ) : null}
      </>
    ),
    [hasMore, loadingMore, cardType, wishlistProperty]
  );

  const renderLoadingItem = useCallback(
    () =>
      loading || loadingMore ? (
        <View className="px-5 mt-5 flex flex-row gap-5 flex-wrap">
          {[...Array(4)].map((_, i) =>
            cardType === "grid" ? (
              <LoadingColumnCard key={i} />
            ) : (
              <LoadingRowCard key={i} />
            )
          )}
        </View>
      ) : (
        <View className="flex justify-center items-center flex-1">
          <NoResult imageClassName="h-56" />
        </View>
      ),
    [loading, cardType]
  );

  const renderItem = useCallback(
    ({ item }: { item: PropertyReturnType }) =>
      cardType === "grid" ? (
        <ColumnCard item={item} onPress={() => handelCardPress(item.id)} />
      ) : (
        <RowCard item={item} onPress={() => handelCardPress(item.id)} />
      ),
    [cardType, wishlistIds]
  );

  return (
    <SafeAreaView className="bg-accent-100 min-h-full">
      <FlatList
        data={loading ? [] : wishlistProperty?.data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={cardType === "grid" ? 2 : 1}
        key={cardType}
        onEndReachedThreshold={0.5}
        onEndReached={() => hasMore && fetchMoreData()}
        contentContainerClassName="pb-24 min-h-full"
        columnWrapperClassName={
          cardType === "grid" ? "flex flex-row gap-5 px-5 mt-5" : ""
        }
        ListEmptyComponent={renderLoadingItem}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <ListHeaderComponent
            cardType={cardType}
            handlePress={(type) => setCardType(type as "grid" | "list")}
          />
        }
      />
    </SafeAreaView>
  );
};

export default Wishlist;
