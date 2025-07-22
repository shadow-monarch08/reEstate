import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSupabase } from "@/lib/useSupabase";
import { getLatestProperties, PropertyReturnType } from "@/lib/supabase";
import icons from "@/constants/icons";
import { useGlobalContext } from "@/lib/global-provider";
import { SortModal } from "@/components/FilterModal";
import { Filters_small } from "@/components/Filters";
import {
  Card,
  LoadingCard,
  LoadingSearchCard,
  SearchCard,
} from "@/components/Card";
import NoResult from "@/components/NoResult";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

const ViewAll = () => {
  const params = useLocalSearchParams<{
    type: string;
    filter: string;
    sort: string;
  }>();
  const [range, setRange] = useState<[number, number]>([0, 5]);
  const [data, setData] = useState<Array<PropertyReturnType> | null>([]);
  const [isFirstInstance, setIsFirstInstance] = useState(true);
  const [isEnd, setIsEnd] = useState(false);
  const [cardType, setCardType] = useState<"grid" | "list">("grid");
  const { bottomSheetModalRef, setWishlistManager, wishlistManager } =
    useGlobalContext();

  const {
    data: properties,
    loading,
    refetch,
  } = useSupabase({
    fn: getLatestProperties,
    params: {
      filter: params.filter,
      range: [0, 5],
      sort: params.sort,
    },
    skip: true,
  });

  const {
    data: moreProperties,
    loading: propertyLoading,
    refetch: propertyRefetch,
  } = useSupabase({
    fn: getLatestProperties,
    params: {
      filter: params.filter,
      range: range,
      sort: params.sort,
    },
    skip: true,
  });

  useEffect(() => {
    refetch({
      filter: params.filter,
      range: [0, 5],
      sort: params.sort,
    });

    return () => {
      setIsFirstInstance(true);
      setRange([0, 5]);
      setData([]);
      setIsEnd(false);
    };
  }, [params.filter, params.sort]);

  useEffect(() => {
    if (properties && properties?.length < 6) {
      setIsEnd(true);
    }
    if (properties) {
      setData(properties);
    }
  }, [properties]);

  useEffect(() => {
    setData((prev) => [...(prev ?? []), ...(moreProperties ?? [])]);
    if (moreProperties && moreProperties.length < 6) {
      setIsEnd(true);
    }
  }, [moreProperties]);

  const fetchMoreData = useCallback(() => {
    if (isEnd) {
      return;
    }
    propertyRefetch({
      filter: params.filter,
      range: [range[1] + 1, range[1] + 6],
      sort: params.sort,
    });
    setRange((prev) => [prev[1] + 1, prev[1] + 6]);
    setIsFirstInstance(false);
  }, [range, isEnd, propertyLoading]);

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

  useEffect(() => {
    return () => {
      if (bottomSheetModalRef.current) {
        bottomSheetModalRef.current[1]?.dismiss();
      }
    };
  }, []);

  const handelCardPress = (id: string) => router.push(`/properties/${id}`);

  const handlePresentModalPress = useCallback(() => {
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef.current[1]?.present();
    }
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: PropertyReturnType }) =>
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
    <GestureHandlerRootView>
      <BottomSheetModalProvider>
        <SafeAreaView className="min-h-full bg-accent-100 flex-1">
          <FlatList
            data={loading ? [] : isFirstInstance ? properties : data}
            keyExtractor={(item) => item.id}
            numColumns={cardType === "grid" ? 2 : 1}
            key={cardType}
            onEndReached={() => fetchMoreData()}
            renderItem={renderItem}
            contentContainerClassName="pb-6 min-h-full"
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
                <NoResult />
              )
            }
            ListFooterComponent={
              isEnd ? (
                properties && (
                  <Text className="text-black-200 font-rubik-medium text-center mt-7">
                    No more property! 🥹
                  </Text>
                )
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
            ListHeaderComponent={
              <View className="mt-5">
                <View className="flex-row justify-between px-5 py-1 items-center">
                  <TouchableOpacity
                    className="bg-primary-200 p-3 rounded-full"
                    onPress={() => router.back()}
                  >
                    <Image className="size-7" source={icons.back_arrow} />
                  </TouchableOpacity>
                  <Text className="font-rubik-medium text-black-300 text-lg mt-1">
                    Properies
                  </Text>
                  <TouchableOpacity
                    className="bg-primary-200 p-3 rounded-full"
                    onPress={handlePresentModalPress}
                  >
                    <Image
                      className="size-7"
                      source={icons.filter}
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
          <SortModal />
        </SafeAreaView>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
};

export default ViewAll;
