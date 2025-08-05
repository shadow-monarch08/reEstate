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
import NoResult from "@/components/NoResult";
import { useSupabase } from "@/lib/useSupabase";
import { getSearchedProperties, PropertyReturnType } from "@/lib/supabase";
import { useGlobalContext } from "@/lib/global-provider";

const Explore = () => {
  const [range, setRange] = useState<[number, number]>([0, 5]);
  const [isFirstInstance, setIsFirstInstance] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [properties, setProperties] = useState<
    Array<PropertyReturnType> | [] | null
  >([]);
  const [cardType, setCardType] = useState<"grid" | "list">("grid");

  const { setWishlistManager, wishlistManager } = useGlobalContext();

  const handleWishlist = (
    propertyId: string,
    operation: "insert" | "delete"
  ) => {
    if (operation === "insert") {
      setWishlistManager((prev) => {
        const newPropertyIds = new Set(prev.propertyIds);
        newPropertyIds.add(propertyId);
        return {
          propertyIds: newPropertyIds,
          operation: "insert",
          changeId: propertyId,
        };
      });
    } else {
      setWishlistManager((prev) => {
        const newPropertyIds = new Set(prev.propertyIds);
        newPropertyIds.delete(propertyId);
        return {
          propertyIds: newPropertyIds,
          operation: "delete",
          changeId: propertyId,
        };
      });
    }
  };

  const params = useLocalSearchParams<{
    query: string;
    propFilter: string;
    filter: string;
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
  }, [params.query, params.propFilter]);

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
    ({ item }: { item: PropertyReturnType }) =>
      cardType === "grid" ? (
        <ColumnCard
          item={item}
          onPress={() => handelCardPress(item.id)}
          isWishlisted={!!wishlistManager.propertyIds?.has(item.id)}
          handleWishlist={handleWishlist}
        />
      ) : (
        <RowCard
          item={item}
          onPress={() => handelCardPress(item.id)}
          isWishlisted={!!wishlistManager.propertyIds?.has(item.id)}
          handleWishlist={handleWishlist}
        />
      ),
    [cardType]
  );

  return (
    <SafeAreaView className="bg-accent-100 min-h-full">
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
                  <LoadingColumnCard key={i} />
                ) : (
                  <LoadingRowCard key={i} />
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
                  <LoadingColumnCard key={i} />
                ) : (
                  <LoadingRowCard key={i} />
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
                Found {properties?.length} Results
              </Text>
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
    </SafeAreaView>
  );
};

export default Explore;
