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
import { Button } from "./atoms/Button";
import { router, useLocalSearchParams } from "expo-router";
import CheckBox from "./CheckBox";
import { useSupabase } from "@/lib/useSupabase";
import {
  AreaSummary,
  getReviews,
  PriceRange,
  ReviewReturn,
} from "@/lib/supabase";
import { LoadingReviewCard, ReviewCard } from "./Card";
import { NoResult } from "./NoResult";
import { initialFilters } from "@/constants/data";
import { useAppStore } from "@/lib/zustand/store/useAppStore";

interface GenericType {
  title: string;
  category: string | "ascending" | "descending";
  isSelected: boolean;
  icon: ImageSourcePropType;
}

export interface Filters {
  range?: [number, number];
  areaRange?: [number, number];
  propertyType?: Array<GenericType>;
  facilities?: Array<GenericType>;
  bathroomCount?: number;
  bedroomCount?: number;
}

interface PropertyTypeProps {
  propertyType: Array<GenericType>;
  handlePress: (pram: number) => void;
}

interface CounterButttonProps {
  value: number;
  handelValue: (param: number) => void;
}

interface PriceSelectorProps {
  priceRanges?: PriceRange[];
  handleFilterChange: (values: [number, number]) => void;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

interface PropertyTypeSelectorProps {
  handlePress: (index: number) => void;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

interface HomeDetailProps {
  handleFilterChange: (value: number, key: string) => void;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

interface FacilitySelectorProps {
  handlePress: (index: number) => void;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

interface AreaSliderProps {
  areaSummery?: AreaSummary;
  handleFilterChange: (values: [number, number]) => void;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
}

const PropertyTypeSelector = React.memo(
  ({ handlePress, setFilters }: PropertyTypeSelectorProps) => {
    const [isSelected, setIsSelected] = useState(true);
    const backupData = useRef(initialFilters.propertyType);
    return (
      <View className="mt-7" style={{ opacity: isSelected ? 1 : 0.5 }}>
        <View className="flex flex-row justify-between items-center w-full">
          <Text className="text-base font-rubik-medium text-black-300">
            Property Type
          </Text>
          <CheckBox
            onPress={() => {
              setIsSelected(!isSelected);
              setFilters((prev) => {
                const newData = { ...prev };
                if (isSelected) {
                  newData.propertyType = backupData.current;
                } else {
                  delete newData.propertyType;
                }
                return newData;
              });
            }}
            isSelected={isSelected}
          />
        </View>
        <View pointerEvents={isSelected ? "auto" : "none"}>
          <GenericSelector_small
            propertyType={backupData.current!}
            handlePress={(i) => {
              handlePress(i);
              backupData.current = backupData.current?.map((item, index) =>
                index === i ? { ...item, isSelected: !item.isSelected } : item
              );
            }}
          />
        </View>
      </View>
    );
  }
);

const PriceRangeSlider = React.memo(
  ({ priceRanges, handleFilterChange, setFilters }: PriceSelectorProps) => {
    const [width, setWidth] = useState<number>(0);
    const handleLayout = (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      setWidth(Math.floor(width));
    };
    const [isSelected, setIsSelected] = useState(false);
    const backupData = useRef(initialFilters.range);
    return (
      <View className="mt-7 mb-16" style={{ opacity: isSelected ? 1 : 0.5 }}>
        <View className="flex flex-row justify-between items-center w-full">
          <Text className="text-base font-rubik-medium text-black-300">
            Price Range
          </Text>
          <CheckBox
            onPress={() => {
              setIsSelected(!isSelected);
              setFilters((prev) => {
                const newData = { ...prev };
                if (isSelected) {
                  newData.range = backupData.current;
                } else {
                  delete newData.range;
                }
                return newData;
              });
            }}
            isSelected={isSelected}
          />
        </View>
        <View
          onLayout={handleLayout}
          className="w-full"
          pointerEvents={isSelected ? "auto" : "none"}
        >
          <Histogram data={priceRanges} />
          <MultiSlider
            sliderLength={width}
            trackStyle={{ height: 4, backgroundColor: "#0061FF1A" }}
            selectedStyle={{ backgroundColor: "#0061FF" }}
            markerContainerStyle={{ marginTop: 1 }}
            values={backupData.current}
            max={priceRanges![priceRanges!.length - 1].range_start}
            min={priceRanges![0].range_start}
            isMarkersSeparated={true}
            allowOverlap={true}
            onValuesChange={(values) => {
              handleFilterChange([values[0], values[1]]);
              backupData.current = [values[0], values[1]];
            }}
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
      </View>
    );
  }
);

const HomeDetail = React.memo(
  ({ handleFilterChange, setFilters }: HomeDetailProps) => {
    const backupData = useRef({
      bedroomCount: initialFilters.bedroomCount,
      bathroomCount: initialFilters.bathroomCount,
    });
    const [isSelected, setIsSelected] = useState(false);
    return (
      <View className="mt-7 " style={{ opacity: isSelected ? 1 : 0.5 }}>
        <View className="flex flex-row justify-between items-center w-full">
          <Text className="text-base font-rubik-medium text-black-300">
            Home Details
          </Text>
          <CheckBox
            onPress={() => {
              setIsSelected(!isSelected);
              setFilters((prev) => {
                const newData = { ...prev };
                if (isSelected) {
                  newData.bedroomCount = backupData.current.bedroomCount;
                  newData.bathroomCount = backupData.current.bathroomCount;
                } else {
                  delete newData.bedroomCount;
                  delete newData.bathroomCount;
                }
                return newData;
              });
            }}
            isSelected={isSelected}
          />
        </View>
        <View className="mt-4" pointerEvents={isSelected ? "auto" : "none"}>
          <View className="flex flex-row justify-between w-full py-4">
            <Text className="text-black-200 font-rubik-medium text-sm">
              Bedrooms
            </Text>
            <CounterButton
              value={backupData.current.bedroomCount!}
              handelValue={(value) => {
                handleFilterChange(
                  backupData.current.bedroomCount! == 1 && value === -1
                    ? 0
                    : backupData.current.bedroomCount! + value,
                  "bedroomCount"
                );
                backupData.current.bedroomCount =
                  backupData.current.bedroomCount! == 1 && value === -1
                    ? 0
                    : backupData.current.bedroomCount! + value;
              }}
            />
          </View>
          <View className="flex flex-row justify-between w-full py-4 border-t-[1px] border-t-primary-100">
            <Text className="text-black-200 font-rubik-medium text-sm">
              Bathrooms
            </Text>
            <CounterButton
              value={backupData.current.bathroomCount!}
              handelValue={(value) => {
                handleFilterChange(
                  backupData.current.bathroomCount! == 1 && value === -1
                    ? 0
                    : backupData.current.bathroomCount! + value,
                  "bathroomCount"
                );
                backupData.current.bathroomCount =
                  backupData.current.bathroomCount! == 1 && value === -1
                    ? 0
                    : backupData.current.bathroomCount! + value;
              }}
            />
          </View>
        </View>
      </View>
    );
  }
);

const FacilitySelector = React.memo(
  ({ handlePress, setFilters }: FacilitySelectorProps) => {
    const [isSelected, setIsSelected] = useState(false);
    const backupData = useRef(initialFilters.facilities);
    return (
      <View className="mt-7" style={{ opacity: isSelected ? 1 : 0.5 }}>
        <View className="flex flex-row justify-between items-center w-full">
          <Text className="text-base font-rubik-medium text-black-300">
            Facilities
          </Text>
          <CheckBox
            onPress={() => {
              setIsSelected(!isSelected);
              setFilters((prev) => {
                const newData = { ...prev };
                if (isSelected) {
                  newData.facilities = backupData.current;
                } else {
                  delete newData.facilities;
                }
                return newData;
              });
            }}
            isSelected={isSelected}
          />
        </View>
        <View pointerEvents={isSelected ? "auto" : "none"}>
          <GenericSelector_small
            propertyType={backupData.current!}
            handlePress={(i) => {
              handlePress(i);
              backupData.current = backupData.current!.map((item, index) =>
                index === i ? { ...item, isSelected: !item.isSelected } : item
              );
            }}
          />
        </View>
      </View>
    );
  }
);

const AreaSlider = React.memo(
  ({ areaSummery, handleFilterChange, setFilters }: AreaSliderProps) => {
    const [width, setWidth] = useState<number>(0);
    const handleLayout = (event: LayoutChangeEvent) => {
      const { width } = event.nativeEvent.layout;
      setWidth(Math.floor(width));
    };
    const [isSelected, setIsSelected] = useState(false);
    const backupData = useRef(initialFilters.areaRange);
    return (
      <View className="mt-7 mb-14" style={{ opacity: isSelected ? 1 : 0.5 }}>
        <View className="flex flex-row justify-between items-center w-full">
          <Text className="text-base font-rubik-medium text-black-300">
            Price Range
          </Text>
          <CheckBox
            onPress={() => {
              setIsSelected(!isSelected);
              setFilters((prev) => {
                const newData = { ...prev };
                if (isSelected) {
                  newData.areaRange = backupData.current;
                } else {
                  delete newData.areaRange;
                }
                return newData;
              });
            }}
            isSelected={isSelected}
          />
        </View>
        <View
          onLayout={handleLayout}
          className="w-full mt-7"
          pointerEvents={isSelected ? "auto" : "none"}
        >
          <MultiSlider
            sliderLength={width}
            trackStyle={{ height: 4, backgroundColor: "#0061FF1A" }}
            selectedStyle={{ backgroundColor: "#0061FF" }}
            markerContainerStyle={{ marginTop: 1 }}
            values={backupData.current}
            max={areaSummery?.max_area}
            min={areaSummery?.min_area}
            isMarkersSeparated={true}
            allowOverlap={true}
            onValuesChange={(values) => {
              handleFilterChange([values[0], values[1]]);
              backupData.current = [values[0], values[1]];
            }}
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
      </View>
    );
  }
);

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
  const { bottomSheetModalRef } = useGlobalContext();
  // const { filterDetail } = useAppStore();

  const [isVisible, setIsVisible] = useState(false);
  // const [filters, setFilters] = useState<Filters>({
  //   propertyType: [
  //     {
  //       title: "Houses",
  //       category: "House",
  //       isSelected: true,
  //       icon: icons.house,
  //     },
  //     {
  //       title: "Condos",
  //       category: "Condo",
  //       isSelected: false,
  //       icon: icons.condo,
  //     },
  //     {
  //       title: "Duplexes",
  //       category: "Duplex",
  //       isSelected: false,
  //       icon: icons.duplex,
  //     },
  //     {
  //       title: "Studios",
  //       category: "Studio",
  //       isSelected: false,
  //       icon: icons.studio,
  //     },
  //     {
  //       title: "Villas",
  //       category: "Villa",
  //       isSelected: false,
  //       icon: icons.villa,
  //     },
  //     {
  //       title: "Apartments",
  //       category: "Apartment",
  //       isSelected: false,
  //       icon: icons.apartment,
  //     },
  //     {
  //       title: "Townhouses",
  //       category: "Townhouse",
  //       isSelected: false,
  //       icon: icons.townhouse,
  //     },
  //     {
  //       title: "Others",
  //       category: "Other",
  //       isSelected: false,
  //       icon: icons.more,
  //     },
  //   ],
  // });

  const snapPoints = useMemo(() => ["90%"], []);

  // const handlePropertyType = (index: number) => {
  //   try {
  //     // console.log("pressed");
  //     if (filters.propertyType) {
  //       setFilters((prevItem) => ({
  //         ...prevItem,
  //         propertyType: prevItem.propertyType?.map((item, i) =>
  //           i === index
  //             ? {
  //                 ...item,
  //                 isSelected:
  //                   prevItem.propertyType?.filter((obj) => obj.isSelected)
  //                     .length === 1
  //                     ? true
  //                     : !item.isSelected,
  //               }
  //             : item
  //         ),
  //       }));
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const handleFacilities = (index: number) => {
  //   try {
  //     setFilters((prevItem) => ({
  //       ...prevItem,
  //       facilities: prevItem.facilities?.map((item, i) =>
  //         i === index
  //           ? {
  //               ...item,
  //               isSelected:
  //                 prevItem.facilities?.filter((obj) => obj.isSelected)
  //                   .length === 1
  //                   ? true
  //                   : !item.isSelected,
  //             }
  //           : item
  //       ),
  //     }));
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const handleSetFilter = () => {
  //   try {
  //     let filter = {};
  //     if (filters.propertyType) {
  //       filter = {
  //         ...filter,
  //         propertyType: filters.propertyType
  //           ?.filter((item) => item.isSelected)
  //           .map((item) => item.category),
  //       };
  //     }
  //     if (filters.facilities) {
  //       filter = {
  //         ...filter,
  //         facilities: filters.facilities
  //           ?.filter((item) => item.isSelected)
  //           .map((item) => item.category),
  //       };
  //     }
  //     console.log("filter", filter);
  //     router.setParams({ propFilter: JSON.stringify(filter) });
  //     if (bottomSheetModalRef.current) {
  //       bottomSheetModalRef.current[0]?.dismiss();
  //     }
  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  // const handleReset = () => {
  //   router.setParams({ propFilter: null });
  //   // setFilters(initialFilters);
  // };

  const backDrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
      />
    ),
    []
  );

  // const handleModalOpen = useCallback(() => {
  //   setIsVisible(true);
  // }, []);

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
      // onChange={(index) => {
      //   if (index >= 0) handleModalOpen();
      //   else handleModalClose();
      // }}
      // index={0}
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
          <TouchableOpacity>
            <Text className="font-rubik-medium text-base mt-1 text-primary-300">
              Reset
            </Text>
          </TouchableOpacity>
        </View>
      </BottomSheetView>
      {/* {!isVisible ? (
        <FilterLoadingComponent />
      ) : (
        <BottomSheetScrollView
          className="py-2 flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <PropertyTypeSelector
            handlePress={handlePropertyType}
            setFilters={setFilters}
          />
          <PriceRangeSlider
            priceRanges={filterDetail?.price_ranges}
            handleFilterChange={(values: [number, number]) =>
              setFilters((prev) => ({ ...prev, range: values }))
            }
            setFilters={setFilters}
          />
          <HomeDetail
            handleFilterChange={(value: number, key: string) => {
              setFilters((prev) => ({ ...prev, [key]: value }));
            }}
            setFilters={setFilters}
          />
          <FacilitySelector
            handlePress={handleFacilities}
            setFilters={setFilters}
          />
          <AreaSlider
            areaSummery={filterDetail?.area_summary}
            handleFilterChange={(values: [number, number]) =>
              setFilters((prev) => ({ ...prev, areaRange: values }))
            }
            setFilters={setFilters}
          /> */}
      {/* <Button
            text="Set Filter"
            handlePress={handleSetFilter}
            buttonStyle="my-9"
          />
        </BottomSheetScrollView>
      )} */}
    </BottomSheetModal>
  );
});

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
    if (bottomSheetModalRef.current) {
      bottomSheetModalRef?.current[2]?.dismiss();
    }
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
      ref={(el) => {
        if (bottomSheetModalRef.current) {
          bottomSheetModalRef.current[2] = el;
        }
      }}
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
