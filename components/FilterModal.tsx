import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  LayoutChangeEvent,
  ImageSourcePropType,
  ActivityIndicator,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  BottomSheetScrollView,
  BottomSheetFlatList,
} from "@gorhom/bottom-sheet";
import { useGlobalContext } from "@/lib/global-provider";
import icons from "@/constants/icons";
import MultiSlider, { LabelProps } from "@ptomasroos/react-native-multi-slider";
import { Button } from "./Button";
import { router, useLocalSearchParams } from "expo-router";
import CheckBox from "./CheckBox";
import { useSupabase } from "@/lib/useSupabase";
import { getReviews, ReviewReturn } from "@/lib/supabase";
import { LoadingReviewCard, ReviewCard } from "./Card";
import NoResult from "./NoResult";

interface GenericType {
  title: string;
  category: string | "ascending" | "descending";
  isSelected: boolean;
  icon: ImageSourcePropType;
}

interface PropertyTypeProps {
  propertyType: Array<GenericType>;
  handlePress: (pram: number) => void;
}

interface CounterButttonProps {
  value: number;
  handelValue: (param: number) => void;
}

interface SortType {
  name: Array<GenericType>;
  created_at: Array<GenericType>;
  rating: Array<GenericType>;
  price: Array<GenericType>;
}

const FilterLoadingComponent = React.memo(() => {
  return (
    <View className="flex h-full justify-center items-center px-6">
      <ActivityIndicator size={40} color={"#0061FF"} />
    </View>
  );
});

const CounterButton = React.memo(
  ({ value, handelValue }: CounterButttonProps) => {
    return (
      <View className="flex flex-row justify-between px-1 items-center w-2/6">
        <TouchableOpacity
          onPress={() => handelValue(-1)}
          className="p-1 bg-primary-100 rounded-full overflow-hidden"
        >
          <Image source={icons.minus} tintColor="#0061FF" className="size-6" />
        </TouchableOpacity>
        <Text className="text-sm font-rubik-medium text-black-300 mt-1">
          {value}
        </Text>
        <TouchableOpacity
          onPress={() => handelValue(1)}
          className="p-1 bg-primary-100 rounded-full overflow-hidden"
        >
          <Image source={icons.plus} tintColor="#0061FF" className="size-6" />
        </TouchableOpacity>
      </View>
    );
  }
);

const GenericSelector_small = React.memo(
  ({ propertyType, handlePress }: PropertyTypeProps) => {
    return (
      <View className="flex flex-row gap-3 flex-wrap mt-4">
        {propertyType.map((item, index) => (
          <TouchableOpacity
            className={`py-2 px-3 rounded-lg border-primary-200 flex flex-row gap-2 border ${
              item.isSelected ? "bg-primary-300" : "bg-primary-100"
            }`}
            key={index}
            onPress={() => handlePress(index)}
          >
            <Image
              source={item.icon}
              className="size-6"
              tintColor={item.isSelected ? "white" : "#666876"}
            />
            <Text
              className={`text-sm mt-0.5 font-rubik ${
                item.isSelected ? "text-white" : "text-black-200"
              }`}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }
);

const Histogram = React.memo(
  ({
    data,
  }: {
    data?: Array<{
      range_start: number;
      range_end: number;
      property_count: number;
    }>;
  }) => {
    return (
      <View className="flex flex-row gap-1 items-end mt-4">
        {data?.map((item, i) => (
          <View
            className="flex-1 bg-primary-200 origin-top"
            style={{ height: item.property_count * 25 }}
            key={i}
          />
        ))}
      </View>
    );
  }
);

const CustomLable = ({ data }: { data: LabelProps }) => {
  return (
    <View className="w-full flex-1 relative">
      <View
        className="absolute top-full py-6 -translate-x-7"
        style={{ left: data.oneMarkerLeftPosition }}
      >
        <Text className="text-sm font-rubik-medium text-primary-300">
          ${data.oneMarkerValue}
        </Text>
      </View>
      <View
        className="absolute top-full py-6 -translate-x-7"
        style={{ left: data.twoMarkerLeftPosition }}
      >
        <Text className="text-sm font-rubik-medium text-primary-300">
          ${data.twoMarkerValue}
        </Text>
      </View>
    </View>
  );
};

const CustomLable2 = ({ data }: { data: LabelProps }) => {
  return (
    <View className="w-full flex-1 relative">
      <View
        className="absolute top-full py-6 -translate-x-7"
        style={{ left: data.oneMarkerLeftPosition }}
      >
        <Text className="text-sm font-rubik-medium text-primary-300">
          {data.oneMarkerValue}
        </Text>
      </View>
      <View
        className="absolute top-full py-6 -translate-x-7"
        style={{ left: data.twoMarkerLeftPosition }}
      >
        <Text className="text-sm font-rubik-medium text-primary-300">
          {data.twoMarkerValue}
        </Text>
      </View>
    </View>
  );
};

export const FilterModal = React.memo(() => {
  const { bottomSheetModalRef, filterDetail } = useGlobalContext();
  const [isVisible, setIsVisible] = useState(false);
  type Filters = {
    range: [number, number];
    areaRange: [number, number];
    propertyType: Array<GenericType>;
    facilities: Array<GenericType>;
    bathroomCount: number;
    bedroomCount: number;
  };
  const initialFilters = useMemo<Filters>(
    () => ({
      range: [3100, 6100],
      areaRange: [900, 2000],
      propertyType: [
        {
          title: "Houses",
          category: "House",
          isSelected: true,
          icon: icons.house,
        },
        {
          title: "Condos",
          category: "Condo",
          isSelected: false,
          icon: icons.condo,
        },
        {
          title: "Duplexes",
          category: "Duplex",
          isSelected: false,
          icon: icons.duplex,
        },
        {
          title: "Studios",
          category: "Studio",
          isSelected: false,
          icon: icons.studio,
        },
        {
          title: "Villas",
          category: "Villa",
          isSelected: false,
          icon: icons.villa,
        },
        {
          title: "Apartments",
          category: "Apartment",
          isSelected: false,
          icon: icons.apartment,
        },
        {
          title: "Townhouses",
          category: "Townhouse",
          isSelected: false,
          icon: icons.townhouse,
        },
        {
          title: "Others",
          category: "Other",
          isSelected: false,
          icon: icons.more,
        },
      ],
      facilities: [
        {
          title: "Laundry",
          category: "Laundry",
          isSelected: true,
          icon: icons.laundry,
        },
        {
          title: "Parking",
          category: "Parking",
          isSelected: false,
          icon: icons.car_park,
        },
        {
          title: "Gym",
          category: "Gym",
          isSelected: false,
          icon: icons.dumbell,
        },
        {
          title: "Pet friendly",
          category: "Pet friendly",
          isSelected: false,
          icon: icons.dog,
        },
        {
          title: "Wi-fi",
          category: "Wi-fi",
          isSelected: false,
          icon: icons.wifi,
        },
        {
          title: "Swimming pool",
          category: "Swimming pool",
          isSelected: false,
          icon: icons.swim,
        },
      ],
      bathroomCount: 1,
      bedroomCount: 1,
    }),
    []
  );

  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [width, setWidth] = useState<number>(0);
  const snapPoints = useMemo(() => ["90%"], []);

  const handlePropertyType = (index: number) => {
    try {
      // console.log("pressed");
      setFilters((prevItem) => ({
        ...prevItem,
        propertyType: prevItem.propertyType.map((item, i) =>
          i === index
            ? {
                ...item,
                isSelected:
                  prevItem.propertyType.filter((obj) => obj.isSelected)
                    .length === 1
                    ? true
                    : !item.isSelected,
              }
            : item
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleFacilities = (index: number) => {
    try {
      setFilters((prevItem) => ({
        ...prevItem,
        facilities: prevItem.facilities.map((item, i) =>
          i === index
            ? {
                ...item,
                isSelected:
                  prevItem.facilities.filter((obj) => obj.isSelected).length ===
                  1
                    ? true
                    : !item.isSelected,
              }
            : item
        ),
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setWidth(Math.floor(width));
  };

  const handleSetFilter = () => {
    try {
      const filter = {
        ...filters,
        facilities: filters.facilities
          .filter((item) => item.isSelected)
          .map((item) => item.category),
        propertyType: filters.propertyType
          .filter((item) => item.isSelected)
          .map((item) => item.category),
      };
      router.setParams({ propFilter: JSON.stringify(filter) });
      if (bottomSheetModalRef.current) {
        bottomSheetModalRef.current[0]?.dismiss();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleReset = () => {
    router.setParams({ propFilter: null });
    setFilters(initialFilters);
  };

  const backDrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        {...props}
      />
    ),
    []
  );

  const handleModalOpen = useCallback(() => {
    setIsVisible(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsVisible(false);
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef?.current[0]?.dismiss();
    }
  }, []);

  const modalRef = useRef<BottomSheetModal>(null);
  useEffect(() => {
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef.current[0] = modalRef.current;
    }
  }, []);

  return (
    <BottomSheetModal
      onChange={(index) => {
        if (index >= 0) handleModalOpen();
        else handleModalClose();
      }}
      backdropComponent={backDrop}
      style={styles.shadowBox}
      snapPoints={snapPoints}
      ref={modalRef}
      enableDynamicSizing={false}
      handleIndicatorStyle={{ display: "none" }}
    >
      <BottomSheetView className="py-3 px-6">
        <View className="flex flex-row justify-between items-center w-full">
          <TouchableOpacity
            className="p-2 bg-primary-200 rounded-full"
            activeOpacity={0.6}
            onPress={handleModalClose}
          >
            <Image source={icons.back_arrow} className="size-6" />
          </TouchableOpacity>
          <Text className="font-rubik-medium text-lg text-black-300">
            Filter
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text className="font-rubik-medium text-base mt-1 text-primary-300">
              Reset
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
      {!isVisible ? (
        <FilterLoadingComponent />
      ) : (
        <BottomSheetScrollView
          className="py-2 flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <Text className="text-base font-rubik-medium mt-7 text-black-300">
            Property Type
          </Text>
          <GenericSelector_small
            propertyType={filters.propertyType}
            handlePress={(i) => handlePropertyType(i)}
          />
          <Text className="text-base font-rubik-medium mt-7 text-black-300">
            Price Range
          </Text>
          <View onLayout={handleLayout} className="w-full">
            <Histogram data={filterDetail?.price_ranges} />
            <MultiSlider
              sliderLength={width}
              trackStyle={{ height: 4, backgroundColor: "#0061FF1A" }}
              selectedStyle={{ backgroundColor: "#0061FF" }}
              markerContainerStyle={{ marginTop: 1 }}
              values={filters.range}
              max={
                filterDetail?.price_ranges[
                  filterDetail?.price_ranges.length - 1
                ].range_start
              }
              min={filterDetail?.price_ranges[0].range_start}
              isMarkersSeparated={true}
              allowOverlap={true}
              onValuesChange={(values) =>
                setFilters((prev) => ({
                  ...prev,
                  range: [values[0], values[1]],
                }))
              }
              markerStyle={{
                borderWidth: 3,
                borderColor: "#0061FF",
                backgroundColor: "white",
                width: 24,
                height: 24,
              }}
              containerStyle={{ height: 0 }}
              pressedMarkerStyle={{ transform: "scale(1.4)" }}
              step={500}
              snapped={true}
              enableLabel={true}
              customLabel={(e) => <CustomLable data={e} />}
            />
          </View>
          <Text className="text-base font-rubik-medium mt-20 text-black-300">
            Home Details
          </Text>
          <View className="mt-4">
            <View className="flex flex-row justify-between w-full py-4">
              <Text className="text-black-200 font-rubik-medium text-sm">
                Bedrooms
              </Text>
              <CounterButton
                value={filters.bedroomCount}
                handelValue={(value) =>
                  filters.bedroomCount === 1 && value === -1
                    ? null
                    : setFilters((prev) => ({
                        ...prev,
                        bedroomCount: prev.bedroomCount + value,
                      }))
                }
              />
            </View>
            <View className="flex flex-row justify-between w-full py-4 border-t-[1px] border-t-primary-100">
              <Text className="text-black-200 font-rubik-medium text-sm">
                Bathrooms
              </Text>
              <CounterButton
                value={filters.bathroomCount}
                handelValue={(value) =>
                  filters.bathroomCount === 1 && value === -1
                    ? null
                    : setFilters((prev) => ({
                        ...prev,
                        bathroomCount: prev.bathroomCount + value,
                      }))
                }
              />
            </View>
          </View>
          <Text className="text-base font-rubik-medium mt-3 text-black-300">
            Facilities
          </Text>
          <GenericSelector_small
            propertyType={filters.facilities}
            handlePress={(i) => handleFacilities(i)}
          />
          <Text className="text-base font-rubik-medium mt-7 mb-7 text-black-300">
            Building Size
          </Text>
          <View onLayout={handleLayout} className="w-full mb-8">
            <MultiSlider
              sliderLength={width}
              trackStyle={{ height: 4, backgroundColor: "#0061FF1A" }}
              selectedStyle={{ backgroundColor: "#0061FF" }}
              markerContainerStyle={{ marginTop: 1 }}
              values={filters.areaRange}
              max={filterDetail?.area_summary.max_area}
              min={filterDetail?.area_summary.min_area}
              isMarkersSeparated={true}
              allowOverlap={true}
              onValuesChange={(values) =>
                setFilters((prev) => ({
                  ...prev,
                  areaRange: [values[0], values[1]],
                }))
              }
              markerStyle={{
                borderWidth: 3,
                borderColor: "#0061FF",
                backgroundColor: "white",
                width: 24,
                height: 24,
              }}
              containerStyle={{ height: 0 }}
              pressedMarkerStyle={{ transform: "scale(1.4)" }}
              step={100}
              snapped={true}
              enableLabel={true}
              customLabel={(e) => <CustomLable2 data={e} />}
            />
          </View>
          <Button
            text="Set Filter"
            handlePress={handleSetFilter}
            buttonStyle="my-9"
          />
        </BottomSheetScrollView>
      )}
    </BottomSheetModal>
  );
});

export const SortModal = () => {
  const snapPoints = useMemo(() => ["55%"], []);
  const { bottomSheetModalRef } = useGlobalContext();
  const initailSortSelected: {
    name: boolean;
    created_at: boolean;
    rating: boolean;
    price: boolean;
  } = {
    name: false,
    created_at: false,
    rating: false,
    price: false,
  };
  const [sortSelected, setSortSelected] = useState<{
    name: boolean;
    created_at: boolean;
    rating: boolean;
    price: boolean;
  }>({
    name: false,
    created_at: false,
    rating: false,
    price: false,
  });
  const initialSort: SortType = {
    name: [
      {
        title: "A-Z",
        category: "ascending",
        isSelected: true,
        icon: icons.a_z,
      },
      {
        title: "Z-A",
        category: "descending",
        isSelected: false,
        icon: icons.z_a,
      },
    ],
    created_at: [
      {
        title: "Latest",
        category: "ascending",
        isSelected: true,
        icon: icons.time_up,
      },
      {
        title: "Oldest",
        category: "descending",
        isSelected: false,
        icon: icons.time_down,
      },
    ],
    rating: [
      {
        title: "Most rated",
        category: "descending",
        isSelected: true,
        icon: icons.rating_up,
      },
      {
        title: "Least rated",
        category: "ascending",
        isSelected: false,
        icon: icons.rating_down,
      },
    ],
    price: [
      {
        title: "Most expensive",
        category: "descending",
        isSelected: true,
        icon: icons.price_up,
      },
      {
        title: "Least expensive",
        category: "ascending",
        isSelected: false,
        icon: icons.price_down,
      },
    ],
  };
  const [sort, setSort] = useState<SortType>(initialSort);
  const backDrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        {...props}
      />
    ),
    []
  );
  const handleReset = () => {
    router.setParams({ sort: null });
    setSort(initialSort);
    setSortSelected(initailSortSelected);
  };

  const handleSort = () => {
    const finalSort = Object.entries(sortSelected)
      .map(([key, value]) =>
        value
          ? {
              [key]: sort[key]
                .filter((item) => item.isSelected)
                .map((item) => item.category)[0],
            }
          : null
      )
      .filter((item) => item)[0];

    router.setParams({ sort: JSON.stringify(finalSort) });
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef?.current[1]?.close();
    }
  };

  const handleModalClose = useCallback(() => {
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef?.current[1]?.close();
    }
  }, []);
  return (
    <BottomSheetModal
      snapPoints={snapPoints}
      backdropComponent={backDrop}
      style={styles.shadowBox}
      ref={(el) => (bottomSheetModalRef.current[1] = el)}
      handleIndicatorStyle={{ display: "none" }}
      enableDynamicSizing={false}
    >
      <BottomSheetView className="px-5 pb-4">
        <View className="flex flex-row justify-between items-center w-full">
          <TouchableOpacity
            className="p-2 bg-primary-200 rounded-full"
            activeOpacity={0.6}
            onPress={handleModalClose}
          >
            <Image source={icons.back_arrow} className="size-6" />
          </TouchableOpacity>
          <Text className="font-rubik-medium text-lg text-black-300">
            Sort by
          </Text>
          <TouchableOpacity onPress={handleReset}>
            <Text className="font-rubik-medium text-base mt-1 text-primary-300">
              Reset
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
      <BottomSheetScrollView
        className="flex-1 px-5"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ opacity: sortSelected.name ? 1 : 0.6 }}>
          <View className="flex flex-row gap-3 items-center">
            <CheckBox
              onPress={() =>
                setSortSelected((prev) => ({
                  name: !prev.name,
                  created_at: false,
                  rating: false,
                  price: false,
                }))
              }
              isSelected={sortSelected.name}
            />
            <Text className="text-black-300 font-rubik-medium mt-0.5">
              Sort name
            </Text>
          </View>
          <GenericSelector_small
            propertyType={sort.name}
            handlePress={() => {
              sortSelected.name
                ? setSort((prev) => ({
                    ...prev,
                    name: prev.name.map((item) => ({
                      ...item,
                      isSelected: !item.isSelected,
                    })),
                  }))
                : null;
            }}
          />
        </View>
        <View
          className="mt-7"
          style={{ opacity: sortSelected.created_at ? 1 : 0.6 }}
        >
          <View className="flex flex-row gap-3 items-center">
            <CheckBox
              onPress={() =>
                setSortSelected((prev) => ({
                  name: false,
                  created_at: !prev.created_at,
                  rating: false,
                  price: false,
                }))
              }
              isSelected={sortSelected.created_at}
            />
            <Text className="text-black-300 font-rubik-medium mt-0.5">
              Sort uploaded date
            </Text>
          </View>
          <GenericSelector_small
            propertyType={sort.created_at}
            handlePress={() => {
              sortSelected.created_at
                ? setSort((prev) => ({
                    ...prev,
                    created_at: prev.created_at.map((item) => ({
                      ...item,
                      isSelected: !item.isSelected,
                    })),
                  }))
                : null;
            }}
          />
        </View>
        <View
          className="mt-7"
          style={{ opacity: sortSelected.rating ? 1 : 0.6 }}
        >
          <View className="flex flex-row gap-3 items-center">
            <CheckBox
              onPress={() =>
                setSortSelected((prev) => ({
                  name: false,
                  created_at: false,
                  rating: !prev.rating,
                  price: false,
                }))
              }
              isSelected={sortSelected.rating}
            />
            <Text className="text-black-300 font-rubik-medium mt-0.5">
              Sort rating
            </Text>
          </View>
          <GenericSelector_small
            propertyType={sort.rating}
            handlePress={() => {
              sortSelected.rating
                ? setSort((prev) => ({
                    ...prev,
                    rating: prev.rating.map((item) => ({
                      ...item,
                      isSelected: !item.isSelected,
                    })),
                  }))
                : null;
            }}
          />
        </View>
        <View
          className="mt-7"
          style={{ opacity: sortSelected.price ? 1 : 0.6 }}
        >
          <View className="flex flex-row gap-3 items-center">
            <CheckBox
              onPress={() =>
                setSortSelected((prev) => ({
                  name: false,
                  created_at: false,
                  rating: false,
                  price: !prev.price,
                }))
              }
              isSelected={sortSelected.price}
            />
            <Text className="text-black-300 font-rubik-medium mt-0.5">
              Sort price
            </Text>
          </View>
          <GenericSelector_small
            propertyType={sort.price}
            handlePress={() => {
              sortSelected.price
                ? setSort((prev) => ({
                    ...prev,
                    price: prev.price.map((item) => ({
                      ...item,
                      isSelected: !item.isSelected,
                    })),
                  }))
                : null;
            }}
          />
        </View>
        <View className="px-5 flex-1">
          <Button
            text="Apply Sort"
            buttonStyle="my-7"
            handlePress={handleSort}
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
};

export const ReviewModal = () => {
  const snapPoints = useMemo(() => ["95%"], []);
  const { bottomSheetModalRef } = useGlobalContext();
  const params = useLocalSearchParams<{ propertyId: string }>();
  const [isFirstInstance, setIsFirstInstance] = useState(true);
  const [reviews, setReviews] = useState<Array<ReviewReturn> | null>([]);
  const [isEnd, setIsEnd] = useState(false);
  const [range, setRange] = useState([0, 5]);
  const [availableSorts, setAvailableSorts] = useState<GenericType[]>([
    {
      title: "Latest",
      category: "ascending",
      isSelected: true,
      icon: icons.time_up,
    },
    {
      title: "Oldest",
      category: "descending",
      isSelected: false,
      icon: icons.time_down,
    },
  ]);
  const [filter, setFilter] = useState<"ascending" | "descending">("ascending");

  const { data, refetch, loading } = useSupabase({
    fn: getReviews,
    params: {
      propertyId: params.propertyId,
      filter: "ascending",
      range: [0, 5],
    },
    skip: true,
  });

  const {
    data: moreReview,
    refetch: refetchMoreReview,
    loading: loadingMoreReview,
  } = useSupabase({
    fn: getReviews,
    params: {
      propertyId: params.propertyId,
      filter: filter,
      range: range,
    },
    skip: true,
  });

  useEffect(() => {
    if (params.propertyId) {
      refetch({
        propertyId: params.propertyId,
        filter: filter,
        range: [0, 5],
      });
    }
    return () => {
      setIsFirstInstance(true);
      setRange([0, 5]);
      setReviews([]);
      setIsEnd(false);
    };
  }, [params.propertyId, filter]);

  useEffect(() => {
    if (data && data?.length < 6) {
      setIsEnd(true);
    }
  }, [data]);

  useEffect(() => {
    setReviews((prev) => [...(prev ?? []), ...(moreReview ?? [])]);
    if (moreReview && moreReview.length < 6) {
      setIsEnd(true);
    }
  }, [moreReview]);

  const handleModalClose = useCallback(() => {
    bottomSheetModalRef?.current[2]?.dismiss();
  }, []);

  const fetchMoreData = useCallback(() => {
    if (isEnd) {
      return;
    }
    refetchMoreReview({
      propertyId: params.propertyId,
      filter: filter,
      range: [range[0] + 1, range[1] + 6],
    });
    setRange((prev) => [prev[1] + 1, prev[1] + 6]);
    setIsFirstInstance(false);
  }, [range, isEnd, loadingMoreReview]);

  const handleReload = () => {
    refetch({
      propertyId: params.propertyId,
      filter: "ascending",
      range: [0, 5],
    });
  };

  const backDrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        {...props}
      />
    ),
    []
  );
  return (
    <BottomSheetModal
      snapPoints={snapPoints}
      ref={(el) => (bottomSheetModalRef.current[2] = el)}
      style={styles.shadowBox}
      backdropComponent={backDrop}
      handleIndicatorStyle={{ display: "none" }}
      enableDynamicSizing={false}
    >
      <BottomSheetView className=" px-5 py-3 flex flex-row justify-between">
        <View className="flex flex-row justify-between w-full items-center">
          <TouchableOpacity
            className="p-2 bg-primary-200 rounded-full"
            activeOpacity={0.6}
            onPress={handleModalClose}
          >
            <Image source={icons.back_arrow} className="size-6" />
          </TouchableOpacity>
          <Text className="font-rubik-medium text-lg text-black-300">
            Customer review
          </Text>
          <TouchableOpacity onPress={handleReload}>
            <Text className="font-rubik-medium text-base mt-1 text-primary-300">
              Reload
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
      <BottomSheetFlatList
        contentContainerClassName="flex flex-col gap-8 px-5"
        showsVerticalScrollIndicator={false}
        onEndReached={fetchMoreData}
        data={
          loading
            ? []
            : isFirstInstance
            ? data
            : [...(data ?? []), ...(reviews ?? [])]
        }
        ListHeaderComponent={
          <GenericSelector_small
            propertyType={availableSorts}
            handlePress={(index) => {
              setAvailableSorts((prev) =>
                prev.map((item) => ({
                  ...item,
                  isSelected: !item.isSelected,
                }))
              );
              setFilter(availableSorts[index].category);
            }}
          />
        }
        ListFooterComponentClassName="mb-5"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <ReviewCard data={item} />}
        ListEmptyComponent={
          loading ? (
            <View className="px-5 mt-5 flex flex-row gap-8 flex-wrap">
              {[...Array(3)].map((_, i) => (
                <LoadingReviewCard key={i} />
              ))}
            </View>
          ) : (
            <NoResult
              imageClassName="size-44"
              title="No review"
              subTitle="No review were posted!"
            />
          )
        }
        ListFooterComponent={
          !isEnd ? (
            <View className="flex flex-row gap-8 flex-wrap">
              {[...Array(2)].map((_, i) => (
                <LoadingReviewCard key={i} />
              ))}
            </View>
          ) : (
            data && (
              <Text className="text-black-200 font-rubik-medium text-center">
                No more review! 🥹
              </Text>
            )
          )
        }
      />
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  shadowBox: {
    backgroundColor: "white",
    borderRadius: 20,
    zIndex: 999,
  },
});
