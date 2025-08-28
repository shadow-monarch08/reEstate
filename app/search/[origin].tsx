import { View, Text, FlatList, TouchableOpacity, Image } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ColumnCard,
  LoadingColumnCard,
  LoadingRowCard,
  RowCard,
} from "@/components/Card";
import { Filters_small } from "@/components/Filters";
import Search from "@/components/Search";
import icons from "@/constants/icons";
import { router, useLocalSearchParams } from "expo-router";
import { NoResult } from "@/components/NoResult";
import { useSupabase } from "@/lib/useSupabase";
import { getSearchedProperties, PropertyReturnType } from "@/lib/supabase";
import { useGlobalContext } from "@/lib/global-provider";

const ListHeaderComponent = React.memo(
  ({
    handlePress,
    cardType,
    totalResults,
  }: {
    handlePress: (type: string) => void;
    cardType: "grid" | "list";
    totalResults: number;
  }) => {
    return (
      <View className="mb-5">
        <View className="w-full px-5 flex gap-2 flex-row items-center">
          <TouchableOpacity className="p-2" onPress={() => router.back()}>
            <Image
              source={icons.back_arrow}
              className="size-7"
              tintColor={"#191D31"}
            />
          </TouchableOpacity>
          <Search enableFocus={false} />
        </View>
        <Filters_small />
        <View className="px-5 mt-5 flex flex-row justify-between items-center">
          <Text className="font-rubik-medium text-xl text-black-300">
            Found {totalResults} Results
          </Text>
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

const Explore = () => {
  const [range, setRange] = useState<[number, number]>([0, 5]);
  const [cardType, setCardType] = useState<"grid" | "list">("grid");

  const params = useLocalSearchParams<{
    query: string;
    propFilter: string;
    filter: string;
  }>();

  const { data, refetch, loading, fetchMore, hasMore, loadingMore, count } =
    useSupabase({
      fn: getSearchedProperties,
      params: {
        query: params.query,
        propFilter: params.propFilter,
        filter: params.filter,
        range: range,
      },
      skip: true,
      pagination: true,
    });

  useEffect(() => {
    refetch({
      filter: params.filter,
      query: params.query,
      propFilter: params.propFilter,
      range: [0, 20],
    });
    return () => {
      setRange([0, 20]);
    };
  }, [params.query, params.propFilter, params.filter]);

  const fetchMoreData = useCallback(() => {
    if (loading || loadingMore) return;
    fetchMore({
      filter: params.filter,
      range: [range[1] + 1, range[1] + 20],
      query: params.query,
      propFilter: params.propFilter,
    });
    setRange((prev) => [prev[1] + 1, prev[1] + 20]);
  }, [range, loading, loadingMore]);

  const handelCardPress = (id: string) => {
    router.push(`/properties/${id}`);
  };

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
            {data?.data?.length ?? 0 ? "No more property! 🥹" : ""}
          </Text>
        ) : null}
      </>
    ),
    [hasMore, loadingMore, cardType, data]
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
        <NoResult imageClassName="h-56" />
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
    <SafeAreaView className="bg-accent-100 min-h-full">
      <FlatList
        data={loading ? [] : data?.data}
        onEndReached={() => hasMore && fetchMoreData()}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        numColumns={cardType === "grid" ? 2 : 1}
        contentContainerClassName="pb-12 min-h-full pt-7"
        ListEmptyComponent={renderLoadingItem}
        ListFooterComponent={renderFooter}
        onEndReachedThreshold={0.5}
        extraData={cardType}
        columnWrapperClassName={
          cardType === "grid" ? "flex flex-row gap-5 px-5 mt-5" : ""
        }
        key={cardType}
        ListHeaderComponent={
          <ListHeaderComponent
            handlePress={(type) => setCardType(type as "grid" | "list")}
            cardType={cardType}
            totalResults={count ?? 0}
          />
        }
      />
    </SafeAreaView>
  );
};

export default Explore;
