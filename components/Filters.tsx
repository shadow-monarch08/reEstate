import { View, Text, ScrollView, TouchableOpacity, Image } from "react-native";
import React, { useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import { areaRange, categories } from "@/constants/data";

export const Filters = () => {
  const params = useLocalSearchParams<{ filter?: string }>();
  const [selectedCategory, setSelectedCategory] = useState(
    params.filter || "All"
  );
  const handleFilterPress = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("All");
      router.setParams({ filter: "All" });
      return;
    }
    setSelectedCategory(category);
    console.log("Selected category:", category);
    router.setParams({ filter: category });
  };
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="pt-5"
      contentContainerClassName="gap-3 flex flex-row px-5"
    >
      {categories.map((item, index) => (
        <TouchableOpacity
          className={`py-3 px-5 h-32 w-36 rounded-3xl border-primary-200 border flex flex-col justify-between ${
            selectedCategory === item.category
              ? "bg-primary-300"
              : "bg-primary-100"
          }`}
          key={index}
          onPress={() => handleFilterPress(item.category)}
        >
          <View className="flex flex-row">
            <View
              className={`p-3 rounded-full ${
                selectedCategory === item.category
                  ? "bg-blue-700"
                  : "bg-primary-200"
              }`}
            >
              <Image
                source={item.icon}
                className="size-6"
                tintColor={
                  selectedCategory === item.category ? "white" : "#666876"
                }
              />
            </View>
          </View>
          <Text
            className={`text-sm mt-0.5 font-rubik ${
              selectedCategory === item.category
                ? "text-white"
                : "text-black-300"
            }`}
          >
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

export const Filters_small = () => {
  const params = useLocalSearchParams<{ filter?: string }>();
  const [selectedCategory, setSelectedCategory] = useState(
    params.filter || "All"
  );
  const handleFilterPress = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory("All");
      router.setParams({ filter: "All" });
      return;
    }
    setSelectedCategory(category);
    router.setParams({ filter: category });
  };
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="pt-5"
    >
      <View className="flex flex-row gap-2 px-5">
        {categories.map((item, index) => (
          <TouchableOpacity
            className={`py-2 px-3 rounded-full border-primary-200 border flex flex-row gap-2 items-center ${
              selectedCategory === item.category
                ? "bg-primary-300"
                : "bg-primary-100"
            }`}
            key={index}
            onPress={() => handleFilterPress(item.category)}
          >
            <Image
              source={item.icon}
              className="size-6"
              tintColor={
                selectedCategory === item.category ? "white" : "#666876"
              }
            />
            <Text
              className={`text-sm mt-0.5 font-rubik ${
                selectedCategory === item.category
                  ? "text-white"
                  : "text-black-300"
              }`}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export const Filter_area = () => {
  const params = useLocalSearchParams<{ area?: string }>();
  const [selectedCategory, setSelectedCategory] = useState(
    Number(params.area) || 0.5
  );
  const handleFilterPress = (category: number) => {
    if (selectedCategory === category) {
      setSelectedCategory(0.5);
      router.setParams({ area: "0.5" });
      return;
    }
    setSelectedCategory(category);
    router.setParams({ area: category.toString() });
  };
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="pt-5"
    >
      <View className="flex flex-row gap-2 px-5">
        {areaRange.map((item, index) => (
          <TouchableOpacity
            className={`py-2 px-3 rounded-full border-primary-200 border flex flex-row gap-2 items-center ${
              selectedCategory === item.value
                ? "bg-primary-300"
                : selectedCategory > item.value
                ? "bg-primary-200"
                : "bg-primary-100"
            }`}
            key={index}
            activeOpacity={0.7}
            onPress={() => handleFilterPress(item.value)}
          >
            <Image
              source={item.icon}
              className="size-6"
              tintColor={selectedCategory === item.value ? "white" : "#666876"}
            />
            <Text
              className={`text-sm mt-0.5 font-rubik ${
                selectedCategory === item.value
                  ? "text-white"
                  : "text-black-300"
              }`}
            >
              {item.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};
