import React from "react";
import CheckBox from "@/components/CheckBox";
import { Image, Text, TouchableOpacity, View } from "react-native";
import { useAppStore } from "@/lib/zustand/store/useAppStore";

const PropertySelector = () => {
  const { propertyFilter, updatePropertyFilter, toggleFilterState } =
    useAppStore();
  return (
    <View
      className="mt-7"
      style={{ opacity: propertyFilter["proprtyType"].isActive ? 1 : 0.5 }}
    >
      <View className="flex flex-row justify-between items-center w-full">
        <Text className="text-base font-rubik-medium text-black-300">
          Property Type
        </Text>
        <CheckBox
          onPress={() => {
            toggleFilterState("proprtyType");
          }}
          isSelected={propertyFilter["proprtyType"].isActive}
        />
      </View>
      <View
        pointerEvents={propertyFilter["proprtyType"].isActive ? "auto" : "none"}
      >
        <View className="flex flex-row gap-3 flex-wrap mt-4">
          {propertyFilter["proprtyType"].data.map((item, i) => (
            <TouchableOpacity
              className={`py-2 px-3 rounded-lg border-primary-200 flex flex-row gap-2 border ${
                item.isSelected ? "bg-primary-300" : "bg-primary-100"
              }`}
              key={i}
              onPress={() => {
                const newData = propertyFilter["proprtyType"].data.map(
                  (itm, idx) => {
                    if (i === idx) {
                      return { ...itm, isSelected: !itm.isSelected };
                    } else {
                      return itm;
                    }
                  }
                );
                updatePropertyFilter("proprtyType", newData);
              }}
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

export default React.memo(PropertySelector);
