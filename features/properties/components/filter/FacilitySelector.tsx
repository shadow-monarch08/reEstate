import CheckBox from "@/components/CheckBox";
import { useAppStore } from "@/lib/zustand/store/useAppStore";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";

const FacilitySelector = () => {
  const { propertyFilter, toggleFilterState, updatePropertyFilter } =
    useAppStore();
  return (
    <View
      className="mt-7"
      style={{ opacity: propertyFilter.facilities.isActive ? 1 : 0.5 }}
    >
      <View className="flex flex-row justify-between items-center w-full">
        <Text className="text-base font-rubik-medium text-black-300">
          Facilities
        </Text>
        <CheckBox
          onPress={() => {
            toggleFilterState("facilities");
          }}
          isSelected={propertyFilter.facilities.isActive}
        />
      </View>
      <View
        pointerEvents={propertyFilter.facilities.isActive ? "auto" : "none"}
      >
        <View className="flex flex-row gap-3 flex-wrap mt-4">
          {propertyFilter.facilities.data.map((item, index) => (
            <TouchableOpacity
              className={`py-2 px-3 rounded-lg border-primary-200 flex flex-row gap-2 border ${
                item.isSelected ? "bg-primary-300" : "bg-primary-100"
              }`}
              key={index}
              onPress={() =>
                updatePropertyFilter(
                  "facilities",
                  propertyFilter.facilities.data.map((facility, i) => {
                    if (i === index) {
                      return { ...facility, isSelected: !facility.isSelected };
                    } else {
                      return facility;
                    }
                  })
                )
              }
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
      </View>
    </View>
  );
};

export default React.memo(FacilitySelector);
