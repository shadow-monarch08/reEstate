import CheckBox from "@/components/CheckBox";
import { useAppStore } from "@/lib/zustand/store/useAppStore";
import MultiSlider from "@ptomasroos/react-native-multi-slider";
import React, { useState } from "react";
import { LayoutChangeEvent, Text, View } from "react-native";

type LabelProps = {
  oneMarkerValue: string | number;
  twoMarkerValue: string | number;
  oneMarkerLeftPosition: number;
  twoMarkerLeftPosition: number;
  oneMarkerPressed: boolean;
  twoMarkerPressed: boolean;
};

const CustomLable: React.FC<LabelProps> = (data) => {
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

const AreaSelector = () => {
  const [width, setWidth] = useState<number>(0);
  const handleLayout = (event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setWidth(Math.floor(width));
  };
  const {
    propertyFilter,
    updatePropertyFilter,
    toggleFilterState,
    filterDetail,
  } = useAppStore();
  return (
    <View
      className="mt-7 mb-14"
      style={{ opacity: propertyFilter.areaRange.isActive ? 1 : 0.5 }}
    >
      <View className="flex flex-row justify-between items-center w-full">
        <Text className="text-base font-rubik-medium text-black-300">
          Price Range
        </Text>
        <CheckBox
          onPress={() => {
            toggleFilterState("areaRange");
          }}
          isSelected={propertyFilter.areaRange.isActive}
        />
      </View>
      <View
        onLayout={handleLayout}
        className="w-full mt-7"
        pointerEvents={propertyFilter.areaRange.isActive ? "auto" : "none"}
      >
        <MultiSlider
          sliderLength={width}
          trackStyle={{ height: 4, backgroundColor: "#0061FF1A" }}
          selectedStyle={{ backgroundColor: "#0061FF" }}
          markerContainerStyle={{ marginTop: 1 }}
          values={propertyFilter.areaRange.data}
          max={filterDetail?.area_summary.max_area}
          min={filterDetail?.area_summary.min_area}
          isMarkersSeparated={true}
          allowOverlap={true}
          onValuesChange={(values) => {
            updatePropertyFilter("areaRange", [values[0], values[1]]);
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
          customLabel={(e) => <CustomLable {...e} />}
        />
      </View>
    </View>
  );
};

export default React.memo(AreaSelector);
