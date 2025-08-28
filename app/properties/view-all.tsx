import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabase } from "@/lib/useSupabase";
import { getLatestProperties, PropertyReturnType } from "@/lib/supabase";
import icons from "@/constants/icons";
import { Filters_small } from "@/components/Filters";
import {
  ColumnCard,
  LoadingColumnCard,
  LoadingRowCard,
  RowCard,
} from "@/components/Card";
import { NoResult } from "@/components/NoResult";

const ViewAll = () => {
  const params = useLocalSearchParams<{
    type: string;
    filter: string;
  }>();
  const [range, setRange] = useState<[number, number]>([0, 20]);
  const [cardType, setCardType] = useState<"grid" | "list">("grid");

  const {
    data: properties,
    loading,
    refetch,
    fetchMore,
    hasMore,
    loadingMore,
  } = useSupabase({
    fn: getLatestProperties,
    params: {
      filter: params.filter,
      range: [0, 20],
    },
    pagination: true,
    skip: true,
  });

  useEffect(() => {
    refetch({
      filter: params.filter,
      range: [0, 20],
    });

    return () => {
      setRange([0, 20]);
    };
  }, [params.filter]);

  const fetchMoreData = useCallback(() => {
    if (loading || loadingMore) return;
    fetchMore({
      filter: params.filter,
      range: [range[1] + 1, range[1] + 20],
    });
    setRange((prev) => [prev[1] + 1, prev[1] + 20]);
  }, [range, loading, loadingMore]);

  const handelCardPress = (id: string) => router.push(`/properties/${id}`);
  const handelSearchPress = () => router.push("/search/recommendation");

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
            {properties?.data?.length ?? 0 ? "No more property! 🥹" : ""}
          </Text>
        ) : null}
      </>
    ),
    [hasMore, loadingMore, cardType, properties]
  );

  const renderLoadingItem = useCallback(
    () =>
      loading ? (
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
        <View className="pt-10">
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
    [cardType]
  );

  return (
    <SafeAreaView className="min-h-full bg-accent-100 flex-1">
      <FlatList
        data={loading ? [] : properties?.data}
        onEndReached={() => hasMore && fetchMoreData()}
        keyExtractor={(item) => item.id}
        numColumns={cardType === "grid" ? 2 : 1}
        key={cardType}
        renderItem={renderItem}
        onEndReachedThreshold={0.5}
        contentContainerClassName="pb-6 min-h-full"
        ListEmptyComponent={renderLoadingItem}
        ListFooterComponent={renderFooter}
        extraData={cardType}
        columnWrapperClassName={
          cardType === "grid" ? "flex flex-row gap-5 px-5 mt-5" : ""
        }
        ListHeaderComponent={
          <View className="mt-5">
            <View className="flex-row justify-between px-5 py-1 items-center">
              <View className="flex flex-row items-center gap-1">
                <TouchableOpacity
                  className="p-2 rounded-full"
                  onPress={() => router.back()}
                >
                  <Image className="size-7" source={icons.back_arrow} />
                </TouchableOpacity>
                <Text className="font-rubik-medium text-black-300 text-xl mt-1">
                  Our Recommendations
                </Text>
              </View>
              <TouchableOpacity
                onPress={handelSearchPress}
                className="p-2 rounded-full"
              >
                <Image
                  className="size-7"
                  source={icons.search_outline}
                  tintColor="#191D31"
                />
              </TouchableOpacity>
            </View>
            <View>
              <Filters_small />
            </View>
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
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

export default ViewAll;
