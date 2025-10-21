import { CounterButton } from "@/components/atoms/Button";
import CheckBox from "@/components/CheckBox";
import { useAppStore } from "@/lib/zustand/store/useAppStore";
import React from "react";
import { Text, View } from "react-native";

const HomeDetail = () => {
  const { propertyFilter, updatePropertyFilter, toggleFilterState } =
    useAppStore();
  return (
    <View
      className="mt-7 "
      style={{ opacity: propertyFilter.homeDetails.isActive ? 1 : 0.5 }}
    >
      <View className="flex flex-row justify-between items-center w-full">
        <Text className="text-base font-rubik-medium text-black-300">
          Home Details
        </Text>
        <CheckBox
          onPress={() => {
            toggleFilterState("homeDetails");
          }}
          isSelected={propertyFilter.homeDetails.isActive}
        />
      </View>
      <View
        className="mt-4"
        pointerEvents={propertyFilter.homeDetails.isActive ? "auto" : "none"}
      >
        <View className="flex flex-row justify-between w-full py-4">
          <Text className="text-black-200 font-rubik-medium text-sm">
            Bedrooms
          </Text>
          <CounterButton
            value={propertyFilter.homeDetails.data.bedrooms}
            handelValue={(value) => {
              const newData = propertyFilter.homeDetails.data.bedrooms;
              if (value == -1 && newData == 1) {
                updatePropertyFilter("homeDetails", {
                  ...propertyFilter.homeDetails.data,
                  bedrooms: 1,
                });
              } else {
                updatePropertyFilter("homeDetails", {
                  ...propertyFilter.homeDetails.data,
                  bedrooms: newData + value,
                });
              }
            }}
          />
        </View>
        <View className="flex flex-row justify-between w-full py-4 border-t-[1px] border-t-primary-100">
          <Text className="text-black-200 font-rubik-medium text-sm">
            Bathrooms
          </Text>
          <CounterButton
            value={propertyFilter.homeDetails.data.bedrooms}
            handelValue={(value) => {
              const newData = propertyFilter.homeDetails.data.bedrooms;
              if (value == -1 && newData == 1) {
                updatePropertyFilter("homeDetails", {
                  ...propertyFilter.homeDetails.data,
                  bathrooms: 1,
                });
              } else {
                updatePropertyFilter("homeDetails", {
                  ...propertyFilter.homeDetails.data,
                  bathrooms: newData + value,
                });
              }
            }}
          />
        </View>
      </View>
    </View>
  );
};

export default React.memo(HomeDetail);
